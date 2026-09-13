from pathlib import Path

html_path = Path('outputs/classic-jeopardy.html')
audit_path = Path('work/audit-classic.js')
html = html_path.read_text(encoding='utf-8')
audit = audit_path.read_text(encoding='utf-8')

if 'CLASSIC_PARITY_V2' in html:
    print('Classic parity v2 already applied')
    raise SystemExit(0)

def replace_once(source, old, new, label):
    if old not in source:
        raise RuntimeError(f'Missing anchor: {label}')
    return source.replace(old, new, 1)

css = r'''
/* CLASSIC_PARITY_V2 */
.volume-wrap{display:flex;align-items:center;gap:8px;font-weight:900;color:#d8e8f4;white-space:nowrap}.volume-end{font-size:11px;color:#d8e8f4}.volume-current{min-width:42px;text-align:right;color:var(--accent);font-size:12px}.volume-wrap input[type="range"]{width:160px;margin:0;padding:0;accent-color:#0d6efd}
.classic-add-player{display:none;position:fixed;inset:0;z-index:340;background:rgba(1,7,12,.9);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:18px}.classic-add-player.showing{display:flex}.classic-add-card{width:min(520px,96vw);background:linear-gradient(160deg,#176b9e,#0b304b);border:4px solid rgba(255,255,255,.9);border-radius:24px;padding:22px;box-shadow:0 30px 70px rgba(0,0,0,.55);text-align:left}.classic-add-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.classic-add-head h2{margin:0;color:var(--accent);font-size:30px}.classic-add-head p{margin:5px 0 0;color:#cfe6f5}.classic-add-close{margin:0!important;padding:6px 12px!important}.classic-add-name{width:100%;margin:18px 0 8px}.classic-host-avatar-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.classic-host-avatar{width:100%;min-width:0;aspect-ratio:1;margin:0!important;padding:0!important;border-radius:50%;background:#17375d;color:white;border:3px solid transparent;font-size:34px}.classic-host-avatar.selected{border-color:var(--accent);box-shadow:0 0 0 4px rgba(255,209,102,.18)}.classic-add-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.classic-add-note{min-height:18px;color:#ffd7d7;font-size:12px;font-weight:900;margin-top:6px}
.classic-phone-preview{display:none;position:fixed;right:12px;top:12px;bottom:12px;width:min(420px,calc(100vw - 24px));z-index:300;background:radial-gradient(circle at top,#123d72 0,#071b2f 48%,#02080d 100%);border:3px solid rgba(255,255,255,.88);border-radius:24px;box-shadow:0 24px 65px rgba(0,0,0,.62);overflow:hidden;text-align:left}.classic-phone-preview.showing{display:flex;flex-direction:column}.classic-preview-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(4,20,32,.9);border-bottom:1px solid rgba(255,255,255,.13)}.classic-preview-head strong{color:var(--accent);white-space:nowrap}.classic-preview-head select{min-width:0;flex:1;background:#102b4c;color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:8px}.classic-preview-head button{margin:0!important;padding:7px 11px!important}.classic-preview-body{padding:14px;overflow:auto;overscroll-behavior:contain}.classic-preview-player{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.classic-preview-player-main{display:flex;align-items:center;gap:9px;min-width:0}.classic-preview-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#17375d;border:3px solid rgba(255,255,255,.82);font-size:28px}.classic-preview-name{font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.classic-preview-score{font-size:22px;font-weight:1000;color:var(--accent);white-space:nowrap}.classic-preview-note{text-align:center;color:#c8dce9;font-size:12px;font-weight:900;margin:8px 0 13px}.classic-preview-board{display:grid;grid-template-columns:repeat(var(--cat-count),minmax(0,1fr));gap:4px}.classic-preview-cat{min-height:38px;padding:4px 2px;border-radius:6px;background:#082943;display:flex;align-items:center;justify-content:center;text-align:center;font-size:8px;font-weight:1000;text-transform:uppercase;overflow-wrap:anywhere}.classic-preview-q{margin:0!important;min-width:0;min-height:46px;padding:5px 2px!important;border-radius:6px!important;background:#196ca0;color:var(--accent);font-size:13px!important;box-shadow:none!important}.classic-preview-q.used{background:#09263a;color:#b8c8d2;font-size:8px!important}.classic-preview-question{font-size:24px;line-height:1.25;font-weight:1000;margin:8px 0 14px}.classic-preview-answer{width:100%;border-radius:13px;border:2px solid rgba(255,255,255,.22);background:#102b4c;color:white;padding:13px;font-size:17px;margin:5px 0 15px}.classic-preview-hint{margin:0 0 15px!important;width:100%}.classic-preview-submit{width:100%;margin:0!important}.classic-preview-reveal{font-size:22px;font-weight:1000;color:var(--accent);margin:10px 0}.classic-preview-result{padding:10px;border-radius:12px;text-align:center;font-weight:1000;margin-top:11px}.classic-preview-result.good{background:rgba(52,208,111,.23);border:2px solid var(--good)}.classic-preview-result.bad{background:rgba(240,82,82,.2);border:2px solid var(--bad)}
.join-avatar-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;width:100%;max-width:100%;overflow:hidden}.join-avatar{width:100%!important;min-width:0!important;max-width:82px;justify-self:center;margin:0!important;padding:0!important;font-size:clamp(26px,9vw,36px)!important}.phone-player{min-width:0}.phone-player-main{min-width:0;flex:1}.phone-player-main>div:last-child{min-width:0}.phone-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.phone-score{flex:0 0 auto;white-space:nowrap}.phone-status{margin-top:8px}.phone-answer-input{margin:4px 0 16px!important}.phone-hint-action{margin:0 0 16px!important;width:100%}.phone-answer-stack .phone-hint{margin:0 0 16px}.phone-submit-action{margin:0!important;width:100%}.phone-submit-count{margin-top:10px;text-align:center}
@media(min-width:900px){body.classic-preview-open{padding-right:438px}body.classic-preview-open .host{width:min(1200px,calc(97% - 10px))}body.classic-preview-open.fullscreen-game{padding-right:438px}}
@media(max-width:899px){.classic-phone-preview{left:8px;right:8px;top:8px;bottom:8px;width:auto}.classic-host-avatar-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.volume-wrap{flex-basis:100%;justify-content:center}}
@media(max-width:390px){.join-avatar-grid{gap:7px}.join-avatar{font-size:28px!important}.phone-card{padding:14px}.classic-add-card{padding:18px}}
'''
html = replace_once(html, '</style>', css + '\n</style>', 'style end')

