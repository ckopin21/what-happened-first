from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
classic_path=root/'outputs'/'classic-jeopardy.html'
timeline_path=root/'outputs'/'dog-jeopardy.html'
classic_audit_path=root/'work'/'audit-classic.js'
timeline_audit_path=root/'work'/'audit-game.js'

s=classic_path.read_text(encoding='utf-8')
t=timeline_path.read_text(encoding='utf-8')


def one(text, old, new, label):
    n=text.count(old)
    if n < 1:
        raise RuntimeError(f'{label}: expected at least 1 occurrence, found {n}')
    return text.replace(old,new,1)


def rx(text, pattern, repl, label):
    out,n=re.subn(pattern,repl,text,count=1,flags=re.S)
    if n != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {n}')
    return out

# --- Timeline avatar framing ---
old_crop='''/* AVATAR_CROP_V4: constrain every avatar to its own grid cell and show the full artwork. */
.join-avatar,.host-avatar{min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important;contain:paint;isolation:isolate}
.join-avatar img,.host-avatar img{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;object-fit:contain!important;object-position:center!important;display:block!important;transform:none!important}
.phone-player-avatar,.player-avatar{object-fit:contain!important;object-position:center!important;transform:none!important;background:#0a2d45}'''
new_crop='''/* AVATAR_CROP_V5: zoom embedded art slightly so source-edge bleed never appears. */
.join-avatar,.host-avatar{min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important;contain:paint;isolation:isolate}
.join-avatar img,.host-avatar img{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;object-fit:cover!important;object-position:50% 50%!important;display:block!important;transform:scale(1.075)!important;transform-origin:50% 50%!important}
.phone-player-avatar,.player-avatar{object-fit:cover!important;object-position:50% 50%!important;background:#0a2d45;clip-path:circle(47% at 50% 50%);transform:scale(1.04)!important}'''
if 'AVATAR_CROP_V5' not in t:
    t=one(t,old_crop,new_crop,'timeline avatar crop')

# --- Classic Daily Double + two-part engine ---
if 'CLASSIC_DAILY_DOUBLE_V2' not in s:
    s=one(s,'/* CLASSIC_FULL_PHONE_PREVIEW_V1 */','''/* CLASSIC_DAILY_DOUBLE_V2 */
.daily-double-card{width:min(560px,96vw);text-align:center}.daily-double-title{font-size:clamp(34px,7vw,58px);font-weight:1000;color:var(--accent);text-shadow:0 4px 0 rgba(0,0,0,.28);margin-bottom:10px}.daily-double-wager{width:min(240px,90%);text-align:center;font-size:24px;margin:14px auto;display:block}.daily-double-note{font-size:13px;color:#cfe6f5;font-weight:900}.part-pill{background:#8dd7ff!important}
/* CLASSIC_FULL_PHONE_PREVIEW_V1 */''','Classic DD styles')

if 'id="dailyDoubleOverlay"' not in s:
    anchor='<section class="overlay" id="questionOverlay">'
    overlay='''<section class="overlay" id="dailyDoubleOverlay"><div class="modal-card daily-double-card"><div class="daily-double-title">DAILY DOUBLE</div><div class="question" id="dailyDoublePlayer"></div><div class="daily-double-note">Only the active player answers this clue.</div><input class="phone-input daily-double-wager" id="dailyDoubleWager" type="number" min="100" step="100" value="500"><div class="daily-double-note" id="dailyDoubleMax"></div><button class="gold" onclick="submitHostDailyWager()">Lock Wager & Start</button></div></section>\n'''
    s=one(s,anchor,overlay+anchor,'Classic DD overlay')

s=one(s,'const MAX_PLAYERS=5,GAME_VERSION="classic-2";','const MAX_PLAYERS=5,GAME_VERSION="classic-3";','Classic version')
s=one(s,
'''let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false;''',
'''let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false,pendingDaily=null,dailyDoubleIds=new Set();''','Classic special state')

s=one(s,'function getJoinUrl(){const url=new URL(location.href);url.searchParams.set("phone",roomCode);return url.href}',
'''function getJoinUrl(){const url=new URL("classic-jeopardy.html",location.href);url.search="";url.hash="";url.searchParams.set("mode","classic");url.searchParams.set("phone",roomCode);return url.href}''','Classic phone URL')

