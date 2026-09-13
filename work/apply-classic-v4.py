from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
path=root/'outputs'/'classic-jeopardy.html'
audit_path=root/'work'/'audit-classic.js'
s=path.read_text(encoding='utf-8')

def one(old,new,label):
    global s
    n=s.count(old)
    if n<1: raise RuntimeError(f'{label}: expected at least 1, found {n}')
    s=s.replace(old,new,1)

def rx(pattern,repl,label):
    global s
    out,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'{label}: expected 1, found {n}')
    s=out

# Styles and host Daily Double wager overlay.
anchor='/* CLASSIC_FULL_PHONE_PREVIEW_V1 */'
if 'CLASSIC_DAILY_DOUBLE_V1' not in s:
    one(anchor,'''/* CLASSIC_DAILY_DOUBLE_V1 */
.daily-double-card{width:min(560px,96vw);text-align:center}.daily-double-title{font-size:clamp(34px,7vw,58px);font-weight:1000;color:var(--accent);text-shadow:0 4px 0 rgba(0,0,0,.28);margin-bottom:10px}.daily-double-wager{width:min(240px,90%);text-align:center;font-size:24px;margin:14px auto;display:block}.daily-double-note{font-size:13px;color:#cfe6f5;font-weight:900}.part-pill{background:#8dd7ff!important}
'''+anchor,'DD styles')

question_overlay='<section class="overlay" id="questionOverlay">'
if 'id="dailyDoubleOverlay"' not in s:
    one(question_overlay,'''<section class="overlay" id="dailyDoubleOverlay"><div class="modal-card daily-double-card"><div class="daily-double-title">DAILY DOUBLE</div><div class="question" id="dailyDoublePlayer"></div><div class="daily-double-note">Only the active player answers this clue.</div><input class="phone-input daily-double-wager" id="dailyDoubleWager" type="number" min="100" step="100" value="500"><div class="daily-double-note" id="dailyDoubleMax"></div><button class="gold" onclick="submitHostDailyWager()">Lock Wager & Start</button></div></section>\n'''+question_overlay,'DD overlay')

one('const MAX_PLAYERS=5,GAME_VERSION="classic-2";','const MAX_PLAYERS=5,GAME_VERSION="classic-3";','game version')
one('let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false;',
    'let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false,pendingDaily=null,dailyDoubleIds=new Set();','DD state')

one('function getJoinUrl(){const url=new URL(location.href);url.searchParams.set("phone",roomCode);return url.href}',
    'function getJoinUrl(){const url=new URL("classic-jeopardy.html",location.href);url.search="";url.searchParams.set("mode","classic");url.searchParams.set("phone",roomCode);url.hash="";return url.href}','Classic join URL')

# Replace clue opening with real hidden Daily Doubles and two-part metadata.
rx(r'function openClue\(ci,qi,playerIndex\)\{.*?\n\}\nfunction showQuestionHost\(\)\{', '''function shuffleArray(values){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
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
function showQuestionHost(){''','open clue/DD flow')

one('function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.category;document.getElementById("qValue").textContent=money(current.effective);document.getElementById("hostQuestion").textContent=current.question;document.getElementById("hostProgress").textContent=`${submissions.size} of ${players.length} submitted`;document.getElementById("questionOverlay").classList.add("showing")}',
    'function showQuestionHost(){if(!current)return;document.getElementById("qCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("qValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.effective);document.getElementById("hostQuestion").textContent=current.question;const total=current.isDaily?1:players.length,count=current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size;document.getElementById("hostProgress").textContent=`${count} of ${total} submitted`;document.getElementById("questionOverlay").classList.add("showing")}','host question status')
one('function allSubmitted(){return players.length>0&&players.every((_p,i)=>submissions.has(i))}',
    'function allSubmitted(){return current?.isDaily?submissions.has(current.dailyPlayer):players.length>0&&players.every((_p,i)=>submissions.has(i))}','DD all submitted')