old_setup = '''      <div class="host-player-count"><b>Players:</b> <span id="hostPlayerCount">0 / 5</span></div>\n      <a class="mode-link" href="../index.html">Game Modes</a>\n      <label class="dev-toggle-wrap"><input id="developerToggle" type="checkbox" onchange="setDeveloperMode(this.checked)"><span>Developer Mode</span></label>\n      <button class="blue" id="fullscreenBtn" onclick="toggleFullscreen()">Fullscreen</button>'''
new_setup = '''      <div class="host-player-count"><b>Players:</b> <span id="hostPlayerCount">0 / 5</span></div>\n      <button class="blue" onclick="openClassicAddPlayer()">Add Player</button>\n      <button class="blue" onclick="openClassicPhonePreview()">Player Phone Preview</button>\n      <a class="mode-link" href="../index.html">Game Modes</a>\n      <label class="dev-toggle-wrap"><input id="developerToggle" type="checkbox" onchange="setDeveloperMode(this.checked)"><span>Developer Mode</span></label>\n      <div class="volume-wrap"><span>Volume</span><span class="volume-end">0</span><input id="volumeSlider" type="range" min="0" max="100" value="70" step="1" oninput="setVolume(this.value)"><span class="volume-end">100</span><span class="volume-current" id="volumeCurrent">70%</span></div>\n      <button class="blue" id="fullscreenBtn" onclick="toggleFullscreen()">Fullscreen</button>'''
html = replace_once(html, old_setup, new_setup, 'setup controls')

html = html.replace('Everyone answers every clue.', 'Everyone answers every question.')
html = html.replace("Whoever's turn it is chooses the clue. Everyone answers.", "Whoever's turn it is chooses the question. Everyone answers.")
html = html.replace('Choose the next clue. Everyone will answer it.', 'Choose the next question. Everyone will answer it.')
html = html.replace('Classic keeps its everyone-answers format. Double/Triple can arm the next real clue;', 'Classic keeps its everyone-answers format. Double/Triple can arm the next real question;')
html = html.replace('Presentation preview for the Daily Double state. Classic still keeps everyone answering the clue.', 'Presentation preview for the Daily Double state. Classic still keeps everyone answering the question.')