s=rx(s,r'function openClue\(ci,qi,playerIndex\)\{.*?\n\}\nfunction showQuestionHost\(\)\{',r'''function shuffleArray(values){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function pickDailyDoubles(){const eligible=[];categories.forEach((cat,ci)=>cat.clues.forEach((clue,qi)=>{if(clue&&clue.value>=300&&!clue.followup)eligible.push(clueId(ci,qi))}));dailyDoubleIds=new Set(shuffleArray(eligible).slice(0,Math.min(2,eligible.length)))}
function dailyMaxWager(){return Math.max(1000,Number(players[activePlayer]?.score)||0)}
function showDailyDouble(ci,qi){pendingDaily={ci,qi,playerIndex:activePlayer};const max=dailyMaxWager(),input=document.getElementById("dailyDoubleWager");if(input){input.max=max;input.value=Math.min(500,max)}document.getElementById("dailyDoublePlayer").textContent=`${players[activePlayer]?.name||"Player"}, make your wager`;document.getElementById("dailyDoubleMax").textContent=`Wager $100–${money(max)}`;document.getElementById("dailyDoubleOverlay").classList.add("showing");audioPop(520,.18,.05,"triangle");renderHost();broadcastState()}
function beginClassicClue(ci,qi,playerIndex,wager=null){
  if(current||!players.length)return false;if(Number.isInteger(playerIndex)&&playerIndex!==activePlayer)return false;
  const clue=categories[ci]?.clues?.[qi],id=clueId(ci,qi);if(!clue||used.has(id))return false;
  const mult=phaseMultiplier(),isDaily=Number.isFinite(wager),effective=isDaily?Number(wager):clue.value*mult;
  current={id,ci,qi,category:categories[ci].name,base:clue.value,mult,effective,question:clue.question,answer:clue.answer,aliases:Array.isArray(clue.aliases)&&clue.aliases.length?clue.aliases:[clue.answer],hint:clue.hint||"No hint available.",followup:clue.followup||null,part:1,partOneResults:null,primaryQuestion:clue.question,primaryAnswer:clue.answer,isDaily,dailyPlayer:isDaily?activePlayer:null};
  if(devForcedMultiplier){devForcedMultiplier=0;setDevArmed("")}
  pendingDaily=null;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;reviewRecord=null;showQuestionHost();renderHost();broadcastState();return true;
}
function openClue(ci,qi,playerIndex){
  if(current||pendingDaily||!players.length)return false;if(Number.isInteger(playerIndex)&&playerIndex!==activePlayer)return false;
  const clue=categories[ci]?.clues?.[qi],id=clueId(ci,qi);if(!clue||used.has(id))return false;
  if(dailyDoubleIds.has(id)){showDailyDouble(ci,qi);return true}
  return beginClassicClue(ci,qi,playerIndex,null);
}
function submitDailyWager(raw,index=activePlayer){if(!pendingDaily||current||index!==activePlayer)return false;const max=dailyMaxWager(),wager=Math.round(Number(raw));if(!Number.isFinite(wager)||wager<100||wager>max)return false;const {ci,qi}=pendingDaily;return beginClassicClue(ci,qi,index,wager)}
function submitHostDailyWager(){const input=document.getElementById("dailyDoubleWager");if(!submitDailyWager(input?.value,activePlayer))toast(`Wager must be $100–${money(dailyMaxWager())}`,"bad")}
function showQuestionHost(){''','Classic clue special flow')