one('questionRevealed=true;audioPop(720,.1,.04,"triangle");players.forEach((_p,i)=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});',
    'questionRevealed=true;audioPop(720,.1,.04,"triangle");const judgeIndexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);judgeIndexes.forEach(i=>{const answer=submissions.get(i)||"";judgements.set(i,!!answer&&fuzzyMatch(answer,current.aliases))});','DD judging')
one('function scoreDeltaFor(i,correct){if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(current.effective*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(current.effective*wrong)}',
    'function scoreDeltaFor(i,correct){if(current?.isDaily){if(i!==current.dailyPlayer)return 0;return correct?current.effective:-current.effective}const base=current?.followup?current.effective/2:current.effective;if(correct){const hintMult=hintsUsed.has(i)?Number(PACK.rules?.hintMultiplier??0.5):1;return Math.round(base*hintMult)}const wrong=Number(PACK.rules?.wrongMultiplier??0);return Math.round(base*wrong)}','DD/two-part scoring')

rx(r'function renderRevealCurrent\(\)\{.*?\n\}\nfunction setJudgement', '''function renderRevealCurrent(){
  if(!current)return;reviewRecord=null;document.getElementById("rCategory").textContent=current.followup?`${current.category} • PART ${current.part} OF 2`:current.category;document.getElementById("rValue").textContent=current.isDaily?`DAILY DOUBLE • ${money(current.effective)}`:money(current.effective);document.getElementById("revealQuestionText").textContent=current.question;document.getElementById("correctAnswer").textContent=current.answer;
  const list=document.getElementById("answerList");list.innerHTML="";const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);indexes.forEach(i=>{const p=players[i],correct=!!judgements.get(i),answer=submissions.get(i)||"No answer",delta=scoreDeltaFor(i,correct),row=document.createElement("div");row.className=`answer-row ${correct?"correct":"wrong"}`;row.innerHTML=`<div class="answer-name"><span class="answer-avatar">${avatarIcon(p.avatar)}</span>${escapeHtml(p.name)}</div><div><div class="answer-text">${escapeHtml(answer)}</div><div class="answer-detail">${hintsUsed.has(i)?"💡 Hint used • ":""}${correct?`Would earn ${money(delta)}`:(delta?`Would change ${money(delta)}`:"No points")}</div></div><button class="judge ${correct?"green":"red"}" onclick="setJudgement(${i},${!correct})">${correct?"✓ Correct":"✕ Incorrect"}</button>`;list.appendChild(row)});
  document.getElementById("judgeNote").style.display="block";const apply=document.getElementById("applyScoresBtn");apply.style.display="inline-block";apply.textContent=current.followup&&current.part===1?"Continue to Part 2":"Apply Scores & Continue";document.getElementById("closeReviewBtn").style.display="none";
}
function setJudgement''','reveal renderer')

