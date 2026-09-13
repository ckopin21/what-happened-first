from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
timeline_path = ROOT / "outputs" / "dog-jeopardy.html"
classic_path = ROOT / "outputs" / "classic-jeopardy.html"
pack_path = ROOT / "packs" / "classic" / "current.js"
index_path = ROOT / "index.html"
audit_timeline_path = ROOT / "work" / "audit-game.js"
audit_classic_path = ROOT / "work" / "audit-classic.js"


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=re.S):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 regex match, found {count}")
    return out

# ---------------------------------------------------------------------------
# What Happened First? follow-ups + avatar framing
# ---------------------------------------------------------------------------
t = timeline_path.read_text(encoding="utf-8")

special_replacements = {
    'special:true,fq:"About how many years apart were these milestones?",fa:"About one year — Spotify launched in 2008 and Uber was founded in 2009."}':
    'special:true,fq:"About how many years apart were these milestones?",fa:"About one year — Spotify launched in 2008 and Uber was founded in 2009.",fchoices:["About 1 year","About 2 years","About 3 years","About 5 years"],fcorrect:"About 1 year"}',
    'special:true,fq:"In which decade did the earlier event happen?",fa:"The 1880s — the Eiffel Tower opened in 1889."}':
    'special:true,fq:"In which decade did the earlier event happen?",fa:"The 1880s — the Eiffel Tower opened in 1889.",fchoices:["1870s","1880s","1890s","1900s"],fcorrect:"1880s"}',
    'special:true,fq:"How many years apart were these launches?",fa:"Two years — Fortnite Battle Royale released in 2017 and Disney+ launched in 2019."}':
    'special:true,fq:"How many years apart were these launches?",fa:"Two years — Fortnite Battle Royale released in 2017 and Disney+ launched in 2019.",fchoices:["1 year","2 years","3 years","5 years"],fcorrect:"2 years"}',
    'special:true,fq:"In what year did Hubble launch?",fa:"1990."}':
    'special:true,fq:"In what year did Hubble launch?",fa:"1990.",fchoices:["1988","1990","1992","1994"],fcorrect:"1990"}',
    'special:true,fq:"How many years apart were these achievements?",fa:"One year — Bolt set the record in 2009 and Spain won the World Cup in 2010."}':
    'special:true,fq:"How many years apart were these achievements?",fa:"One year — Bolt set the record in 2009 and Spain won the World Cup in 2010.",fchoices:["1 year","2 years","3 years","4 years"],fcorrect:"1 year"}',
}
for old, new in special_replacements.items():
    t = replace_once(t, old, new, "timeline special follow-up data")

# Replace the old stale/fallback follow-up helper with data-driven choices and a host-side shuffle.
t = regex_once(
    t,
    r'function followupChoicesFor\(item\)\{.*?\n\}\nfunction renderFollowupChoices\(\)\{',
    '''function shuffledFollowupChoices(values){
  const out=Array.isArray(values)?values.slice():[];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function followupChoicesFor(item){return Array.isArray(item?.fchoices)?item.fchoices.slice():[]}
function followupCorrectFor(item){return String(item?.fcorrect||"")}
function ensureFollowupOrder(){
  if(!current)return [];
  const base=followupChoicesFor(current.item);
  if(!Array.isArray(current.followOrder)||current.followOrder.length!==base.length)current.followOrder=shuffledFollowupChoices(base);
  return current.followOrder;
}
function renderFollowupChoices(){''',
    "timeline follow-up helper",
)