s=one(s,
'function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.category;document.getElementById("qValue").textContent=money(current.effective);document.getElementById("hostQuestion").textContent=current.question;document.getElementById("hostProgress").textContent=`${submissions.size} of ${players.length} submitted`;document.getElementById("questionOverlay").classList.add("showing")}',
'function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("qValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.effective);document.getElementById("hostQuestion").textContent=current.question;const total=current.isDaily?1:players.length,count=current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size;document.getElementById("hostProgress").textContent=`${count} of ${total} submitted`;document.getElementById("questionOverlay").classList.add("showing")}',
'Classic host special status')
s=one(s,'function allSubmitted(){return players.length>0&&players.every((_p,i)=>submissions.has(i))}','function allSubmitted(){return current?.isDaily?submissions.has(current.dailyPlayer):players.length>0&&players.every((_p,i)=>submissions.has(i))}','Classic daily submission count')
s=one(s,
'questionRevealed=true;audioPop(720,.1,.04,"triangle");players.forEach((_p,i)=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});',
'questionRevealed=true;audioPop(720,.1,.04,"triangle");const judgeIndexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);judgeIndexes.forEach(i=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});','Classic daily judging')
s=one(s,
'function scoreDeltaFor(i,correct){if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(current.effective*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(current.effective*wrong)}',
'function scoreDeltaFor(i,correct){if(current?.isDaily){if(i!==current.dailyPlayer)return 0;return correct?current.effective:-current.effective}const base=current?.followup?current.effective/2:current.effective;if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(base*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(base*wrong)}','Classic special scoring')

s=rx(s,r'function renderRevealCurrent\(\)\{.*?\n\}\nfunction setJudgement',r'''function renderRevealCurrent(){
  if(!current)return;reviewRecord=null;document.getElementById("rCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("rValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.followup?current.effective/2:current.effective);document.getElementById("revealQuestionText").textContent=current.question;document.getElementById("correctAnswer").textContent=current.answer;
  const list=document.getElementById("answerList");list.innerHTML="";const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);indexes.forEach(i=>{const p=players[i],correct=!!judgements.get(i),answer=submissions.get(i)||"No answer",delta=scoreDeltaFor(i,correct),row=document.createElement("div");row.className=`answer-row ${correct?"correct":"wrong"}`;row.innerHTML=`<div class="answer-name"><span class="answer-avatar">${avatarIcon(p.avatar)}</span>${escapeHtml(p.name)}</div><div><div class="answer-text">${escapeHtml(answer)}</div><div class="answer-detail">${hintsUsed.has(i)?"💡 Hint used • ":""}${correct?`Would earn ${money(delta)}`:(delta?`Would change ${money(delta)}`:"No points")}</div></div><button class="judge ${correct?"green":"red"}" onclick="setJudgement(${i},${!correct})">${correct?"✓ Correct":"✕ Incorrect"}</button>`;list.appendChild(row)});
  document.getElementById("judgeNote").style.display="block";const apply=document.getElementById("applyScoresBtn");apply.style.display="inline-block";apply.textContent=current.followup&&current.part===1?"Continue to Part 2":"Apply Scores & Continue";document.getElementById("closeReviewBtn").style.display="none";
}
function setJudgement''','Classic reveal specials')

s=rx(s,r'function applyScores\(\)\{.*?\n\}\nfunction flashPlayer',r'''function applyScores(){
  if(!current||questionResolved)return;questionResolved=true;const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);
  const now=indexes.map(i=>({index:i,name:players[i].name,avatar:players[i].avatar,answer:submissions.get(i)||"",correct:!!judgements.get(i),hinted:hintsUsed.has(i),delta:scoreDeltaFor(i,!!judgements.get(i))}));
  if(current.followup&&current.part===1){current.partOneResults=now;current.part=2;current.question=current.followup.question;current.answer=current.followup.answer;current.aliases=Array.isArray(current.followup.aliases)&&current.followup.aliases.length?current.followup.aliases:[current.followup.answer];current.hint=current.followup.hint||"No hint available.";submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;document.getElementById("revealOverlay").classList.remove("showing");showQuestionHost();renderHost();broadcastState();toast("PART 2","neutral");return}
  const oldMult=current.mult,flashes=[],prior=Array.isArray(current.partOneResults)?current.partOneResults:[],answers=[];
  indexes.forEach(i=>{const p=players[i],a=now.find(x=>x.index===i),b=prior.find(x=>x.index===i),delta=(b?.delta||0)+(a?.delta||0),correct=current.followup?!!b?.correct&&!!a?.correct:!!a?.correct;p.score+=delta;if(correct){p.correctStreak=(p.correctStreak||0)+1;p.wrongStreak=0;flashes.push([i,"good"])}else{p.correctStreak=0;p.wrongStreak=(p.wrongStreak||0)+1;flashes.push([i,"bad"])}answers.push({name:p.name,avatar:p.avatar,answer:current.followup?`Part 1: ${b?.answer||"No answer"} • Part 2: ${a?.answer||"No answer"}`:(a?.answer||""),correct,hinted:!!b?.hinted||!!a?.hinted,delta})});
  const winners=answers.filter(a=>a.delta>0).map(a=>a.name),historyQuestion=current.followup?`Part 1: ${current.primaryQuestion} • Part 2: ${current.followup.question}`:current.question,historyAnswer=current.followup?`${current.primaryAnswer} / ${current.followup.answer}`:current.answer;history.set(current.id,{...current,question:historyQuestion,answer:historyAnswer,answers,winners});used.add(current.id);document.getElementById("revealOverlay").classList.remove("showing");document.getElementById("questionOverlay").classList.remove("showing");current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;if(players.length)activePlayer=(activePlayer+1)%players.length;renderHost();broadcastState();flashes.forEach(([i,type])=>flashPlayer(i,type));const newMult=phaseMultiplier();if(questionsRemaining()===0){setTimeout(showFinale,500)}else if(newMult!==oldMult&&newMult>1){showPhaseOverlay(newMult===3?"TRIPLE POINTS":"DOUBLE POINTS")}
}
function flashPlayer''','Classic two-part scoring flow')

