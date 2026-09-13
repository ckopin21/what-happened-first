from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing marker: {label}')
    return text.replace(old, new, 1)

# --- Timeline mode ---
p = Path('outputs/dog-jeopardy.html')
s = p.read_text(encoding='utf-8')

s = replace_once(s, '''    <div class="follow-box" id="followBox">\n      <div id="followQuestion"></div>\n      <button class="gold" onclick="showFollowAnswer()">Reveal Follow-Up Answer</button>\n      <div class="answer" id="followAnswer"></div>\n      <div>\n        <button class="green" onclick="followResult(true)">Follow-Up Correct</button>\n        <button class="red" onclick="followResult(false)">Follow-Up Incorrect</button>\n      </div>\n    </div>''', '''    <div class="follow-box" id="followBox">\n      <div class="badge secondary">FOLLOW-UP QUESTION</div>\n      <div id="followQuestion"></div>\n      <div class="choices follow-choice-grid" id="followChoices"></div>\n      <div class="answer" id="followAnswer"></div>\n    </div>''', 'timeline follow-up host HTML')

s = replace_once(s, '''        <div id="phoneFollowView" class="phone-follow" style="display:none">\n          <div class="phone-question" id="phoneFollowQuestion"></div>\n          <div class="phone-answer" id="phoneFollowAnswer" style="display:none"></div>\n          <button class="phone-action" onclick="phoneRevealFollowAnswer()">Reveal Follow-Up Answer</button>\n          <button class="phone-action correct-action" onclick="phoneFollowResult(true)">Follow-Up Correct</button>\n          <button class="phone-action wrong-action" onclick="phoneFollowResult(false)">Follow-Up Incorrect</button>\n        </div>''', '''        <div id="phoneFollowView" class="phone-follow" style="display:none">\n          <div class="phone-question" id="phoneFollowQuestion"></div>\n          <div class="phone-follow-choices" id="phoneFollowChoices"></div>\n          <div class="phone-answer" id="phoneFollowAnswer" style="display:none"></div>\n        </div>''', 'timeline follow-up phone HTML')

# Avatar framing: keep cover behavior but bias faces/subjects upward consistently.
style_marker = '.review-note{color:#cfe7f6;font-size:14px;margin-top:12px}\n'
style_add = '''.review-note{color:#cfe7f6;font-size:14px;margin-top:12px}\n/* AVATAR_CROP_V2: top-biased framing avoids clipping faces/heads in square and circular crops. */\n.join-avatar img,.phone-player-avatar,.player-avatar,.host-avatar img{object-position:50% 32%!important}\n.follow-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px auto 10px;max-width:680px}\n.follow-choice-grid .choice-btn{width:100%;min-height:58px;margin:0}\n.phone-follow-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0}\n.phone-follow-choices .phone-action{margin:0!important;min-height:56px}\n.follow-choice-correct{background:var(--good)!important;color:#fff!important;border-color:#baf5ce!important}\n.follow-choice-wrong{background:var(--bad)!important;color:#fff!important;border-color:#ffd0d0!important}\n@media(max-width:560px){.follow-choice-grid,.phone-follow-choices{grid-template-columns:1fr}}\n'''
s = replace_once(s, style_marker, style_add, 'timeline avatar/follow-up styles')

old_remote = '''  }else if(action==="follow-reveal"){\n    if(i===activePlayer&&document.getElementById("followBox")?.classList.contains("visible"))showFollowAnswer();\n  }else if(action==="follow-result"){\n    if(i===activePlayer&&document.getElementById("followBox")?.classList.contains("visible"))followResult(!!msg.correct);\n  }else if(action==="tie"){'''
new_remote = '''  }else if(action==="follow-choice"){\n    if(i!==activePlayer||!document.getElementById("followBox")?.classList.contains("visible")||!current)return;\n    const choice=Number(msg.choice);\n    if(Number.isInteger(choice))chooseFollowup(choice);\n  }else if(action==="tie"){'''
s = replace_once(s, old_remote, new_remote, 'timeline remote follow-up authority')