host_surfaces = r'''
<div class="classic-add-player" id="classicAddPlayer">
  <div class="classic-add-card">
    <div class="classic-add-head"><div><h2>Add Player</h2><p>Create a local player and choose their profile icon.</p></div><button class="white classic-add-close" onclick="closeClassicAddPlayer()">×</button></div>
    <input class="phone-input classic-add-name" id="classicAddName" maxlength="24" placeholder="Player name" autocomplete="off">
    <div class="phone-small" style="font-weight:1000">Choose a profile icon</div>
    <div class="classic-host-avatar-grid" id="classicHostAvatarGrid"></div>
    <div class="classic-add-actions"><button class="white" onclick="closeClassicAddPlayer()">Cancel</button><button class="gold" onclick="addClassicLocalPlayer()">Add Player</button></div>
    <div class="classic-add-note" id="classicAddNote"></div>
  </div>
</div>
<div class="classic-phone-preview" id="classicPhonePreview">
  <div class="classic-preview-head"><strong>PHONE PREVIEW</strong><select id="classicPreviewPlayerSelect" onchange="setClassicPreviewPlayer(this.value)"></select><button class="white" onclick="closeClassicPhonePreview()">×</button></div>
  <div class="classic-preview-body" id="classicPreviewBody"></div>
</div>
'''
html = replace_once(html, '<section class="overlay" id="questionOverlay">', host_surfaces + '\n<section class="overlay" id="questionOverlay">', 'question overlay')

old_state = 'let developerMode=false,devForcedMultiplier=0;'
new_state = 'let developerMode=false,devForcedMultiplier=0;\nlet masterVolume=.70,classicHostAvatar=0,classicPreviewPlayerIndex=0;'
html = replace_once(html, old_state, new_state, 'state variables')