s=rx(s,r'function hostStateForPlayer\(index\)\{.*?\n\}\nfunction sendState',r'''function hostStateForPlayer(index){
  const base={type:"state",version:GAME_VERSION,room:roomCode,pack:{title:PACK.title,subtitle:PACK.subtitle,genre:PACK.genre},players:publicPlayers(),playerIndex:Number.isInteger(index)?index:null,activePlayer,phase:phaseMultiplier(),remaining:questionsRemaining(),board:boardState()};
  if(!Number.isInteger(index)||!players[index])return{...base,mode:"join"};
  if(finalShown){const ranking=players.map((p,i)=>({name:p.name,score:p.score,avatar:p.avatar,index:i})).sort((a,b)=>b.score-a.score);return{...base,mode:"final",ranking}}
  if(pendingDaily){return index===activePlayer?{...base,mode:"daily-wager",maxWager:dailyMaxWager()}:{...base,mode:"wait-daily",dailyPlayer:players[activePlayer]?.name||"Active player"}}
  if(current){const common={...base,current:{category:current.category,value:current.followup?current.effective/2:current.effective,question:current.question,hint:!current.isDaily&&hintsUsed.has(index)?current.hint:null,isDaily:!!current.isDaily,part:current.part||1,parts:current.followup?2:1},submittedCount:current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size,totalPlayers:current.isDaily?1:players.length,hintUsed:hintsUsed.has(index)};if(current.isDaily&&index!==current.dailyPlayer)return{...common,mode:"wait-daily",dailyPlayer:players[current.dailyPlayer]?.name||"Active player"};if(questionRevealed){const correct=!!judgements.get(index),delta=scoreDeltaFor(index,correct);return{...common,mode:"reveal",correctAnswer:current.answer,yourAnswer:submissions.get(index)||"No answer",correct,delta}}if(submissions.has(index))return{...common,mode:"submitted",yourAnswer:submissions.get(index)};return{...common,mode:"answer"}}
  return{...base,mode:index===activePlayer?"choose":"wait"};
}
function sendState''','Classic phone special state')

old_remote='''if(action.type==="select"){if(i!==activePlayer||current)return;openClue(Number(action.ci),Number(action.qi),i);return}
  if(action.type==="use-hint"){if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}
  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}'''
new_remote='''if(action.type==="select"){if(i!==activePlayer||current||pendingDaily)return;openClue(Number(action.ci),Number(action.qi),i);return}
  if(action.type==="daily-wager"){if(i!==activePlayer||!pendingDaily||current)return;submitDailyWager(action.wager,i);return}
  if(action.type==="use-hint"){if(!current||current.isDaily||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}
  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i)||(current.isDaily&&i!==current.dailyPlayer))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}'''
s=one(s,old_remote,new_remote,'Classic remote special actions')