rx(r'function applyScores\(\)\{.*?\n\}\nfunction flashPlayer', '''function applyScores(){
  if(!current||questionResolved)return;questionResolved=true;const indexes=current.isDaily?[current.dailyPlayer]:players.map((_p,i)=>i);
  const now=indexes.map(i=>({index:i,name:players[i].name,avatar:players[i].avatar,answer:submissions.get(i)||"",correct:!!judgements.get(i),hinted:hintsUsed.has(i),delta:scoreDeltaFor(i,!!judgements.get(i))}));
  if(current.followup&&current.part===1){current.partOneResults=now;current.part=2;current.question=current.followup.question;current.answer=current.followup.answer;current.aliases=Array.isArray(current.followup.aliases)&&current.followup.aliases.length?current.followup.aliases:[current.followup.answer];current.hint=current.followup.hint||"No hint available.";submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;document.getElementById("revealOverlay").classList.remove("showing");showQuestionHost();renderHost();broadcastState();toast("PART 2","neutral");return}
  const oldMult=current.mult,flashes=[],prior=Array.isArray(current.partOneResults)?current.partOneResults:[],answers=[];
  indexes.forEach(i=>{const p=players[i],a=now.find(x=>x.index===i),b=prior.find(x=>x.index===i),delta=(b?.delta||0)+(a?.delta||0),correct=current.followup?!!b?.correct&&!!a?.correct:!!a?.correct;p.score+=delta;if(correct){p.correctStreak=(p.correctStreak||0)+1;p.wrongStreak=0;flashes.push([i,"good"])}else{p.correctStreak=0;p.wrongStreak=(p.wrongStreak||0)+1;flashes.push([i,"bad"])}answers.push({name:p.name,avatar:p.avatar,answer:current.followup?`Part 1: ${b?.answer||"No answer"} • Part 2: ${a?.answer||"No answer"}`:(a?.answer||""),correct,hinted:!!b?.hinted||!!a?.hinted,delta})});
  const winners=answers.filter(a=>a.delta>0).map(a=>a.name),historyQuestion=current.followup?`Part 1: ${current.primaryQuestion} • Part 2: ${current.followup.question}`:current.question,historyAnswer=current.followup?`${current.primaryAnswer} / ${current.followup.answer}`:current.answer;history.set(current.id,{...current,question:historyQuestion,answer:historyAnswer,answers,winners});used.add(current.id);document.getElementById("revealOverlay").classList.remove("showing");document.getElementById("questionOverlay").classList.remove("showing");current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;if(players.length)activePlayer=(activePlayer+1)%players.length;renderHost();broadcastState();flashes.forEach(([i,type])=>flashPlayer(i,type));const newMult=phaseMultiplier();if(questionsRemaining()===0){setTimeout(showFinale,500)}else if(newMult!==oldMult&&newMult>1){showPhaseOverlay(newMult===3?"TRIPLE POINTS":"DOUBLE POINTS")}
}
function flashPlayer''','two-part apply scores')

# Network state: Daily Double wager is private to active player; two-part labels travel to phones.
rx(r'function hostStateForPlayer\(index\)\{.*?\n\}\nfunction sendState', '''function hostStateForPlayer(index){
  const base={type:"state",version:GAME_VERSION,room:roomCode,pack:{title:PACK.title,subtitle:PACK.subtitle,genre:PACK.genre},players:publicPlayers(),playerIndex:Number.isInteger(index)?index:null,activePlayer,phase:phaseMultiplier(),remaining:questionsRemaining(),board:boardState()};
  if(!Number.isInteger(index)||!players[index])return{...base,mode:"join"};
  if(finalShown){const ranking=players.map((p,i)=>({name:p.name,score:p.score,avatar:p.avatar,index:i})).sort((a,b)=>b.score-a.score);return{...base,mode:"final",ranking}}
  if(pendingDaily){return index===activePlayer?{...base,mode:"daily-wager",maxWager:dailyMaxWager()}:{...base,mode:"wait-daily",dailyPlayer:players[activePlayer]?.name||"Active player"}}
  if(current){const common={...base,current:{category:current.category,value:current.effective,question:current.question,hint:!current.isDaily&&hintsUsed.has(index)?current.hint:null,isDaily:!!current.isDaily,part:current.part||1,parts:current.followup?2:1},submittedCount:current.isDaily?(submissions.has(current.dailyPlayer)?1:0):submissions.size,totalPlayers:current.isDaily?1:players.length,hintUsed:hintsUsed.has(index)};if(current.isDaily&&index!==current.dailyPlayer)return{...common,mode:"wait-daily",dailyPlayer:players[current.dailyPlayer]?.name||"Active player"};if(questionRevealed){const correct=!!judgements.get(index),delta=scoreDeltaFor(index,correct);return{...common,mode:"reveal",correctAnswer:current.answer,yourAnswer:submissions.get(index)||"No answer",correct,delta}}if(submissions.has(index))return{...common,mode:"submitted",yourAnswer:submissions.get(index)};return{...common,mode:"answer"}}
  return{...base,mode:index===activePlayer?"choose":"wait"};
}
function sendState''','phone state')