old_funcs = '''function startFollowup(){\n  document.getElementById("followOffer").classList.remove("visible");\n  document.getElementById("followBox").classList.add("visible");\n  document.getElementById("followQuestion").textContent=current.item.fq;\n  document.getElementById("followAnswer").textContent=current.item.fa;\n  syncPhoneQuestionView();\n}\n\nfunction showFollowAnswer(){\n  document.getElementById("followAnswer").classList.add("visible");\n  syncPhoneQuestionView();\n  audioPop(700,.08,"sine",.035);\n}\n\nfunction followResult(correct){'''
new_funcs = '''function followupChoicesFor(item){\n  const q=String(item?.fq||"").toLowerCase();\n  const a=String(item?.fa||"");\n  if(q.includes("4gb iphone")||a==="$499")return ["$399","$499","$599","$699"];\n  if(q.includes("prohibition")||a.toLowerCase()==="december")return ["October","November","December","January"];\n  if(q.includes("stranger things")||a.toLowerCase().includes("hawkins"))return ["Hawkins, Indiana","Derry, Maine","Sunnydale, California","Stars Hollow, Connecticut"];\n  if(q.includes("second person")&&q.includes("moon")||a.toLowerCase().includes("buzz aldrin"))return ["Michael Collins","Buzz Aldrin","Alan Shepard","John Glenn"];\n  if(q.includes("first modern olympic")||a.toLowerCase()==="athens")return ["Paris","Athens","London","Rome"];\n  return [a,"None of these","All of these","Not enough information"];\n}\nfunction renderFollowupChoices(){\n  if(!current)return;\n  const choices=followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;\n  const box=document.getElementById("followChoices");if(!box)return;box.innerHTML="";\n  choices.forEach((label,i)=>{const b=document.createElement("button");b.className="choice-btn";b.textContent=label;b.disabled=selected!==null;b.onclick=()=>chooseFollowup(i);if(selected!==null){if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")}box.appendChild(b)});\n}\nfunction renderPhoneFollowupChoices(){\n  if(!current)return;const box=document.getElementById("phoneFollowChoices");if(!box)return;const choices=current.item.fc||followupChoicesFor(current.item),selected=Number.isInteger(current.followChoice)?current.followChoice:null;box.innerHTML="";\n  choices.forEach((label,i)=>{const b=document.createElement("button");b.className="phone-action";b.textContent=label;b.disabled=selected!==null;b.onclick=()=>phoneChooseFollowup(i);if(selected!==null){if(label===current.item.fa)b.classList.add("follow-choice-correct");else if(i===selected)b.classList.add("follow-choice-wrong")}box.appendChild(b)});\n}\nfunction startFollowup(){\n  document.getElementById("followOffer").classList.remove("visible");\n  document.getElementById("followBox").classList.add("visible");\n  current.followChoice=null;\n  document.getElementById("followQuestion").textContent=current.item.fq;\n  document.getElementById("followAnswer").textContent=current.item.fa;\n  document.getElementById("followAnswer").classList.remove("visible");\n  renderFollowupChoices();\n  syncPhoneQuestionView();broadcastGameState(true);\n}\nfunction chooseFollowup(index){\n  if(!current||!document.getElementById("followBox")?.classList.contains("visible")||Number.isInteger(current.followChoice))return;\n  const choices=followupChoicesFor(current.item);if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  current.followChoice=index;const correct=choices[index]===current.item.fa;\n  document.getElementById("followAnswer").classList.add("visible");renderFollowupChoices();syncPhoneQuestionView();broadcastGameState(true);\n  audioPop(correct?760:180,.09,correct?"sine":"sawtooth",.04);setTimeout(()=>followResult(correct),650);\n}\n\nfunction followResult(correct){'''
s = replace_once(s, old_funcs, new_funcs, 'timeline follow-up functions')