s=s.replace('cell.disabled=!players.length||!!current;','cell.disabled=!players.length||!!current||!!pendingDaily;')
s=s.replace('function setActivePlayer(i){if(current||i<0||i>=players.length)return;','function setActivePlayer(i){if(current||pendingDaily||i<0||i>=players.length)return;')
s=s.replace('const disabled=index!==activePlayer||!!current;','const disabled=index!==activePlayer||!!current||!!pendingDaily;')
s=s.replace('if(classicPreviewPlayerIndex!==activePlayer||current||connectedForPlayer(classicPreviewPlayerIndex))return;','if(classicPreviewPlayerIndex!==activePlayer||current||pendingDaily||connectedForPlayer(classicPreviewPlayerIndex))return;')
s=s.replace('function classicPreviewHint(){const i=classicPreviewPlayerIndex;if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i)||connectedForPlayer(i))return;', 'function classicPreviewHint(){const i=classicPreviewPlayerIndex;if(!current||current.isDaily||questionRevealed||submissions.has(i)||hintsUsed.has(i)||connectedForPlayer(i))return;')
s=s.replace('function classicPreviewSubmit(){\n  const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewAnswer");if(!current||questionRevealed||submissions.has(i)||connectedForPlayer(i))return;', 'function classicPreviewSubmit(){\n  const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewAnswer");if(!current||questionRevealed||submissions.has(i)||connectedForPlayer(i)||(current.isDaily&&i!==current.dailyPlayer))return;')

# Phone Daily Double wagering and special labels.
s=one(s,'function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}',
'''function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}
function submitPhoneDailyWager(){if(phoneState?.mode!=="daily-wager"||!phoneConn?.open)return;const wager=Number(document.getElementById("phoneDailyWager")?.value);if(!Number.isFinite(wager)||wager<100||wager>phoneState.maxWager)return;phoneConn.send({type:"daily-wager",wager})}''','Classic phone DD action')

choose='if(phoneState.mode==="choose"){view.innerHTML=`<div class="waiting"><div class="big">YOUR PICK</div><div class="phone-small">Choose the next question. Everyone will answer it.</div></div>${renderPhoneBoard()}`;return}'
s=one(s,choose,choose+'''\n  if(phoneState.mode==="daily-wager"){view.innerHTML=`<div class="waiting"><div class="big" style="color:var(--accent)">DAILY DOUBLE</div><div class="phone-small">Only you answer this clue.</div><input class="phone-input" id="phoneDailyWager" type="number" min="100" max="${phoneState.maxWager}" step="100" value="${Math.min(500,phoneState.maxWager)}" style="margin-top:14px;text-align:center"><div class="phone-small">Wager $100–${money(phoneState.maxWager)}</div><button class="gold phone-btn" onclick="submitPhoneDailyWager()">Lock Wager & Start</button></div>`;return}\n  if(phoneState.mode==="wait-daily"){view.innerHTML=`<div class="waiting"><div class="big">DAILY DOUBLE</div><div class="phone-small">${escapeHtml(phoneState.dailyPlayer||"The active player")} is playing this clue alone.</div></div>`;return}''','Classic phone DD render')

s=s.replace('<span class="badge">${escapeHtml(phoneState.current.category)}</span><span class="badge secondary">${money(phoneState.current.value)}</span>', '<span class="badge">${escapeHtml(phoneState.current.category)}${phoneState.current.parts===2?` • PART ${phoneState.current.part} OF 2`:``}</span><span class="badge secondary">${phoneState.current.isDaily?`DAILY DOUBLE • `:``}${money(phoneState.current.value)}</span>')

# Preview Daily Double wager flow, preserving preview-only restrictions for real connected phones.
insert_after='''function classicPreviewSubmit(){
  const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewAnswer");if(!current||questionRevealed||submissions.has(i)||connectedForPlayer(i)||(current.isDaily&&i!==current.dailyPlayer))return;const answer=(input?.value||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);
}'''
if 'function classicPreviewDailyWager()' not in s:
    s=one(s,insert_after,insert_after+'''\nfunction classicPreviewDailyWager(){const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewDailyWager");if(i!==activePlayer||connectedForPlayer(i)||!pendingDaily)return;submitDailyWager(input?.value,i)}''','Classic preview DD action')