t = replace_once(
    t,
    'const choices=followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;',
    'const choices=ensureFollowupOrder(),selected=Number.isInteger(current.followChoice)?current.followChoice:null;',
    "timeline host follow-up choices",
)
t = replace_once(
    t,
    'if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    'if(label===followupCorrectFor(current.item))b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    "timeline host follow-up correctness class",
)
t = replace_once(
    t,
    'if(!current)return;const box=document.getElementById("phoneFollowChoices");if(!box)return;const choices=current.item.fc||followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;box.innerHTML="";',
    'if(!current)return;const box=document.getElementById("phoneFollowChoices");if(!box)return;const choices=current.followOrder||current.item.fc||followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;box.innerHTML="";',
    "timeline phone follow-up choices",
)
t = replace_once(
    t,
    'if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    'if(label===followupCorrectFor(current.item))b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")',
    "timeline phone follow-up correctness class",
)
t = replace_once(
    t,
    'current.followChoice=null;\n  document.getElementById("followQuestion").textContent=current.item.fq;',
    'current.followChoice=null;\n  current.followOrder=shuffledFollowupChoices(followupChoicesFor(current.item));\n  document.getElementById("followQuestion").textContent=current.item.fq;',
    "timeline follow-up shuffle on start",
)
t = replace_once(
    t,
    'const choices=followupChoicesFor(current.item);if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  current.followChoice=index;const correct=choices[index]===current.item.fa;',
    'const choices=ensureFollowupOrder();if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  current.followChoice=index;const correct=choices[index]===followupCorrectFor(current.item);',
    "timeline follow-up scoring",
)

old_snapshot = 'current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fc:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null}:null,'
new_snapshot = 'current:current?{key:current.key,base:current.base,mult:current.mult,value:current.value,lastChanceMult:current.lastChanceMult,isDaily:!!current.isDaily,item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fchoices:current.item.fchoices,fcorrect:current.item.fcorrect,fc:Array.isArray(current.followOrder)?current.followOrder:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null,followOrder:Array.isArray(current.followOrder)?current.followOrder:null}:null,'
t = replace_once(t, old_snapshot, new_snapshot, "timeline network follow-up state")

old_crop = '/* AVATAR_CROP_V2: top-biased framing avoids clipping faces/heads in square and circular crops. */\n.join-avatar img,.phone-player-avatar,.player-avatar,.host-avatar img{object-position:50% 32%!important}'
new_crop = '''/* AVATAR_CROP_V3: contain the artwork and remove intrinsic-size/grid overflow. */
.join-avatar,.host-avatar{min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important;contain:paint;isolation:isolate}
.join-avatar img,.host-avatar img{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;object-fit:contain!important;object-position:50% 50%!important;display:block!important;transform:none!important;clip-path:circle(49% at 50% 50%)}
.phone-player-avatar,.player-avatar{object-fit:contain!important;object-position:50% 50%!important;transform:none!important;background:#0a2d45}'''
t = replace_once(t, old_crop, new_crop, "timeline avatar crop v3")

timeline_path.write_text(t, encoding="utf-8")

# Strengthen the timeline audit for the follow-up contract.
a = audit_timeline_path.read_text(encoding="utf-8")
marker = 'const questionIssues = [];\n'
addition = '''const followupIssues = [];
'''
if 'const followupIssues = [];' not in a:
    a = replace_once(a, marker, marker + addition, "timeline audit followup declaration")
loop_tail = '''    if ((clue.choices || []).length !== 2 || matches.length !== 1 || !clue.h) {
      questionIssues.push({ category: category.name, row: row + 1, matches: matches.length });
    }
'''
loop_new = loop_tail + '''    if (clue.special) {
      const fc = clue.fchoices || [];
      const banned = /^(all|none|not enough|cannot determine)/i;
      if (fc.length !== 4 || !clue.fcorrect || !fc.includes(clue.fcorrect) || fc.some(x => banned.test(String(x)))) {
        followupIssues.push({ category: category.name, row: row + 1 });
      }
    }
'''
if 'followupIssues.push' not in a:
    a = replace_once(a, loop_tail, loop_new, "timeline audit followup validation")
a = replace_once(a, '  questionIssues,\n  duplicateIds,', '  questionIssues,\n  followupIssues,\n  duplicateIds,', "timeline audit output")
a = replace_once(a, 'if (questionIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;', 'if (questionIssues.length || followupIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;', "timeline audit failure condition")
audit_timeline_path.write_text(a, encoding="utf-8")