old_phone_funcs = '''function phoneRevealFollowAnswer(){\n  haptic(10);\n  if(remotePhoneMode){sendRemoteAction("follow-reveal");return}\n  showFollowAnswer();\n  syncPhoneQuestionView();\n}\n\nfunction phoneFollowResult(correct){\n  haptic(correct ? [18,45,24] : [45,35,45]);\n  if(remotePhoneMode){sendRemoteAction("follow-result",{correct});return}\n  followResult(correct);\n}\n'''
new_phone_funcs = '''function phoneChooseFollowup(index){\n  haptic(12);\n  if(remotePhoneMode){sendRemoteAction("follow-choice",{choice:index});return}\n  chooseFollowup(index);\n}\n'''
s = replace_once(s, old_phone_funcs, new_phone_funcs, 'timeline phone follow-up functions')

s = replace_once(s, 'item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa}', 'item:{q:current.item.q,h:current.item.h,a:current.item.a,choices:current.item.choices,special:!!current.item.special,fq:current.item.fq,fa:current.item.fa,fc:followupChoicesFor(current.item)},followChoice:Number.isInteger(current.followChoice)?current.followChoice:null', 'timeline follow-up snapshot choices')

# Restore selected choice state on remote snapshot.
apply_marker = 'current=s.current;\n'
if apply_marker in s:
    s = s.replace(apply_marker, 'current=s.current;if(current&&Number.isInteger(s.current?.followChoice))current.followChoice=s.current.followChoice;\n', 1)
else:
    # current is often assigned inline in this large file; followChoice is also part of s.current, so no extra patch is required.
    pass

old_sync = '''      document.getElementById("phoneFollowQuestion").textContent=current.item.fq||"";\n      document.getElementById("phoneFollowAnswer").textContent=current.item.fa||"";\n      document.getElementById("phoneFollowAnswer").style.display=\n        document.getElementById("followAnswer")?.classList.contains("visible") ? "block" : "none";'''
new_sync = '''      document.getElementById("phoneFollowQuestion").textContent=current.item.fq||"";\n      document.getElementById("phoneFollowAnswer").textContent=current.item.fa||"";\n      document.getElementById("phoneFollowAnswer").style.display=Number.isInteger(current.followChoice)||document.getElementById("followAnswer")?.classList.contains("visible")?"block":"none";\n      renderPhoneFollowupChoices();'''
s = replace_once(s, old_sync, new_sync, 'timeline phone follow-up rendering')

# On special-question review, also render disabled choices before buttons are hidden.
review_marker = 'document.getElementById("followAnswer").classList.add("visible");\n      document.querySelectorAll("#followBox button").forEach(b=>b.style.display="none");'
if review_marker in s:
    s = s.replace(review_marker, 'document.getElementById("followAnswer").classList.add("visible");\n      current.followChoice=null;renderFollowupChoices();document.querySelectorAll("#followBox button").forEach(b=>b.style.display="none");', 1)

p.write_text(s, encoding='utf-8')

# --- Classic mode phone preview ---
p = Path('outputs/classic-jeopardy.html')
s = p.read_text(encoding='utf-8')
s = replace_once(s, 'let masterVolume=.70,classicHostAvatar=0,classicPreviewPlayerIndex=0;', 'let masterVolume=.70,classicHostAvatar=0,classicPreviewPlayerIndex=0,classicPreviewJoinAvatar=0;', 'classic preview avatar state')