one('if(action.type==="select"){if(i!==activePlayer||current)return;openClue(Number(action.ci),Number(action.qi),i);return}\n  if(action.type==="use-hint"){if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}\n  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}',
    'if(action.type==="select"){if(i!==activePlayer||current||pendingDaily)return;openClue(Number(action.ci),Number(action.qi),i);return}\n  if(action.type==="daily-wager"){if(i!==activePlayer||!pendingDaily||current)return;submitDailyWager(action.wager,i);return}\n  if(action.type==="use-hint"){if(!current||current.isDaily||questionRevealed||submissions.has(i)||hintsUsed.has(i))return;hintsUsed.add(i);broadcastState();return}\n  if(action.type==="submit-answer"){if(!current||questionRevealed||submissions.has(i)||(current.isDaily&&i!==current.dailyPlayer))return;const answer=String(action.answer||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);return}','remote DD actions')

# Host board/preview cannot pick another clue while wager is pending.
s=s.replace('cell.disabled=!players.length||!!current;','cell.disabled=!players.length||!!current||!!pendingDaily;')
s=s.replace('const disabled=index!==activePlayer||!!current;','const disabled=index!==activePlayer||!!current||!!pendingDaily;')
s=s.replace('if(classicPreviewPlayerIndex!==activePlayer||current||connectedForPlayer(classicPreviewPlayerIndex))return;','if(classicPreviewPlayerIndex!==activePlayer||current||pendingDaily||connectedForPlayer(classicPreviewPlayerIndex))return;')

# Phone Daily Double controls.
one('function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}',
    'function phoneSelect(ci,qi){if(phoneState?.mode!=="choose"||!phoneConn?.open)return;phoneConn.send({type:"select",ci,qi})}\nfunction submitPhoneDailyWager(){if(phoneState?.mode!=="daily-wager"||!phoneConn?.open)return;const wager=Number(document.getElementById("phoneDailyWager")?.value);if(!Number.isFinite(wager)||wager<100||wager>phoneState.maxWager)return;phoneConn.send({type:"daily-wager",wager})}','phone DD action')

choose_mode='if(phoneState.mode==="choose"){view.innerHTML=`<div class="waiting"><div class="big">YOUR PICK</div><div class="phone-small">Choose the next question. Everyone will answer it.</div></div>${renderPhoneBoard()}`;return}'
one(choose_mode,choose_mode+'\n  if(phoneState.mode==="daily-wager"){view.innerHTML=`<div class="waiting"><div class="big" style="color:var(--accent)">DAILY DOUBLE</div><div class="phone-small">Only you answer this clue.</div><input class="phone-input" id="phoneDailyWager" type="number" min="100" max="${phoneState.maxWager}" step="100" value="${Math.min(500,phoneState.maxWager)}" style="margin-top:14px;text-align:center"><div class="phone-small">Wager $100–${money(phoneState.maxWager)}</div><button class="gold phone-btn" onclick="submitPhoneDailyWager()">Lock Wager & Start</button></div>`;return}\n  if(phoneState.mode==="wait-daily"){view.innerHTML=`<div class="waiting"><div class="big">DAILY DOUBLE</div><div class="phone-small">${escapeHtml(phoneState.dailyPlayer||"The active player")} is playing this clue alone.</div></div>`;return}','phone DD render')

# Make phone answer/reveal badges communicate special states.
s=s.replace('<span class="badge">${escapeHtml(phoneState.current.category)}</span><span class="badge secondary">${money(phoneState.current.value)}</span>', '<span class="badge">${escapeHtml(phoneState.current.category)}${phoneState.current.parts===2?` • PART ${phoneState.current.part} OF 2`:``}</span><span class="badge secondary">${phoneState.current.isDaily?`DAILY DOUBLE • `:``}${money(phoneState.current.value)}</span>')