# ---------------------------------------------------------------------------
# Classic pack: five real two-part 500-point clues.
# ---------------------------------------------------------------------------
p = pack_path.read_text(encoding="utf-8")
pack_repls = {
    '{ value: 500, question: "What South American country has Portuguese as its official language?", answer: "Brazil", aliases: ["Brazil"], hint: "It is the continent\'s largest country." }':
    '{ value: 500, question: "What South American country has Portuguese as its official language?", answer: "Brazil", aliases: ["Brazil"], hint: "It is the continent\'s largest country.", followup: { question: "What is the capital of Brazil?", answer: "Brasília", aliases: ["Brasilia", "Brasília"], hint: "It replaced Rio de Janeiro as the capital in 1960." } }',
    '{ value: 500, question: "Mansa Musa ruled what West African empire?", answer: "The Mali Empire", aliases: ["Mali", "Mali Empire", "The Mali Empire"], hint: "Its name is also a modern country." }':
    '{ value: 500, question: "Mansa Musa ruled what West African empire?", answer: "The Mali Empire", aliases: ["Mali", "Mali Empire", "The Mali Empire"], hint: "Its name is also a modern country.", followup: { question: "Mansa Musa made his famous 1324 pilgrimage to what holy city?", answer: "Mecca", aliases: ["Mecca", "Makkah"], hint: "It is Islam\'s holiest city." } }',
    '{ value: 500, question: "What scientist formulated the three laws of motion?", answer: "Isaac Newton", aliases: ["Isaac Newton", "Newton", "Sir Isaac Newton"], hint: "He is also associated with universal gravitation." }':
    '{ value: 500, question: "What scientist formulated the three laws of motion?", answer: "Isaac Newton", aliases: ["Isaac Newton", "Newton", "Sir Isaac Newton"], hint: "He is also associated with universal gravitation.", followup: { question: "What 1687 work did Newton publish that presented his laws of motion?", answer: "Principia Mathematica", aliases: ["Principia", "Principia Mathematica", "Philosophiae Naturalis Principia Mathematica"], hint: "Its shortened title is usually just Principia." } }',
    '{ value: 500, question: "What TV series is set around Hawkins, Indiana and the Upside Down?", answer: "Stranger Things", aliases: ["Stranger Things"], hint: "Eleven is one of its main characters." }':
    '{ value: 500, question: "What TV series is set around Hawkins, Indiana and the Upside Down?", answer: "Stranger Things", aliases: ["Stranger Things"], hint: "Eleven is one of its main characters.", followup: { question: "What tabletop role-playing game do the kids frequently play in Stranger Things?", answer: "Dungeons & Dragons", aliases: ["Dungeons and Dragons", "Dungeons & Dragons", "D&D", "DnD"], hint: "The Demogorgon gets its nickname from this game." } }',
    '{ value: 500, question: "How many tournaments make up a calendar-year Grand Slam in tennis?", answer: "Four", aliases: ["4", "Four", "4 tournaments", "Four tournaments"], hint: "Australian, French, Wimbledon, and US." }':
    '{ value: 500, question: "How many tournaments make up a calendar-year Grand Slam in tennis?", answer: "Four", aliases: ["4", "Four", "4 tournaments", "Four tournaments"], hint: "Australian, French, Wimbledon, and US.", followup: { question: "Which Grand Slam tournament is played on clay courts?", answer: "The French Open", aliases: ["French Open", "The French Open", "Roland Garros", "Roland-Garros"], hint: "It is held in Paris." } }',
}
for old, new in pack_repls.items():
    p = replace_once(p, old, new, "classic two-part pack clue")
pack_path.write_text(p, encoding="utf-8")

# ---------------------------------------------------------------------------
# Classic engine: Daily Doubles, two-part flow, and resilient phone joining.
# ---------------------------------------------------------------------------
c = classic_path.read_text(encoding="utf-8")

# Styling + DD host overlay.
css_anchor = '/* CLASSIC_FULL_PHONE_PREVIEW_V1 */'
css_add = '''/* CLASSIC_DAILY_DOUBLE_V1 */
.daily-double-card{width:min(560px,96vw);text-align:center}.daily-double-title{font-size:clamp(34px,7vw,58px);font-weight:1000;color:var(--accent);text-shadow:0 4px 0 rgba(0,0,0,.28);margin-bottom:10px}.daily-double-wager{width:min(240px,90%);text-align:center;font-size:24px;margin:14px auto;display:block}.daily-double-note{font-size:13px;color:#cfe6f5;font-weight:900}.two-part-badge{background:#8dd7ff!important}
'''
if 'CLASSIC_DAILY_DOUBLE_V1' not in c:
    c = replace_once(c, css_anchor, css_add + css_anchor, "classic DD CSS")