preview_branch='''  if(finalShown){const ranked=players.map((x,j)=>({...x,index:j})).sort((a,b)=>b.score-a.score),top=ranked[0]?.score;inner+=`<div class="waiting"><div class="big">FINAL RANKING</div>${ranked.map((x,pos)=>`<div style="margin:8px 0;font-weight:1000;color:${x.score===top?'#ffd166':'#fff'}">#${pos+1} ${avatarIcon(x.avatar)} ${escapeHtml(x.name)} — ${money(x.score)}</div>`).join("")}</div>`}
  else if(!current){'''
preview_new='''  if(finalShown){const ranked=players.map((x,j)=>({...x,index:j})).sort((a,b)=>b.score-a.score),top=ranked[0]?.score;inner+=`<div class="waiting"><div class="big">FINAL RANKING</div>${ranked.map((x,pos)=>`<div style="margin:8px 0;font-weight:1000;color:${x.score===top?'#ffd166':'#fff'}">#${pos+1} ${avatarIcon(x.avatar)} ${escapeHtml(x.name)} — ${money(x.score)}</div>`).join("")}</div>`}
  else if(pendingDaily){inner+=i===activePlayer?`<div class="waiting"><div class="big" style="color:var(--accent)">DAILY DOUBLE</div><div class="phone-small">Only you answer this clue.</div><input class="phone-input" id="classicPreviewDailyWager" type="number" min="100" max="${dailyMaxWager()}" step="100" value="${Math.min(500,dailyMaxWager())}" style="margin-top:14px;text-align:center"><div class="phone-small">Wager $100–${money(dailyMaxWager())}</div><button class="gold phone-btn" onclick="classicPreviewDailyWager()" ${connected?'disabled':''}>Lock Wager & Start</button></div>`:`<div class="waiting"><div class="big">DAILY DOUBLE</div><div class="phone-small">${escapeHtml(players[activePlayer]?.name||"The active player")} is playing this clue alone.</div></div>`}
  else if(!current){'''
s=one(s,preview_branch,preview_new,'Classic preview DD render')
s=s.replace('<span class="badge">${escapeHtml(current.category)}</span><span class="badge secondary">${money(current.effective)}</span>', '<span class="badge">${escapeHtml(current.category)}${current.followup?` • PART ${current.part} OF 2`:``}</span><span class="badge secondary">${current.isDaily?`DAILY DOUBLE • `:``}${money(current.followup?current.effective/2:current.effective)}</span>')

# More resilient real-phone connection: keep retrying transient peer-unavailable failures.
old_init='''function initPhone(room){document.body.classList.add("phone-mode");document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;initAvatarPicker();if(typeof Peer==="undefined"){document.getElementById("joinStatus").textContent="Phone networking failed to load.";return}phonePeer=new Peer(undefined,{debug:0});phonePeer.on("open",()=>{phoneConn=phonePeer.connect(hostPeerId(room),{reliable:true});phoneConn.on("open",()=>{document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connected`;document.getElementById("joinStatus").textContent="";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);if(token)phoneConn.send({type:"rejoin",token})});phoneConn.on("data",msg=>{if(msg?.type==="state"){phoneState=msg;renderPhone()}else if(msg?.type==="joined"){if(msg.token)sessionStorage.setItem(PHONE_TOKEN_KEY,msg.token)}else if(msg?.type==="join-error")document.getElementById("joinStatus").textContent=msg.message||"Could not join."});phoneConn.on("close",()=>{document.getElementById("joinStatus").textContent="Disconnected. Reload to reconnect."})});phonePeer.on("error",()=>{document.getElementById("joinStatus").textContent="Could not connect to the host."})}'''
new_init='''let phoneReconnectTimer=null;
function connectPhoneToHost(room){
  if(!phonePeer||phonePeer.destroyed)return;clearTimeout(phoneReconnectTimer);document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;document.getElementById("joinStatus").textContent="Connecting to host…";try{phoneConn?.close()}catch{}phoneConn=phonePeer.connect(hostPeerId(room),{reliable:true,metadata:{game:GAME_VERSION}});const retry=()=>{clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)};
  phoneConn.on("open",()=>{document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connected`;document.getElementById("joinStatus").textContent="";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);if(token)phoneConn.send({type:"rejoin",token})});phoneConn.on("data",msg=>{if(msg?.type==="state"){phoneState=msg;renderPhone()}else if(msg?.type==="joined"){if(msg.token)sessionStorage.setItem(PHONE_TOKEN_KEY,msg.token)}else if(msg?.type==="join-error")document.getElementById("joinStatus").textContent=msg.message||"Could not join."});phoneConn.on("close",()=>{document.getElementById("joinStatus").textContent="Connection lost — reconnecting…";retry()});phoneConn.on("error",()=>retry());
}
function initPhone(room){document.body.classList.add("phone-mode");document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;initAvatarPicker();if(typeof Peer==="undefined"){document.getElementById("joinStatus").textContent="Phone networking failed to load.";return}phonePeer=new Peer(undefined,{debug:0});phonePeer.on("open",()=>connectPhoneToHost(room));phonePeer.on("disconnected",()=>{try{phonePeer.reconnect()}catch{}});phonePeer.on("error",err=>{if(err?.type==="peer-unavailable"){document.getElementById("joinStatus").textContent="Host not found yet — retrying…";clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)}else document.getElementById("joinStatus").textContent=`Connection error${err?.type?`: ${err.type}`:""}`})}'''
s=one(s,old_init,new_init,'Classic resilient phone join')