css_marker = '@media(max-width:390px){.join-avatar-grid{gap:7px}.join-avatar{font-size:28px!important}.phone-card{padding:14px}.classic-add-card{padding:18px}}\n'
css_add = '''@media(max-width:390px){.join-avatar-grid{gap:7px}.join-avatar{font-size:28px!important}.phone-card{padding:14px}.classic-add-card{padding:18px}}\n/* CLASSIC_FULL_PHONE_PREVIEW_V1 */\n.classic-preview-body .phone-brand{text-align:center;margin:2px 0 12px}.classic-preview-body .phone-brand h2{font-size:30px}.classic-preview-body .phone-card{width:100%;box-shadow:none}.classic-preview-body .phone-board{width:100%}.classic-preview-join-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0}.classic-preview-join-avatar{width:100%;min-width:0;aspect-ratio:1;margin:0!important;padding:0!important;border-radius:50%;background:#17375d;color:#fff;border:3px solid transparent;font-size:30px}.classic-preview-join-avatar.selected{border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,209,102,.18)}.classic-preview-live-note{text-align:center;font-size:11px;font-weight:900;color:#9fc4db;margin:8px 0 0}.classic-preview-body .phone-answer-stack{display:flex;flex-direction:column}.classic-preview-body .phone-answer-input{order:1}.classic-preview-body .phone-hint-action,.classic-preview-body .phone-hint{order:2}.classic-preview-body .phone-submit-action{order:3}.classic-preview-body .phone-submit-count{order:4}\n'''
s = replace_once(s, css_marker, css_add, 'classic full preview CSS')

start = s.find('function openClassicPhonePreview(){')
end = s.find('\nfunction initHost(){', start)
if start < 0 or end < 0:
    raise SystemExit('Missing marker: classic preview function block')