html_anchor = '<section class="overlay" id="revealOverlay">'
daily_html = '''<section class="overlay" id="dailyDoubleOverlay"><div class="modal-card daily-double-card"><div class="daily-double-title">DAILY DOUBLE</div><div class="question" id="dailyDoublePlayer"></div><div class="daily-double-note">Only the active player answers this clue. Wager between $100 and your allowed maximum.</div><input class="phone-input daily-double-wager" id="dailyDoubleWager" type="number" min="100" step="100" value="500"><div class="daily-double-note" id="dailyDoubleMax"></div><button class="gold" onclick="submitHostDailyWager()">Lock Wager & Start</button></div></section>\n'''
if 'id="dailyDoubleOverlay"' not in c:
    c = replace_once(c, html_anchor, daily_html + html_anchor, "classic DD overlay")

# Engine version/state.
c = replace_once(c, 'const MAX_PLAYERS=5,GAME_VERSION="classic-2";', 'const MAX_PLAYERS=5,GAME_VERSION="classic-3";', "classic game version")
c = replace_once(
    c,
    'let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false;',
    'let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false,pendingDaily=null,dailyDoubleIds=new Set();',
    "classic DD state",
)

# Classic-specific join URL that also survives opening from the root selector.
c = replace_once(
    c,
    'function getJoinUrl(){const url=new URL(location.href);url.searchParams.set("phone",roomCode);return url.href}',
    'function getJoinUrl(){const url=new URL("classic-jeopardy.html",location.href);url.search="";url.searchParams.set("mode","classic");url.searchParams.set("phone",roomCode);url.hash="";return url.href}',
    "classic join URL",
)

# Insert daily-double helpers immediately before openClue and replace openClue itself.
open_pattern = r'function openClue\(ci,qi,playerIndex\)\{.*?\n\}\nfunction showQuestionHost\(\)\{'
open_repl = '''function shuffleArray(values){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function pickDailyDoubles(){
  const eligible=[];categories.forEach((cat,ci)=>cat.clues.forEach((clue,qi)=>{if(clue&&clue.value>=300&&!clue.followup)eligible.push(clueId(ci,qi))}));
  dailyDoubleIds=new Set(shuffleArray(eligible).slice(0,Math.min(2,eligible.length)));
}
function dailyMaxWager(){return Math.max(1000,Number(players[activePlayer]?.score)||0)}
function showDailyDouble(ci,qi){
  pendingDaily={ci,qi,playerIndex:activePlayer};const max=dailyMaxWager();const input=document.getElementById("dailyDoubleWager");if(input){input.max=max;input.value=Math.min(500,max)}
  document.getElementById("dailyDoublePlayer").textContent=`${players[activePlayer]?.name||"Player"}, make your wager`;
  document.getElementById("dailyDoubleMax").textContent=`Maximum wager: ${money(max)}`;document.getElementById("dailyDoubleOverlay").classList.add("showing");
  audioPop(520,.18,.05,"triangle");broadcastState();renderHost();
}
function beginClassicClue(ci,qi,playerIndex,wager=null){
  if(current||!players.length)return false;if(Number.isInteger(playerIndex)&&playerIndex!==activePlayer)return false;
  const clue=categories[ci]?.clues?.[qi],id=clueId(ci,qi);if(!clue||used.has(id))return false;
  const mult=phaseMultiplier(),isDaily=Number.isFinite(wager),effective=isDaily?Number(wager):clue.value*mult;
  current={id,ci,qi,category:categories[ci].name,base:clue.value,mult,effective,question:clue.question,answer:clue.answer,aliases:Array.isArray(clue.aliases)&&clue.aliases.length?clue.aliases:[clue.answer],hint:clue.hint||"No hint available.",followup:clue.followup||null,part:1,partOneResults:null,isDaily,dailyPlayer:isDaily?activePlayer:null};
  if(devForcedMultiplier){devForcedMultiplier=0;setDevArmed("");}
  pendingDaily=null;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;reviewRecord=null;
  showQuestionHost();renderHost();broadcastState();return true;
}
function openClue(ci,qi,playerIndex){
  if(current||pendingDaily||!players.length)return false;if(Number.isInteger(playerIndex)&&playerIndex!==activePlayer)return false;
  const clue=categories[ci]?.clues?.[qi],id=clueId(ci,qi);if(!clue||used.has(id))return false;
  if(dailyDoubleIds.has(id)){showDailyDouble(ci,qi);return true}
  return beginClassicClue(ci,qi,playerIndex,null);
}
function submitDailyWager(raw,index=activePlayer){
  if(!pendingDaily||current||index!==activePlayer)return false;const max=dailyMaxWager(),wager=Math.round(Number(raw));if(!Number.isFinite(wager)||wager<100||wager>max)return false;
  const {ci,qi}=pendingDaily;return beginClassicClue(ci,qi,index,wager);
}
function submitHostDailyWager(){const input=document.getElementById("dailyDoubleWager");if(!submitDailyWager(input?.value,activePlayer)){toast(`Wager must be $100–${money(dailyMaxWager())}`,"bad")}}
function showQuestionHost(){'''
c = regex_once(c, open_pattern, open_repl, "classic open clue/DD flow")