helpers = r'''
function setVolume(v){
  const n=Math.max(0,Math.min(100,Number(v)||0));masterVolume=n/100;
  const currentEl=document.getElementById("volumeCurrent");if(currentEl)currentEl.textContent=Math.round(n)+"%";
  const slider=document.getElementById("volumeSlider");if(slider)slider.style.background=`linear-gradient(90deg,#0d6efd 0%,#0d6efd ${n}%,#d8e8f4 ${n}%,#d8e8f4 100%)`;
}
function audioPop(freq=440,duration=.08,gain=.035,type="sine"){
  if(masterVolume<=0)return;
  try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=audioPop.ctx||(audioPop.ctx=new Ctx());const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=Math.min(.25,gain*masterVolume*4);o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.stop(ctx.currentTime+duration)}catch(_e){}
}
function renderClassicHostAvatars(){
  const grid=document.getElementById("classicHostAvatarGrid");if(!grid)return;grid.innerHTML="";
  AVATARS.forEach((a,i)=>{const b=document.createElement("button");b.type="button";b.className=`classic-host-avatar ${i===classicHostAvatar?"selected":""}`;b.title=a.name;b.textContent=a.icon;b.onclick=()=>{classicHostAvatar=i;renderClassicHostAvatars()};grid.appendChild(b)});
}
function openClassicAddPlayer(){
  if(players.length>=MAX_PLAYERS){toast("Maximum of 5 players","bad");return}
  classicHostAvatar=0;const name=document.getElementById("classicAddName");if(name)name.value="";const note=document.getElementById("classicAddNote");if(note)note.textContent="";renderClassicHostAvatars();document.getElementById("classicAddPlayer")?.classList.add("showing");setTimeout(()=>name?.focus(),50);
}
function closeClassicAddPlayer(){document.getElementById("classicAddPlayer")?.classList.remove("showing")}
function addClassicLocalPlayer(){
  const name=(document.getElementById("classicAddName")?.value||"").trim();const note=document.getElementById("classicAddNote");
  if(!name){if(note)note.textContent="Enter a player name.";return}if(players.length>=MAX_PLAYERS){if(note)note.textContent="Maximum of 5 players.";return}
  players.push({name:name.slice(0,24),score:0,token:`host-local-${Date.now()}-${Math.random().toString(36).slice(2)}`,avatar:classicHostAvatar,correctStreak:0,wrongStreak:0,local:true});
  if(players.length===1)activePlayer=0;classicPreviewPlayerIndex=players.length-1;closeClassicAddPlayer();renderHost();broadcastState();toast(name+" added","good");
}
function openClassicPhonePreview(){
  if(players.length)classicPreviewPlayerIndex=Math.min(activePlayer,players.length-1);document.getElementById("classicPhonePreview")?.classList.add("showing");document.body.classList.add("classic-preview-open");renderClassicPhonePreview();
}
function closeClassicPhonePreview(){document.getElementById("classicPhonePreview")?.classList.remove("showing");document.body.classList.remove("classic-preview-open")}
function setClassicPreviewPlayer(v){const i=Number(v);if(Number.isInteger(i)&&i>=0&&i<players.length)classicPreviewPlayerIndex=i;renderClassicPhonePreview()}
function classicPreviewBoardHtml(index){
  let out='<div class="classic-preview-board">';categories.forEach(cat=>{out+=`<div class="classic-preview-cat">${escapeHtml(cat.name)}</div>`});const rows=Math.max(...categories.map(c=>c.clues.length));
  for(let qi=0;qi<rows;qi++)categories.forEach((cat,ci)=>{const q=cat.clues[qi];if(!q){out+='<button class="classic-preview-q" disabled></button>';return}const id=clueId(ci,qi);if(used.has(id)){out+='<button class="classic-preview-q used" disabled>✓</button>'}else{const disabled=index!==activePlayer||!!current;out+=`<button class="classic-preview-q" ${disabled?'disabled':''} onclick="classicPreviewSelect(${ci},${qi})">${money(q.value*phaseMultiplier())}</button>`}});return out+'</div>';
}
function classicPreviewSelect(ci,qi){if(classicPreviewPlayerIndex!==activePlayer||current)return;openClue(ci,qi,classicPreviewPlayerIndex)}
function classicPreviewHint(){const i=classicPreviewPlayerIndex;if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i)||connectedForPlayer(i))return;hintsUsed.add(i);renderHost();broadcastState()}
function classicPreviewSubmit(){
  const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewAnswer");if(!current||questionRevealed||submissions.has(i)||connectedForPlayer(i))return;const answer=(input?.value||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);
}
function renderClassicPhonePreview(){
  const root=document.getElementById("classicPhonePreview"),body=document.getElementById("classicPreviewBody"),select=document.getElementById("classicPreviewPlayerSelect");if(!root||!body||!select||!root.classList.contains("showing"))return;
  select.innerHTML=players.map((p,i)=>`<option value="${i}" ${i===classicPreviewPlayerIndex?'selected':''}>${escapeHtml(p.name)}</option>`).join("");
  if(!players.length){select.innerHTML='<option>No players</option>';body.innerHTML='<div class="waiting"><div class="big">NO PLAYERS YET</div><div class="classic-preview-note">Add a player to preview the controller.</div><button class="blue phone-btn" onclick="closeClassicPhonePreview();openClassicAddPlayer()">Add Player</button></div>';return}
  if(classicPreviewPlayerIndex<0||classicPreviewPlayerIndex>=players.length)classicPreviewPlayerIndex=0;const i=classicPreviewPlayerIndex,p=players[i],connected=connectedForPlayer(i);
  let inner=`<div class="classic-preview-player"><div class="classic-preview-player-main"><div class="classic-preview-avatar">${avatarIcon(p.avatar)}</div><div style="min-width:0"><div class="classic-preview-name">${escapeHtml(p.name)}</div><div class="phone-small">${connected?'PHONE CONNECTED':i===activePlayer?'YOUR TURN':'READY'}</div></div></div><div class="classic-preview-score">${money(p.score)}</div></div>`;
  if(!current){inner+=i===activePlayer?'<div class="classic-preview-note">Choose the next question.</div>'+classicPreviewBoardHtml(i):`<div class="waiting"><div class="big">WAITING</div><div class="classic-preview-note">${escapeHtml(players[activePlayer]?.name||'Another player')} chooses the next question.</div></div>`;body.innerHTML=inner;return}
  if(questionRevealed){const answer=submissions.get(i)||"No answer",correct=!!judgements.get(i);inner+=`<div class="classic-preview-question">${escapeHtml(current.question)}</div><div class="classic-preview-reveal">${escapeHtml(current.answer)}</div><div class="phone-small">Your answer: ${escapeHtml(answer)}</div><div class="classic-preview-result ${correct?'good':'bad'}">${correct?'CORRECT':'INCORRECT'}</div>`;body.innerHTML=inner;return}
  if(submissions.has(i)){inner+=`<div class="waiting"><div class="big">ANSWER LOCKED 🔒</div><div class="classic-preview-question">${escapeHtml(submissions.get(i))}</div><div class="classic-preview-note">${submissions.size}/${players.length} submitted</div></div>`;body.innerHTML=inner;return}
  const hintHtml=hintsUsed.has(i)?`<div class="phone-hint">💡 ${escapeHtml(current.hint)}<div class="phone-small">Correct answer is now worth half points for you.</div></div>`:`<button class="ghost classic-preview-hint" onclick="classicPreviewHint()" ${connected?'disabled':''}>Use Hint — Half Points</button>`;
  inner+=`<div class="badges"><span class="badge">${escapeHtml(current.category)}</span><span class="badge secondary">${money(current.effective)}</span></div><div class="classic-preview-question">${escapeHtml(current.question)}</div><input class="classic-preview-answer" id="classicPreviewAnswer" maxlength="140" placeholder="Type your answer" ${connected?'disabled':''}>${hintHtml}<button class="gold classic-preview-submit" id="classicPreviewSubmitBtn" onclick="classicPreviewSubmit()" disabled>Confirm & Submit</button><div class="classic-preview-note">${connected?'This player is connected on their phone; preview is view-only.':`${submissions.size}/${players.length} submitted`}</div>`;body.innerHTML=inner;
  const input=document.getElementById("classicPreviewAnswer"),btn=document.getElementById("classicPreviewSubmitBtn");if(input&&btn&&!connected){input.addEventListener("input",()=>btn.disabled=!input.value.trim());input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!btn.disabled)classicPreviewSubmit()})}
}
'''
html = replace_once(html, 'function initHost(){', helpers + '\nfunction initHost(){', 'initHost')

