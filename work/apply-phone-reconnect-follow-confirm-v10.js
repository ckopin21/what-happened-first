const fs=require('fs');
const path='outputs/dog-jeopardy.html';
let s=fs.readFileSync(path,'utf8');

function once(from,to,label){
  const i=s.indexOf(from);
  if(i<0) throw new Error(`Missing anchor: ${label}`);
  if(s.indexOf(from,i+from.length)>=0) throw new Error(`Anchor not unique: ${label}`);
  s=s.slice(0,i)+to+s.slice(i+from.length);
}
function regexOnce(re,to,label){
  const m=s.match(re);
  if(!m) throw new Error(`Missing regex anchor: ${label}`);
  const all=[...s.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(all.length!==1) throw new Error(`Regex anchor count ${all.length}: ${label}`);
  s=s.replace(re,to);
}

once('let choiceLocked=false;','let choiceLocked=false;\nlet pendingPhoneFollowChoice=null;','pending follow choice state');

once(`.follow-choice-wrong{background:var(--bad)!important;color:#fff!important;border-color:#ffd0d0!important}`,
`.follow-choice-wrong{background:var(--bad)!important;color:#fff!important;border-color:#ffd0d0!important}\n.phone-follow-choices .phone-action.selected-choice{outline:3px solid var(--accent)!important;box-shadow:0 0 0 3px rgba(255,209,102,.22)!important;filter:brightness(1.08)}`,
'pending follow choice styling');

once(`<div id="phoneFollowView" class="phone-follow" style="display:none">\n          <div class="phone-question" id="phoneFollowQuestion"></div>\n          <div class="phone-follow-choices" id="phoneFollowChoices"></div>\n          <div class="phone-answer" id="phoneFollowAnswer" style="display:none"></div>\n        </div>`,
`<div id="phoneFollowView" class="phone-follow" style="display:none">\n          <div class="phone-question" id="phoneFollowQuestion"></div>\n          <div class="phone-follow-choices" id="phoneFollowChoices"></div>\n          <button class="phone-action submit-action" id="phoneFollowConfirmBtn" onclick="phoneConfirmFollowup()" disabled>Confirm Choice</button>\n          <div class="phone-answer" id="phoneFollowAnswer" style="display:none"></div>\n        </div>`,
'phone follow-up confirm button');

regexOnce(/const remoteClientToken=\(\(\)=>\{[\s\S]*?\}\)\(\);/,
`const remoteClientToken=(()=>{\n  try{\n    const key="whf-phone-token";\n    let token=localStorage.getItem(key)||sessionStorage.getItem(key);\n    if(!token) token=(crypto.randomUUID?.()||\`${'${Date.now()}-${Math.random()}'}\`);\n    localStorage.setItem(key,token);\n    sessionStorage.setItem(key,token);\n    return token;\n  }catch(e){return \`${'${Date.now()}-${Math.random()}'}\`}\n})();\nfunction remoteProfileKey(){return \`whf-phone-profile:${'${phoneRoomParam}'}\`}\nfunction loadRemotePhoneProfile(){\n  if(!remotePhoneMode)return null;\n  try{const raw=localStorage.getItem(remoteProfileKey());return raw?JSON.parse(raw):null}catch(e){return null}\n}\nfunction saveRemotePhoneProfile(name,avatarIndex){\n  if(!remotePhoneMode||!name)return;\n  try{localStorage.setItem(remoteProfileKey(),JSON.stringify({name:String(name).slice(0,18),avatarIndex:Number(avatarIndex)||0,token:remoteClientToken}))}catch(e){}\n}`,
'persistent remote phone identity');

once(`          <div class="phone-follow-choices" id="phoneFollowChoices"></div>\n          <button class="phone-action submit-action" id="phoneFollowConfirmBtn" onclick="phoneConfirmFollowup()" disabled>Confirm Choice</button>`,
`          <div class="phone-follow-choices" id="phoneFollowChoices"></div>\n          <button class="phone-action submit-action" id="phoneFollowConfirmBtn" onclick="phoneConfirmFollowup()" disabled>Confirm Choice</button>`,
'confirm button sanity');

regexOnce(/function renderPhoneFollowupChoices\(\)\{[\s\S]*?\n\}\nfunction startFollowup\(\)\{/,
`function renderPhoneFollowupChoices(){\n  if(!current)return;\n  const box=document.getElementById("phoneFollowChoices");if(!box)return;\n  const choices=current.followOrder||current.item.fc||followupChoicesFor(current.item);\n  const committed=Number.isInteger(current.followChoice)?current.followChoice:null;\n  const selected=committed!==null?committed:(Number.isInteger(pendingPhoneFollowChoice)?pendingPhoneFollowChoice:null);\n  box.innerHTML="";\n  choices.forEach((label,i)=>{\n    const b=document.createElement("button");\n    b.className="phone-action";b.textContent=label;b.disabled=committed!==null;b.onclick=()=>phoneChooseFollowup(i);\n    if(committed!==null){\n      if(label===followupCorrectFor(current.item))b.classList.add("follow-choice-correct");\n      else if(i===committed)b.classList.add("follow-choice-wrong");\n    }else if(i===selected)b.classList.add("selected-choice");\n    box.appendChild(b);\n  });\n  const confirm=document.getElementById("phoneFollowConfirmBtn");\n  if(confirm){\n    confirm.style.display=committed!==null?"none":"block";\n    confirm.disabled=committed!==null||!Number.isInteger(pendingPhoneFollowChoice);\n    if(committed===null)confirm.textContent="Confirm Choice";\n  }\n}\nfunction startFollowup(){`,
'phone follow rendering with pending selection');

once(`function startFollowup(){\n  document.getElementById("followOffer").classList.remove("visible");`,
`function startFollowup(){\n  pendingPhoneFollowChoice=null;\n  document.getElementById("followOffer").classList.remove("visible");`,
'reset pending follow choice');

once(`function phoneChooseFollowup(index){\n  haptic(12);\n  if(remotePhoneMode){sendRemoteAction("follow-choice",{choice:index});return}\n  chooseFollowup(index);\n}`,
`function phoneChooseFollowup(index){\n  if(!current||Number.isInteger(current.followChoice))return;\n  const choices=current.followOrder||current.item.fc||followupChoicesFor(current.item);\n  if(!Number.isInteger(index)||index<0||index>=choices.length)return;\n  haptic(12);\n  pendingPhoneFollowChoice=index;\n  renderPhoneFollowupChoices();\n  const confirm=document.getElementById("phoneFollowConfirmBtn");\n  requestAnimationFrame(()=>confirm?.scrollIntoView({behavior:"smooth",block:"nearest"}));\n}\nfunction phoneConfirmFollowup(){\n  if(!current||Number.isInteger(current.followChoice)||!Number.isInteger(pendingPhoneFollowChoice))return;\n  const index=pendingPhoneFollowChoice;\n  const confirm=document.getElementById("phoneFollowConfirmBtn");\n  if(confirm){confirm.disabled=true;confirm.textContent="Submitting…"}\n  haptic(18);\n  if(remotePhoneMode){\n    if(!sendRemoteAction("follow-choice",{choice:index})&&confirm){confirm.disabled=false;confirm.textContent="Confirm Choice"}\n    return;\n  }\n  chooseFollowup(index);\n}`,
'follow-up choose then confirm');

once(`    sendRemoteAction("join",{name,avatarIndex:selectedJoinAvatar,token:remoteClientToken});`,
`    saveRemotePhoneProfile(name,selectedJoinAvatar);\n    sendRemoteAction("join",{name,avatarIndex:selectedJoinAvatar,token:remoteClientToken});`,
'save profile before manual join');

once(`  const i=entry.playerIndex;\n  if(action==="select"){`,
`  const i=entry.playerIndex;\n  if(action==="resume"){\n    try{entry.conn.send({type:"resume-ok",playerIndex:i})}catch(e){}\n    broadcastGameState(true);\n    return;\n  }\n  if(action==="select"){`,
'host resume heartbeat');

once(`function startRemotePhone(){`,
`let remoteRecoveryReady=false;\nlet remoteResumeTimer=null;\nlet remoteReloadScheduled=false;\nfunction scheduleRemotePhoneReload(){\n  if(!remotePhoneMode||!remoteRecoveryReady||remoteReloadScheduled)return;\n  if(document.visibilityState==="hidden")return;\n  remoteReloadScheduled=true;\n  setNetworkStatus("Connection interrupted • rejoining…");\n  setTimeout(()=>location.reload(),450);\n}\nfunction verifyRemotePhoneConnection(){\n  if(!remotePhoneMode||!remoteRecoveryReady||document.visibilityState==="hidden")return;\n  clearTimeout(remoteResumeTimer);\n  if(!hostConnection?.open){scheduleRemotePhoneReload();return}\n  if(!sendRemoteAction("resume")){scheduleRemotePhoneReload();return}\n  remoteResumeTimer=setTimeout(scheduleRemotePhoneReload,2200);\n}\ndocument.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(verifyRemotePhoneConnection,180)});\nwindow.addEventListener("pageshow",()=>{if(remoteRecoveryReady)setTimeout(verifyRemotePhoneConnection,220)});\nwindow.addEventListener("online",()=>{if(remoteRecoveryReady)setTimeout(verifyRemotePhoneConnection,120)});\n\nfunction startRemotePhone(){`,
'remote recovery helpers');

once(`  if(help)help.textContent="Live phone controller • keep this page open during the game.";`,
`  if(help)help.textContent="Live phone controller • you can briefly switch apps and return to the game.";`,
'phone recovery help text');

once(`  openJoinScreen("remote");\n  setNetworkStatus("Connecting to the host…");`,
`  openJoinScreen("remote");\n  const savedProfile=loadRemotePhoneProfile();\n  if(savedProfile?.name){\n    const input=document.getElementById("joinName");if(input)input.value=savedProfile.name;\n    selectedJoinAvatar=Math.max(0,Math.min(avatarOptions.length-1,Number(savedProfile.avatarIndex)||0));\n    renderJoinAvatars();\n  }\n  setNetworkStatus(savedProfile?.name?"Reconnecting to the host…":"Connecting to the host…");`,
'prefill saved phone identity');

once(`    hostConnection.on("open",()=>setNetworkStatus("Connected • enter your name to join"));`,
`    hostConnection.on("open",()=>{\n      const saved=loadRemotePhoneProfile();\n      if(saved?.name){\n        setNetworkStatus("Rejoining your player…");\n        sendRemoteAction("join",{name:saved.name,avatarIndex:Number(saved.avatarIndex)||0,token:remoteClientToken});\n      }else setNetworkStatus("Connected • enter your name to join");\n    });`,
'auto rejoin on connection open');

once(`        joinedPhonePlayerIndex=msg.playerIndex;\n        document.getElementById("phoneJoin").classList.remove("showing");`,
`        joinedPhonePlayerIndex=msg.playerIndex;\n        remoteRecoveryReady=true;remoteReloadScheduled=false;clearTimeout(remoteResumeTimer);\n        const saved=loadRemotePhoneProfile();if(saved?.name)saveRemotePhoneProfile(saved.name,saved.avatarIndex);\n        document.getElementById("phoneJoin").classList.remove("showing");`,
'enable recovery after successful join');

once(`      }else if(msg?.type==="join-error"){`,
`      }else if(msg?.type==="resume-ok"){\n        clearTimeout(remoteResumeTimer);remoteReloadScheduled=false;setNetworkStatus("Connected to host");\n      }else if(msg?.type==="join-error"){`,
'heartbeat response handling');

once(`    hostConnection.on("close",()=>setNetworkStatus("Host disconnected. Refresh to reconnect.",true));\n    hostConnection.on("error",()=>setNetworkStatus("Could not connect to this room. Check the code and host screen.",true));`,
`    hostConnection.on("close",()=>{setNetworkStatus("Connection interrupted • rejoining…");scheduleRemotePhoneReload()});\n    hostConnection.on("error",()=>{setNetworkStatus("Connection interrupted • rejoining…");scheduleRemotePhoneReload()});`,
'connection close recovery');

once(`  networkPeer.on("error",()=>setNetworkStatus("Could not connect to this room. Check the link and try again.",true));`,
`  networkPeer.on("error",()=>{\n    if(remoteRecoveryReady)scheduleRemotePhoneReload();\n    else setNetworkStatus("Could not connect to this room. Check the link and try again.",true);\n  });`,
'peer error recovery');

once(`function sendRemoteAction(action,data={}){\n  if(!remotePhoneMode||!hostConnection?.open){\n    setNetworkStatus("Connection lost. Reconnecting…",true);\n    return false;\n  }\n  hostConnection.send({type:"action",action,...data});\n  return true;\n}`,
`function sendRemoteAction(action,data={}){\n  if(!remotePhoneMode||!hostConnection?.open){\n    setNetworkStatus("Connection lost. Reconnecting…",true);\n    if(remoteRecoveryReady)scheduleRemotePhoneReload();\n    return false;\n  }\n  try{hostConnection.send({type:"action",action,...data});return true}\n  catch(e){if(remoteRecoveryReady)scheduleRemotePhoneReload();return false}\n}`,
'safe remote send');

// Keep pending local choice only until the host commits it or the follow-up view closes.
once(`    const visible=document.getElementById("followBox")?.classList.contains("visible");\n    follow.style.display=visible ? "block" : "none";\n    if(visible){`,
`    const visible=document.getElementById("followBox")?.classList.contains("visible");\n    follow.style.display=visible ? "block" : "none";\n    if(!visible)pendingPhoneFollowChoice=null;\n    if(visible){\n      if(Number.isInteger(current.followChoice))pendingPhoneFollowChoice=null;`,
'pending follow selection lifecycle');

if(!s.includes('phoneConfirmFollowup')||!s.includes('remoteRecoveryReady')||!s.includes('resume-ok')||!s.includes('whf-phone-profile:')) throw new Error('Required v10 markers missing');
fs.writeFileSync(path,s);
console.log('Applied follow-up confirmation and resilient phone reconnect v10');