# Host question UI: part label and DD submission counts.
c = replace_once(
    c,
    'function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.category;document.getElementById("qValue").textContent=money(current.effective);document.getElementById("hostQuestion").textContent=current.question;document.getElementById("hostProgress").textContent=`${submissions.size} of ${players.length} submitted`;document.getElementById("questionOverlay").classList.add("showing")}',
    'function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("qValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.effective);document.getElementById("hostQuestion").textContent=current.question;const total=current.isDaily?1:players.length;const count=current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size;document.getElementById("hostProgress").textContent=`${count} of ${total} submitted`;document.getElementById("questionOverlay").classList.add("showing")}',
    "classic host question status",
)
c = replace_once(
    c,
    'function allSubmitted(){return players.length>0&&players.every((_p,i)=>submissions.has(i))}',
    'function allSubmitted(){return current?.isDaily?submissions.has(current.dailyPlayer):players.length>0&&players.every((_p,i)=>submissions.has(i))}',
    "classic all submitted DD",
)

# Reveal only the Daily Double player when appropriate.
c = replace_once(
    c,
    'questionRevealed=true;audioPop(720,.1,.04,"triangle");players.forEach((_p,i)=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});',
    'questionRevealed=true;audioPop(720,.1,.04,"triangle");const judgeIndexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);judgeIndexes.forEach(i=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});',
    "classic DD reveal judging",
)

# Per-part scoring: two-part clues split the displayed value evenly; Daily Double loses wager on a miss.
c = replace_once(
    c,
    'function scoreDeltaFor(i,correct){if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(current.effective*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(current.effective*wrong)}',
    'function scoreDeltaFor(i,correct){if(current?.isDaily){if(i!==current.dailyPlayer)return 0;return correct?current.effective:-current.effective}const partBase=current?.followup?current.effective/2:current.effective;if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(partBase*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(partBase*wrong)}',
    "classic DD/two-part scoring",
)