html = replace_once(html, 'function initHost(){roomCode=', 'function initHost(){setVolume(document.getElementById("volumeSlider")?.value??70);roomCode=', 'initHost volume')
html = replace_once(html, '  renderScores();renderBoard();', '  renderScores();renderBoard();if(document.getElementById("classicPhonePreview")?.classList.contains("showing"))renderClassicPhonePreview();', 'renderHost preview sync')

old_answer = '''  if(phoneState.mode==="answer"){const hint=phoneState.current.hint?`<div class="phone-hint">💡 ${escapeHtml(phoneState.current.hint)}<div class="phone-small">Correct answer is now worth half points for you.</div></div>`:`<button class="ghost phone-btn" onclick="usePhoneHint()">Use Hint — Half Points</button>`;view.innerHTML=`<div class="badges"><span class="badge">${escapeHtml(phoneState.current.category)}</span><span class="badge secondary">${money(phoneState.current.value)}</span></div><div class="phone-q">${escapeHtml(phoneState.current.question)}</div>${hint}<input class="phone-input" id="phoneAnswerInput" maxlength="140" placeholder="Type your answer" autocomplete="off"><button class="gold phone-btn" id="phone-submit" onclick="submitPhoneAnswer()" disabled>Confirm & Submit</button><div class="phone-small">${phoneState.submittedCount}/${phoneState.totalPlayers} submitted</div>`;const input=document.getElementById("phoneAnswerInput"),btn=document.getElementById("phone-submit");input.addEventListener("input",()=>btn.disabled=!input.value.trim());input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!btn.disabled)submitPhoneAnswer()});setTimeout(()=>input.focus(),50);return}'''
new_answer = '''  if(phoneState.mode==="answer"){const hint=phoneState.current.hint?`<div class="phone-hint phone-hint-action">💡 ${escapeHtml(phoneState.current.hint)}<div class="phone-small">Correct answer is now worth half points for you.</div></div>`:`<button class="ghost phone-btn phone-hint-action" id="phoneHintAction" onclick="usePhoneHint()">Use Hint — Half Points</button>`;view.innerHTML=`<div class="badges"><span class="badge">${escapeHtml(phoneState.current.category)}</span><span class="badge secondary">${money(phoneState.current.value)}</span></div><div class="phone-q">${escapeHtml(phoneState.current.question)}</div><div class="phone-answer-stack"><input class="phone-input phone-answer-input" id="phoneAnswerInput" maxlength="140" placeholder="Type your answer" autocomplete="off">${hint}<button class="gold phone-btn phone-submit-action" id="phone-submit" onclick="submitPhoneAnswer()" disabled>Confirm & Submit</button><div class="phone-small phone-submit-count">${phoneState.submittedCount}/${phoneState.totalPlayers} submitted</div></div>`;const input=document.getElementById("phoneAnswerInput"),btn=document.getElementById("phone-submit");input.addEventListener("input",()=>btn.disabled=!input.value.trim());input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!btn.disabled)submitPhoneAnswer()});setTimeout(()=>input.focus(),50);return}'''
html = replace_once(html, old_answer, new_answer, 'phone answer order')