new_block = r'''function openClassicPhonePreview(){
  if(players.length)classicPreviewPlayerIndex=Math.min(activePlayer,players.length-1);
  document.getElementById("classicPhonePreview")?.classList.add("showing");document.body.classList.add("classic-preview-open");renderClassicPhonePreview();
}
function closeClassicPhonePreview(){document.getElementById("classicPhonePreview")?.classList.remove("showing");document.body.classList.remove("classic-preview-open")}
function setClassicPreviewPlayer(v){const i=Number(v);if(Number.isInteger(i)&&i>=0&&i<players.length)classicPreviewPlayerIndex=i;renderClassicPhonePreview()}
function classicPreviewBoardHtml(index){
  let out='<div class="phone-board">';categories.forEach(cat=>{out+=`<div class="phone-cat">${escapeHtml(cat.name)}</div>`});const rows=Math.max(...categories.map(c=>c.clues.length));
  for(let qi=0;qi<rows;qi++)categories.forEach((cat,ci)=>{const q=cat.clues[qi];if(!q){out+='<button class="phone-clue" disabled></button>';return}const id=clueId(ci,qi);if(used.has(id)){const rec=history.get(id),names=rec?.winners?.length?rec.winners.join(", "):"No one";out+=`<button class="phone-clue used" disabled>✓<br>${escapeHtml(names)}</button>`}else{const disabled=index!==activePlayer||!!current;out+=`<button class="phone-clue" ${disabled?'disabled':''} onclick="classicPreviewSelect(${ci},${qi})">${money(q.value*phaseMultiplier())}</button>`}});return out+'</div>';
}
function classicPreviewSelect(ci,qi){if(classicPreviewPlayerIndex!==activePlayer||current||connectedForPlayer(classicPreviewPlayerIndex))return;openClue(ci,qi,classicPreviewPlayerIndex)}
function classicPreviewHint(){const i=classicPreviewPlayerIndex;if(!current||questionRevealed||submissions.has(i)||hintsUsed.has(i)||connectedForPlayer(i))return;hintsUsed.add(i);renderHost();broadcastState()}
function classicPreviewSubmit(){
  const i=classicPreviewPlayerIndex,input=document.getElementById("classicPreviewAnswer");if(!current||questionRevealed||submissions.has(i)||connectedForPlayer(i))return;const answer=(input?.value||"").trim().slice(0,140);if(!answer)return;submissions.set(i,answer);showQuestionHost();renderHost();broadcastState();if(allSubmitted())revealQuestion(false);
}
function classicPreviewPickAvatar(i){if(Number.isInteger(i)&&i>=0&&i<AVATARS.length){classicPreviewJoinAvatar=i;renderClassicPhonePreview()}}
function classicPreviewJoin(){
  const input=document.getElementById("classicPreviewJoinName"),name=(input?.value||"").trim();if(!name)return;if(players.length>=MAX_PLAYERS){toast("Maximum of 5 players","bad");return}
  players.push({name:name.slice(0,24),score:0,token:`preview-local-${Date.now()}-${Math.random().toString(36).slice(2)}`,avatar:classicPreviewJoinAvatar,correctStreak:0,wrongStreak:0,local:true});
  classicPreviewPlayerIndex=players.length-1;if(players.length===1)activePlayer=0;renderHost();broadcastState();toast(name+" joined preview","good");
}
function renderClassicPhonePreview(){
  const root=document.getElementById("classicPhonePreview"),body=document.getElementById("classicPreviewBody"),select=document.getElementById("classicPreviewPlayerSelect");if(!root||!body||!select||!root.classList.contains("showing"))return;
  if(!players.length){
    select.innerHTML='<option>Join screen</option>';
    body.innerHTML=`<div class="phone-brand"><h2>${escapeHtml(PACK.title||"CLASSIC JEOPARDY")}</h2><p>Room ${escapeHtml(roomCode||"----")} • Phone Preview</p></div><div class="phone-card"><h2 style="text-align:center">Join the game</h2><input class="phone-input" id="classicPreviewJoinName" maxlength="24" placeholder="Your name" autocomplete="off"><div class="phone-small" style="margin-top:12px;font-weight:900;text-align:center">Choose an avatar</div><div class="classic-preview-join-grid">${AVATARS.map((a,i)=>`<button class="classic-preview-join-avatar ${i===classicPreviewJoinAvatar?'selected':''}" onclick="classicPreviewPickAvatar(${i})" title="${escapeHtml(a.name)}">${a.icon}</button>`).join("")}</div><button class="blue phone-btn" onclick="classicPreviewJoin()">Join Game</button><div class="classic-preview-live-note">This creates a local preview player so you can test the entire controller flow.</div></div>`;
    return;
  }
  if(classicPreviewPlayerIndex<0||classicPreviewPlayerIndex>=players.length)classicPreviewPlayerIndex=0;
  select.innerHTML=players.map((p,i)=>`<option value="${i}" ${i===classicPreviewPlayerIndex?'selected':''}>${escapeHtml(p.name)}</option>`).join("");
  const i=classicPreviewPlayerIndex,p=players[i],connected=connectedForPlayer(i),meta=p.correctStreak>=3?"🔥 ON FIRE":p.wrongStreak>=3?"🥶 COLD STREAK":connected?"PHONE CONNECTED • PREVIEW ONLY":i===activePlayer?"YOUR TURN":"READY";
  let inner=`<div class="phone-brand"><h2>${escapeHtml(PACK.title||"CLASSIC JEOPARDY")}</h2><p>Room ${escapeHtml(roomCode||"----")} • Phone Preview</p></div><div class="phone-card ${p.correctStreak>=3?'on-fire':p.wrongStreak>=3?'cold':''}"><div class="phone-player"><div class="phone-player-main"><div class="phone-avatar">${avatarIcon(p.avatar)}</div><div><div class="phone-name">${escapeHtml(p.name)}</div><div class="phone-meta">${meta}</div></div></div><div class="phone-score">${money(p.score)}</div></div><div id="classicPreviewView">`;
  if(finalShown){const ranked=players.map((x,j)=>({...x,index:j})).sort((a,b)=>b.score-a.score),top=ranked[0]?.score;inner+=`<div class="waiting"><div class="big">FINAL RANKING</div>${ranked.map((x,pos)=>`<div style="margin:8px 0;font-weight:1000;color:${x.score===top?'#ffd166':'#fff'}">#${pos+1} ${avatarIcon(x.avatar)} ${escapeHtml(x.name)} — ${money(x.score)}</div>`).join("")}</div>`}
  else if(!current){inner+=i===activePlayer?`<div class="waiting"><div class="big">YOUR PICK</div><div class="phone-small">Choose the next question. Everyone will answer it.</div></div>${classicPreviewBoardHtml(i)}`:`<div class="waiting"><div class="big">${escapeHtml(players[activePlayer]?.name||"Another player")} IS CHOOSING</div><div class="phone-small">Get ready to answer.</div></div>`}
  else if(questionRevealed){const answer=submissions.get(i)||"No answer",correct=!!judgements.get(i),delta=scoreDeltaFor(i,correct);inner+=`<div class="phone-q">${escapeHtml(current.question)}</div><div class="phone-reveal">${escapeHtml(current.answer)}</div><div class="phone-small">Your answer: ${escapeHtml(answer)}</div><div class="phone-result ${correct?'good':'bad'}">${correct?`CORRECT • ${delta>=0?'+':''}${money(delta)}`:`INCORRECT${delta?` • ${money(delta)}`:''}`}</div><div class="phone-small">Host is reviewing results.</div>`}
  else if(submissions.has(i)){inner+=`<div class="waiting"><div class="big">ANSWER LOCKED 🔒</div><div class="phone-q">${escapeHtml(submissions.get(i))}</div><div class="phone-small">${submissions.size}/${players.length} submitted. Waiting for everyone else…</div></div>`}
  else {const hint=hintsUsed.has(i)?`<div class="phone-hint phone-hint-action">💡 ${escapeHtml(current.hint)}<div class="phone-small">Correct answer is now worth half points for you.</div></div>`:`<button class="ghost phone-btn phone-hint-action" onclick="classicPreviewHint()" ${connected?'disabled':''}>Use Hint — Half Points</button>`;inner+=`<div class="badges"><span class="badge">${escapeHtml(current.category)}</span><span class="badge secondary">${money(current.effective)}</span></div><div class="phone-q">${escapeHtml(current.question)}</div><div class="phone-answer-stack"><input class="phone-input phone-answer-input" id="classicPreviewAnswer" maxlength="140" placeholder="Type your answer" autocomplete="off" ${connected?'disabled':''}>${hint}<button class="gold phone-btn phone-submit-action" id="classicPreviewSubmitBtn" onclick="classicPreviewSubmit()" disabled>Confirm & Submit</button><div class="phone-small phone-submit-count">${connected?'Preview only — use the connected phone to answer.':`${submissions.size}/${players.length} submitted`}</div></div>`}
  inner+='</div></div>';body.innerHTML=inner;
  const input=document.getElementById("classicPreviewAnswer"),btn=document.getElementById("classicPreviewSubmitBtn");if(input&&btn&&!connected){input.addEventListener("input",()=>btn.disabled=!input.value.trim());input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!btn.disabled)classicPreviewSubmit()})}
}
'''
s = s[:start] + new_block + s[end:]
p.write_text(s, encoding='utf-8')

# Strengthen static audits with markers for these fixes.
a = Path('work/audit-classic.js')
t = a.read_text(encoding='utf-8')
if 'CLASSIC_FULL_PHONE_PREVIEW_V1' not in t:
    t = t.replace('// CLASSIC_PARITY_V2_AUDIT', "if(!html.includes('CLASSIC_FULL_PHONE_PREVIEW_V1')||!html.includes('classicPreviewJoin')||!html.includes('PHONE CONNECTED • PREVIEW ONLY'))throw new Error('Full Classic phone preview missing');\n// CLASSIC_PARITY_V2_AUDIT")
a.write_text(t, encoding='utf-8')

a = Path('work/audit-game.js')
t = a.read_text(encoding='utf-8')
if 'followupChoicesFor' not in t:
    t = t.replace('const results = {', 'if(!html.includes("followupChoicesFor")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CROP_V2")) throw new Error("Follow-up multiple choice/avatar crop fix missing");\n\nconst results = {')
a.write_text(t, encoding='utf-8')

print('Applied follow-up multiple choice, avatar crop, and full Classic phone preview fixes.')