# Replace reveal rendering so DD shows one player and Part 1 button clearly advances to Part 2.
render_pattern = r'function renderRevealCurrent\(\)\{.*?\n\}\nfunction setJudgement'
render_repl = '''function renderRevealCurrent(){
  if(!current)return;reviewRecord=null;document.getElementById("rCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("rValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.effective);document.getElementById("revealQuestionText").textContent=current.question;document.getElementById("correctAnswer").textContent=current.answer;
  const list=document.getElementById("answerList");list.innerHTML="";const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);indexes.forEach(i=>{const p=players[i],correct=!!judgements.get(i),answer=submissions.get(i)||"No answer";const row=document.createElement("div");row.className=`answer-row ${correct?"correct":"wrong"}`;const delta=scoreDeltaFor(i,correct);row.innerHTML=`<div class="answer-name"><span class="answer-avatar">${avatarIcon(p.avatar)}</span>${escapeHtml(p.name)}</div><div><div class="answer-text">${escapeHtml(answer)}</div><div class="answer-detail">${hintsUsed.has(i)?"💡 Hint used • ":""}${correct?`Would earn ${money(delta)}`:(delta?`Would change ${money(delta)}`:"No points")}</div></div><button class="judge ${correct?"green":"red"}" onclick="setJudgement(${i},${!correct})">${correct?"✓ Correct":"✕ Incorrect"}</button>`;list.appendChild(row)});
  document.getElementById("judgeNote").style.display="block";const apply=document.getElementById("applyScoresBtn");apply.style.display="inline-block";apply.textContent=current.followup&&current.part===1?"Continue to Part 2":"Apply Scores & Continue";document.getElementById("closeReviewBtn").style.display="none";
}
function setJudgement'''
c = regex_once(c, render_pattern, render_repl, "classic reveal renderer")

# Replace applyScores with a two-stage implementation.
apply_pattern = r'function applyScores\(\)\{.*?\n\}\nfunction flashPlayer'
apply_repl = '''function applyScores(){
  if(!current||questionResolved)return;questionResolved=true;
  const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);
  const partAnswers=indexes.map(i=>({index:i,name:players[i].name,avatar:players[i].avatar,answer:submissions.get(i)||"",correct:!!judgements.get(i),hinted:hintsUsed.has(i),delta:scoreDeltaFor(i,!!judgements.get(i))}));
  if(current.followup&&current.part===1){
    current.partOneResults=partAnswers;current.part=2;current.question=current.followup.question;current.answer=current.followup.answer;current.aliases=Array.isArray(current.followup.aliases)&&current.followup.aliases.length?current.followup.aliases:[current.followup.answer];current.hint=current.followup.hint||"No hint available.";
    submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;document.getElementById("revealOverlay").classList.remove("showing");showQuestionHost();renderHost();broadcastState();toast("PART 2","neutral");return;
  }
  const oldMult=current.mult,flashes=[],partOne=Array.isArray(current.partOneResults)?current.partOneResults:[];
  const finalAnswers=[];
  indexes.forEach(i=>{const p=players[i],now=partAnswers.find(a=>a.index===i),prior=partOne.find(a=>a.index===i),delta=(prior?.delta||0)+(now?.delta||0),fullyCorrect=current.followup?!!prior?.correct&&!!now?.correct:!!now?.correct;p.score+=delta;if(fullyCorrect){p.correctStreak=(p.correctStreak||0)+1;p.wrongStreak=0;flashes.push([i,"good"])}else{p.correctStreak=0;p.wrongStreak=(p.wrongStreak||0)+1;flashes.push([i,"bad"])}finalAnswers.push({name:p.name,avatar:p.avatar,answer:current.followup?`Part 1: ${prior?.answer||"No answer"} • Part 2: ${now?.answer||"No answer"}`:(now?.answer||""),correct:fullyCorrect,hinted:!!prior?.hinted||!!now?.hinted,delta})});
  const winners=finalAnswers.filter(a=>a.delta>0).map(a=>a.name);history.set(current.id,{...current,question:current.followup?`Two-part clue: ${categories[current.ci].clues[current.qi].question} / ${current.followup.question}`:current.question,answer:current.followup?`${categories[current.ci].clues[current.qi].answer} / ${current.followup.answer}`:current.answer,answers:finalAnswers,winners});used.add(current.id);document.getElementById("revealOverlay").classList.remove("showing");document.getElementById("questionOverlay").classList.remove("showing");
  current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;if(players.length)activePlayer=(activePlayer+1)%players.length;
  renderHost();broadcastState();flashes.forEach(([i,type])=>flashPlayer(i,type));const newMult=phaseMultiplier();if(questionsRemaining()===0){setTimeout(showFinale,500)}else if(newMult!==oldMult&&newMult>1){showPhaseOverlay(newMult===3?"TRIPLE POINTS":"DOUBLE POINTS")}
}
function flashPlayer'''
c = regex_once(c, apply_pattern, apply_repl, "classic two-part apply scores")