old_conn = 'phoneConn.on("open",()=>{document.getElementById("joinStatus").textContent="Connected.";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);'
new_conn = 'phoneConn.on("open",()=>{document.getElementById("phoneRoomLabel").textContent=`Room ${room} • Connected`;document.getElementById("joinStatus").textContent="";const token=sessionStorage.getItem(PHONE_TOKEN_KEY);'
html = replace_once(html, old_conn, new_conn, 'phone connected status')
html = replace_once(html, 'if(!phoneState)return;document.getElementById("phoneRoomLabel").textContent=`Room ${phoneState.room||"----"} • ${phoneState.pack?.genre||"Classic"}`;', 'if(!phoneState)return;document.getElementById("phoneRoomLabel").textContent=`Room ${phoneState.room||"----"} • Connected`;', 'phone room label')

html = replace_once(html, '  questionRevealed=true;players.forEach', '  questionRevealed=true;audioPop(720,.1,.04,"triangle");players.forEach', 'reveal sound')
html = replace_once(html, 'function showPhaseOverlay(text){const o=', 'function showPhaseOverlay(text){audioPop(text.includes("TRIPLE")?880:660,.14,.045,"triangle");const o=', 'phase sound')
html = replace_once(html, 'function toast(text,type=""){const t=', 'function toast(text,type=""){audioPop(type==="good"?700:type==="bad"?190:430,.07,.025,type==="bad"?"sawtooth":"sine");const t=', 'toast sound')
html = replace_once(html, 'function showFinale(){finalShown=true;', 'function showFinale(){audioPop(880,.2,.055,"triangle");finalShown=true;', 'finale sound')

html = html.replace('function newGame(){players.forEach', 'function newGame(){closeClassicAddPlayer();closeClassicPhonePreview();players.forEach', 1)
html = html.replace('function resetGame(){if(!confirm(', 'function resetGame(){if(!confirm(', 1)
html = html.replace('if(!confirm("Reset the game and remove every player?"))return;players=[];', 'if(!confirm("Reset the game and remove every player?"))return;closeClassicAddPlayer();closeClassicPhonePreview();players=[];', 1)

if 'CLASSIC_PARITY_V2_AUDIT' not in audit:
    audit = audit.replace("  'Developer Mode','devPreview','devPanel','fullscreenExitBtn','devForcedMultiplier','CLASSIC_DEVTOOLS_V1'", "  'Developer Mode','devPreview','devPanel','fullscreenExitBtn','devForcedMultiplier','CLASSIC_DEVTOOLS_V1',\n  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2'")
    audit = audit.replace("// CLASSIC_DEVTOOLS_AUDIT", "if(!html.includes('Choose the next question. Everyone will answer it.'))throw new Error('Player-facing question wording missing');\nif(!/phoneAnswerInput[\\s\\S]*phoneHintAction[\\s\\S]*phone-submit/.test(html))throw new Error('Phone answer/hint/submit order is incorrect');\nif(!html.includes('join-avatar{width:100%!important;min-width:0!important'))throw new Error('Phone avatar overflow fix missing');\n// CLASSIC_PARITY_V2_AUDIT\n// CLASSIC_DEVTOOLS_AUDIT")

html_path.write_text(html, encoding='utf-8')
audit_path.write_text(audit, encoding='utf-8')
print('Applied Classic host controls, phone preview, volume, wording, and phone layout fixes')