# Retry transient PeerJS failures instead of leaving a dead join screen.
rx(r'function initPhone\(room\)\{.*?\n\}\n\n\nfunction setDeveloperMode', '''let phoneReconnectTimer=null;
function connectPhoneToHost(room){
  if(!phonePeer||phonePeer.destroyed)return;clearTimeout(phoneReconnectTimer);document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;document.getElementById("joinStatus").textContent="Connecting to host…";try{phoneConn?.close()}catch{}phoneConn=phonePeer.connect(hostPeerId(room),{reliable:true,metadata:{game:GAME_VERSION}});const retry=()=>{clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)};
  phoneConn.on("open",()=>{document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connected`;document.getElementById("joinStatus").textContent="";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);if(token)phoneConn.send({type:"rejoin",token})});phoneConn.on("data",msg=>{if(msg?.type==="state"){phoneState=msg;renderPhone()}else if(msg?.type==="joined"){if(msg.token)sessionStorage.setItem(PHONE_TOKEN_KEY,msg.token)}else if(msg?.type==="join-error")document.getElementById("joinStatus").textContent=msg.message||"Could not join."});phoneConn.on("close",()=>{document.getElementById("joinStatus").textContent="Connection lost — reconnecting…";retry()});phoneConn.on("error",()=>retry());
}
function initPhone(room){document.body.classList.add("phone-mode");document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connecting…`;initAvatarPicker();if(typeof Peer==="undefined"){document.getElementById("joinStatus").textContent="Phone networking failed to load.";return}phonePeer=new Peer(undefined,{debug:0});phonePeer.on("open",()=>connectPhoneToHost(room));phonePeer.on("disconnected",()=>{try{phonePeer.reconnect()}catch{}});phonePeer.on("error",err=>{if(err?.type==="peer-unavailable"){document.getElementById("joinStatus").textContent="Host not found yet — retrying…";clearTimeout(phoneReconnectTimer);phoneReconnectTimer=setTimeout(()=>connectPhoneToHost(room),1600)}else document.getElementById("joinStatus").textContent=`Connection error${err?.type?`: ${err.type}`:""}`})}


function setDeveloperMode''','resilient phone join')

# Pick/reset hidden Daily Doubles each game.
one('function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();','function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=randomRoomCode();pickDailyDoubles();','init DD')
one('function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
    'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach(p=>{p.score=0;p.correctStreak=0;p.wrongStreak=0});used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");','new game DD reset')
one('function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;',
    'function resetGame(){if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];used=new Set();history=new Map();activePlayer=0;current=null;pendingDaily=null;pickDailyDoubles();submissions=new Map();judgements=new Map();hintsUsed=new Set();questionRevealed=false;questionResolved=false;finalShown=false;document.getElementById("dailyDoubleOverlay")?.classList.remove("showing");','reset DD')

path.write_text(s,encoding='utf-8')

# Update audit to protect these mechanics and the five two-part pack entries.
a=audit_path.read_text(encoding='utf-8')
if "twoPartCount" not in a:
    anchor="for(const category of pack.categories){\n  if(!category.name||!Array.isArray(category.clues)||!category.clues.length)throw new Error('Invalid category in Classic question pack');\n  for(const clue of category.clues){\n    if(!Number.isFinite(clue.value)||!clue.question||!clue.answer||!Array.isArray(clue.aliases)||!clue.aliases.length)throw new Error(`Invalid clue in ${category.name}`);\n  }\n}\n"
    if anchor not in a: raise RuntimeError('classic audit category anchor missing')
    a=a.replace(anchor,anchor+"const twoPartCount=pack.categories.flatMap(category=>category.clues).filter(clue=>clue.followup).length;\nif(twoPartCount<5)throw new Error('Classic pack must include at least five two-part clues');\n",1)
if "CLASSIC_DAILY_DOUBLE_V1" not in a:
    old="  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2'\n];"
    new="  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2',\n  'CLASSIC_DAILY_DOUBLE_V1','daily-wager','classic-3','searchParams.set(\\\"mode\\\",\\\"classic\\\")'\n];"
    if old not in a: raise RuntimeError('classic audit required anchor missing')
    a=a.replace(old,new,1)
audit_path.write_text(a,encoding='utf-8')
print('classic-v4 applied')