# Host state supports DD wager/wait, parts, and hides hint on a DD.
host_state_pattern = r'function hostStateForPlayer\(index\)\{.*?\n\}\nfunction sendState'
host_state_repl = '''function hostStateForPlayer(index){
  const base={type:"state",version:GAME_VERSION,room:roomCode,pack:{title:PACK.title,subtitle:PACK.subtitle,genre:PACK.genre},players:publicPlayers(),playerIndex:Number.isInteger(index)?index:null,activePlayer,phase:phaseMultiplier(),remaining:questionsRemaining(),board:boardState()};
  if(!Number.isInteger(index)||!players[index])return{...base,mode:"join"};
  if(finalShown){const ranking=players.map((p,i)=>({name:p.name,score:p.score,avatar:p.avatar,index:i})).sort((a,b)=>b.score-a.score);return{...base,mode:"final",ranking}}
  if(pendingDaily){if(index===activePlayer)return{...base,mode:"daily-wager",maxWager:dailyMaxWager()};return{...base,mode:"wait-daily",dailyPlayer:players[activePlayer]?.name||"Active player"}}
  if(current){
    const common={...base,current:{category:current.category,value:current.effective,question:current.question,hint:!current.isDaily&&hintsUsed.has(index)?current.hint:null,isDaily:!!current.isDaily,part:current.part||1,parts:current.followup?2:1},submittedCount:current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size,totalPlayers:current.isDaily?1:players.length,hintUsed:hintsUsed.has(index)};
    if(current.isDaily&&index!==current.dailyPlayer)return{...common,mode:"wait-daily",dailyPlayer:players[current.dailyPlayer]?.name||"Active player"};
    if(questionRevealed){const correct=!!judgements.get(index),delta=scoreDeltaFor(index,correct);return{...common,mode:"reveal",correctAnswer:current.answer,yourAnswer:submissions.get(index)||"No answer",correct,delta}}
    if(submissions.has(index))return{...common,mode:"submitted",yourAnswer:submissions.get(index)};return{...common,mode:"answer"};
  }
  return{...base,mode:index===activePlayer?"choose":"wait"};
}
function sendState'''
c = regex_once(c, host_state_pattern, host_state_repl, "classic phone state")

# Remote DD wager + DD restrictions.
c = replace_once(
    c,
    'if(action.type==="select"){if(i!==activePlayer||current)return;openClue(Number(action.ci),Number(action.qi),i);return}\n  if(action.type==="use-hint"){if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}\n  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}',
    'if(action.type==="select"){if(i!==activePlayer||current||pendingDaily)return;openClue(Number(action.ci),Number(action.qi),i);return}\n  if(action.type==="daily-wager"){if(i!==activePlayer||!pendingDaily||current)return;submitDailyWager(action.wager,i);return}\n  if(action.type==="use-hint"){if(!current||current.isDaily||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}\n  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i)||(current.isDaily&&i!==current.dailyPlayer))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}',
    "classic remote DD actions",
)

# Host board unavailable while a DD wager is pending.
c = c.replace('cell.disabled=!players.length||!!current;', 'cell.disabled=!players.length||!!current||!!pendingDaily;')

# Phone actions/render for DD.
c = replace_once(
    c,
    'function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}',
    'function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}\nfunction submitPhoneDailyWager(){if(phoneState?.mode!=="daily-wager"||!phoneConn?.open)return;const wager=Number(document.getElementById("phoneDailyWager")?.value);if(!Number.isFinite(wager)||wager<100||wager>phoneState.maxWager)return;phoneConn.send({type:"daily-wager",wager})}',
    "classic phone DD wager action",
)

