from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
path=root/'outputs'/'dog-jeopardy.html'
s=path.read_text(encoding='utf-8')

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1: raise RuntimeError(f'{label}: expected 1, found {n}')
    s=s.replace(old,new,1)

def rx(pattern,repl,label):
    global s
    s2,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'{label}: expected 1, found {n}')
    s=s2

pairs=[
('special:true,fq:"About how many years apart were these milestones?",fa:"About one year — Spotify launched in 2008 and Uber was founded in 2009."}',
 'special:true,fq:"About how many years apart were these milestones?",fa:"About one year — Spotify launched in 2008 and Uber was founded in 2009.",fchoices:["About 1 year","About 2 years","About 3 years","About 5 years"],fcorrect:"About 1 year"}'),
('special:true,fq:"In which decade did the earlier event happen?",fa:"The 1880s — the Eiffel Tower opened in 1889."}',
 'special:true,fq:"In which decade did the earlier event happen?",fa:"The 1880s — the Eiffel Tower opened in 1889.",fchoices:["1870s","1880s","1890s","1900s"],fcorrect:"1880s"}'),
('special:true,fq:"How many years apart were these launches?",fa:"Two years — Fortnite Battle Royale released in 2017 and Disney+ launched in 2019."}',
 'special:true,fq:"How many years apart were these launches?",fa:"Two years — Fortnite Battle Royale released in 2017 and Disney+ launched in 2019.",fchoices:["1 year","2 years","3 years","5 years"],fcorrect:"2 years"}'),
('special:true,fq:"In what year did Hubble launch?",fa:"1990."}',
 'special:true,fq:"In what year did Hubble launch?",fa:"1990.",fchoices:["1988","1990","1992","1994"],fcorrect:"1990"}'),
('special:true,fq:"How many years apart were these achievements?",fa:"One year — Bolt set the record in 2009 and Spain won the World Cup in 2010."}',
 'special:true,fq:"How many years apart were these achievements?",fa:"One year — Bolt set the record in 2009 and Spain won the World Cup in 2010.",fchoices:["1 year","2 years","3 years","4 years"],fcorrect:"1 year"}')]
for old,new in pairs: one(old,new,'follow-up data')

rx(r'function followupChoicesFor\(item\)\{.*?\n\}\nfunction renderFollowupChoices\(\)\{', '''function shuffledFollowupChoices(values){
  const out=Array.isArray(values)?values.slice():[];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function followupChoicesFor(item){return Array.isArray(item?.fchoices)?item.fchoices.slice():[]}
function followupCorrectFor(item){return String(item?.fcorrect||"")}
function ensureFollowupOrder(){if(!current)return[];const base=followupChoicesFor(current.item);if(!Array.isArray(current.followOrder)||current.followOrder.length!==base.length)current.followOrder=shuffledFollowupChoices(base);return current.followOrder}
function renderFollowupChoices(){''','follow-up helper')

one('const choices=followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;',
    'const choices=ensureFollowupOrder(),selected=Number.isInteger(current.followChoice)?current.followChoice:null;','host choice order')
one('if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    'if(label===followupCorrectFor(current.item))b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")','host follow correct')
one('if(!current)return;const box=document.getElementById("phoneFollowChoices");if(!box)return;const choices=current.item.fc||followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;box.innerHTML="";',
    'if(!current)return;const box=document.getElementById("phoneFollowChoices");if(!box)return;const choices=current.followOrder||current.item.fc||followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;box.innerHTML="";','phone choice order')
one('if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    'if(label===followupCorrectFor(current.item))b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")','phone follow correct')
one('current.followChoice=null;\n  document.getElementById("followQuestion").textContent=current.item.fq;',
    'current.followChoice=null;\n  current.followOrder=shuffledFollowupChoices(followupChoicesFor(current.item));\n  document.getElementById("followQuestion").textContent=current.item.fq;','shuffle on start')
one('const choices=followupChoicesFor(current.item);if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  current.followChoice=index;const correct=choices[index]===current.item.fa;',
    'const choices=ensureFollowupOrder();if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  current.followChoice=index;const correct=choices[index]===followupCorrectFor(current.item);','score shuffled follow-up')

old='current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fc:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null}:null,'
new='current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fchoices:current.item.fchoices,fcorrect:current.item.fcorrect,fc:Array.isArray(current.followOrder)?current.followOrder:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null,followOrder:Array.isArray(current.followOrder)?current.followOrder:null}:null,'
one(old,new,'network follow-up state')

one('/* AVATAR_CROP_V2: top-biased framing avoids clipping faces/heads in square and circular crops. */\n.join-avatar img,.phone-player-avatar,.player-avatar,.host-avatar img{object-position:50% 32%!important}', '''/* AVATAR_CROP_V4: constrain every avatar to its own grid cell and show the full artwork. */
.join-avatar,.host-avatar{min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important;contain:paint;isolation:isolate}
.join-avatar img,.host-avatar img{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;object-fit:contain!important;object-position:center!important;display:block!important;transform:none!important}
.phone-player-avatar,.player-avatar{object-fit:contain!important;object-position:center!important;transform:none!important;background:#0a2d45}''','avatar crop')

path.write_text(s,encoding='utf-8')
print('timeline-v4 applied')
