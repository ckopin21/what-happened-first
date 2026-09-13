from pathlib import Path

root=Path(__file__).resolve().parents[1]
game_path=root/'outputs'/'dog-jeopardy.html'
audit_path=root/'work'/'audit-game.js'
s=game_path.read_text(encoding='utf-8')

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {n}')
    s=s.replace(old,new,1)

# Give each primary clue its own shuffled display order while keeping the canonical
# answer data untouched. Review mode reuses the order that was actually played.
one(
'''  const forcedMultiplier=!isReview ? devForcedMultiplier : 0;
  current={key,item,base,mult,value:base*mult*lcMult,lastChanceMult:lcMult,forcedMultiplier};''',
'''  const forcedMultiplier=!isReview ? devForcedMultiplier : 0;
  const baseChoices=Array.isArray(item.choices)?item.choices.slice():[];
  const choiceOrder=isReview&&Array.isArray(item.playedChoiceOrder)&&item.playedChoiceOrder.length===baseChoices.length
    ? item.playedChoiceOrder.slice()
    : shuffledPrimaryChoices(baseChoices);
  current={key,item,base,mult,value:base*mult*lcMult,lastChanceMult:lcMult,forcedMultiplier,choiceOrder};''',
'primary choice order on open')

# Add the shuffle helper immediately before choice normalization.
one(
'''function normalizeChoiceText(text){
''',
'''function shuffledPrimaryChoices(values){
  const out=Array.isArray(values)?values.slice():[];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function primaryChoicesForCurrent(){
  if(!current)return[];
  const base=Array.isArray(current.item?.choices)?current.item.choices:[];
  if(!Array.isArray(current.choiceOrder)||current.choiceOrder.length!==base.length)current.choiceOrder=shuffledPrimaryChoices(base);
  return current.choiceOrder;
}
function normalizeChoiceText(text){
''',
'primary shuffle helpers')

# Both host and phone use the same helper. There are exactly two renderers.
old_render='''  const choices=current?.item?.choices||[];
  const correct=getCorrectChoice();
  choices.forEach(choice=>{'''
new_render='''  const choices=primaryChoicesForCurrent();
  const correct=getCorrectChoice();
  choices.forEach(choice=>{'''
render_matches=s.count(old_render)
if render_matches!=2:
    raise RuntimeError(f'primary rendering: expected exactly 2 matches, found {render_matches}')
s=s.replace(old_render,new_render,2)

# Preserve the played order for used-clue review.
one(
'''  current.item.playedMult=current.mult;
  current.item.outcome=outcome;''',
'''  current.item.playedMult=current.mult;
  current.item.playedChoiceOrder=Array.isArray(current.choiceOrder)?current.choiceOrder.slice():[];
  current.item.outcome=outcome;''',
'persist played primary order')

# Include the shuffled order in authoritative snapshots so remote phones never
# independently reshuffle and always see exactly what the host sees.
one(
'''current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fchoices:current.item.fchoices,fcorrect:current.item.fcorrect,fc:Array.isArray(current.followOrder)?current.followOrder:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null,followOrder:Array.isArray(current.followOrder)?current.followOrder:null}:null,''',
'''current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,choiceOrder:Array.isArray(current.choiceOrder)?current.choiceOrder.slice():[],item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fchoices:current.item.fchoices,fcorrect:current.item.fcorrect,fc:Array.isArray(current.followOrder)?current.followOrder:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null,followOrder:Array.isArray(current.followOrder)?current.followOrder:null}:null,''',
'network primary order')

# The host was showing the follow-up offer locally but not immediately broadcasting
# that phase transition to real phones. Broadcast it as soon as the primary answer
# unlocks the two-part choice.
one(
'''      document.getElementById("followOffer").classList.add("visible");
      syncPhoneQuestionView();
      showToast("Primary answer correct","good");''',
'''      document.getElementById("followOffer").classList.add("visible");
      syncPhoneQuestionView();
      broadcastGameState(true);
      showToast("Primary answer correct","good");''',
'follow-up offer broadcast')

game_path.write_text(s,encoding='utf-8')

# Strengthen the audit so these regressions cannot silently return.
a=audit_path.read_text(encoding='utf-8')
old='''if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CROP_V5")) throw new Error("Randomized follow-up/avatar framing fix missing");
'''
new='''const specials=categories.flatMap((category)=>category.clues.map((clue,row)=>({category:category.name,row,clue}))).filter(x=>x.clue.special);
if(specials.length!==5||specials.some(x=>x.row!==4||!x.clue.fq||!x.clue.fa)) throw new Error("Expected five playable 500-point follow-up clues");
if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CROP_V5")) throw new Error("Randomized follow-up/avatar framing fix missing");
if(!html.includes("shuffledPrimaryChoices")||!html.includes("primaryChoicesForCurrent")||!html.includes("choiceOrder:Array.isArray(current.choiceOrder)")||!html.includes('broadcastGameState(true);\\n      showToast("Primary answer correct"')) throw new Error("Primary choice shuffle or follow-up broadcast fix missing");
'''
if old not in a:
    raise RuntimeError('audit marker block not found')
a=a.replace(old,new,1)
audit_path.write_text(a,encoding='utf-8')
print('timeline choice/follow-up v6 applied')