phone_render_anchor = 'if(phoneState.mode==="answer"){'
phone_render_insert = '''if(phoneState.mode==="daily-wager"){view.innerHTML=`<div class="waiting"><div class="big" style="color:var(--accent)">DAILY DOUBLE</div><div class="phone-small">Only you answer this clue.</div><input class="phone-input" id="phoneDailyWager" type="number" min="100" max="${phoneState.maxWager}" step="100" value="${Math.min(500,phoneState.maxWager)}" style="margin-top:14px;text-align:center"><div class="phone-small">Wager $100–${money(phoneState.maxWager)}</div><button class="gold phone-btn" onclick="submitPhoneDailyWager()">Lock Wager & Start</button></div>`;return}
  if(phoneState.mode==="wait-daily"){view.innerHTML=`<div class="waiting"><div class="big">DAILY DOUBLE</div><div class="phone-small">${escapeHtml(phoneState.dailyPlayer||"The active player")} is playing this clue alone.</div></div>`;return}
  '''
if 'phoneState.mode==="daily-wager"' not in c:
    c = replace_once(c, phone_render_anchor, phone_render_insert + phone_render_anchor, "classic phone DD render")

# Part label in the normal phone answer/reveal question display.
c = c.replace('<span class="badge">${escapeHtml(phoneState.current.category)}</span><span class="badge secondary">${money(phoneState.current.value)}</span>', '<span class="badge">${escapeHtml(phoneState.current.category)}${phoneState.current.parts===2?` • PART ${phoneState.current.part} OF 2`:``}</span><span class="badge secondary">${phoneState.current.isDaily?`DAILY DOUBLE • `:``}${money(phoneState.current.value)}</span>')

# Robust reconnecting phone client. Keeps the same session token and retries transient PeerJS failures.
init_phone_pattern = r'function initPhone\(room\)\{.*?\n\}\n\n\nfunction setDeveloperMode'
init_phone_repl = '''let phoneReconnectTimer=null;
function connectPhoneToHost(room){
  if(!phonePeer||phonePeer.destroyed)return;clearTimeout(phoneReconnectTimer);document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;document.getElementById("joinStatus").textContent="Connecting to host…";
  try{phoneConn?.close()}catch{}phoneConn=phonePeer.connect(hostPeerId(room),{reliable:true,metadata:{game:GAME_VERSION}});
  const retry=()=>{clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)};
  phoneConn.on("open",()=>{document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connected`;document.getElementById("joinStatus").textContent="";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);if(token)phoneConn.send({type:"rejoin",token})});
  phoneConn.on("data",msg=>{if(msg?.type==="state"){phoneState=msg;renderPhone()}else if(msg?.type==="joined"){if(msg.token)sessionStorage.setItem(PHONE_TOKEN_KEY,msg.token)}else if(msg?.type==="join-error")document.getElementById("joinStatus").textContent=msg.message||"Could not join."});
  phoneConn.on("close",()=>{document.getElementById("joinStatus").textContent="Connection lost — reconnecting…";retry()});phoneConn.on("error",()=>retry());
}
function initPhone(room){
  document.body.classList.add("phone-mode");document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;initAvatarPicker();if(typeof Peer==="undefined"){document.getElementById("joinStatus").textContent="Phone networking failed to load.";return}
  phonePeer=new Peer(undefined,{debug:0});phonePeer.on("open",()=>connectPhoneToHost(room));phonePeer.on("disconnected",()=>{try{phonePeer.reconnect()}catch{}});phonePeer.on("error",err=>{if(err?.type==="peer-unavailable"){document.getElementById("joinStatus").textContent="Host not found yet — retrying…";clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)}else document.getElementById("joinStatus").textContent=`Connection error${err?.type?`: ${err.type}`:""}`});
}


function setDeveloperMode'''
c = regex_once(c, init_phone_pattern, init_phone_repl, "classic resilient phone join")

# Init/reset DD selection.
c = replace_once(
    c,
    'function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();',
    'function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();pickDailyDoubles();',
    "classic initial DD selection",
)
c = replace_once(
    c,
    'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
    'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");',
    "classic new game DD reset",
)
c = replace_once(
    c,
    'function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
    'function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");',
    "classic reset DD reset",
)

classic_path.write_text(c, encoding="utf-8")

# Root mode selector routes phone links to the correct engine.
i = index_path.read_text(encoding="utf-8")n