# Initialize and reset hidden Daily Doubles every game.
s=one(s,'function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();','function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();pickDailyDoubles();','Classic init DD')
s=one(s,
'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");','Classic new game DD reset')
s=one(s,
'function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
'function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");','Classic reset DD')

# Update the stale developer preview copy now that Daily Double is a real solo mechanic.
s=s.replace('Presentation preview for the Daily Double state. Classic still keeps everyone answering the question.','Presentation preview for the Daily Double state. Only the active player wagers and answers.')

classic_path.write_text(s,encoding='utf-8')
timeline_path.write_text(t,encoding='utf-8')

# --- Audits: make regressions fail loudly ---
a=classic_audit_path.read_text(encoding='utf-8')
if 'twoPartCount' not in a:
    anchor="for(const category of pack.categories){\n  if(!category.name||!Array.isArray(category.clues)||!category.clues.length)throw new Error('Invalid category in Classic question pack');\n  for(const clue of category.clues){\n    if(!Number.isFinite(clue.value)||!clue.question||!clue.answer||!Array.isArray(clue.aliases)||!clue.aliases.length)throw new Error(`Invalid clue in ${category.name}`);\n  }\n}\n"
    if anchor not in a: raise RuntimeError('Classic audit category anchor missing')
    a=a.replace(anchor,anchor+"const twoPartCount=pack.categories.flatMap(category=>category.clues).filter(clue=>clue.followup).length;\nif(twoPartCount<5)throw new Error('Classic pack must include at least five two-part clues');\n",1)
if 'CLASSIC_DAILY_DOUBLE_V2' not in a:
    needle="  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2'\n];"
    repl="  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2',\n  'CLASSIC_DAILY_DOUBLE_V2','pendingDaily','dailyDoubleIds','daily-wager','classic-3','searchParams.set(\\\"mode\\\",\\\"classic\\\")','connectPhoneToHost'\n];"
    if needle not in a: raise RuntimeError('Classic audit required marker anchor missing')
    a=a.replace(needle,repl,1)
classic_audit_path.write_text(a,encoding='utf-8')

g=timeline_audit_path.read_text(encoding='utf-8')
g=g.replace('AVATAR_CROP_V4','AVATAR_CROP_V5')
timeline_audit_path.write_text(g,encoding='utf-8')

# Final defensive checks before Actions runs Node audits.
for marker in ['CLASSIC_DAILY_DOUBLE_V2','pendingDaily','dailyDoubleIds','submitDailyWager','followup:clue.followup||null','connectPhoneToHost','searchParams.set("mode","classic")']:
    if marker not in s: raise RuntimeError(f'Missing Classic marker after patch: {marker}')
if 'AVATAR_CROP_V5' not in t: raise RuntimeError('Timeline avatar crop v5 missing after patch')
print('classic-specials-v6 applied')
