const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const CHROME=process.env.CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE=process.argv[2]||"https://ckopin21.github.io/what-happened-first/outputs";
const FORCE_RELAY=process.argv.includes("--relay");
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

class Cdp {
  constructor(url,label){this.url=url;this.label=label;this.id=0;this.pending=new Map();this.events=[]}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.addEventListener("open",resolve,{once:true});this.ws.addEventListener("error",reject,{once:true})});
    this.ws.addEventListener("message",event=>{
      const msg=JSON.parse(event.data);
      if(msg.id){const item=this.pending.get(msg.id);if(!item)return;this.pending.delete(msg.id);msg.error?item.reject(new Error(msg.error.message)):item.resolve(msg.result);return}
      if(["Runtime.consoleAPICalled","Runtime.exceptionThrown","Log.entryAdded","Network.loadingFailed","Network.webSocketFrameError"].includes(msg.method))this.events.push(msg);
    });
    await this.send("Runtime.enable");await this.send("Log.enable");await this.send("Network.enable");await this.send("Page.enable");
  }
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  async eval(expression){const result=await this.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value}
  close(){this.ws?.close()}
}

async function waitForJson(port,route="/json/list"){
  let last;
  for(let i=0;i<80;i++){try{const response=await fetch(`http://127.0.0.1:${port}${route}`);if(response.ok)return await response.json()}catch(error){last=error}await delay(100)}
  throw last||new Error(`Chrome ${port} did not start`);
}

async function launch(port,label){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),`whf-${label}-`));
  const child=spawn(CHROME,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","about:blank"],{stdio:"ignore",windowsHide:true});
  const targets=await waitForJson(port);
  const target=targets.find(x=>x.type==="page");if(!target)throw new Error(`No page target for ${label}`);
  const cdp=new Cdp(target.webSocketDebuggerUrl,label);await cdp.open();
  return {child,profile,cdp};
}

async function waitFor(cdp,expression,timeout=15000){
  const end=Date.now()+timeout;
  while(Date.now()<end){if(await cdp.eval(expression))return true;await delay(200)}
  return false;
}

function eventSummary(event){
  const p=event.params||{};
  if(event.method==="Runtime.consoleAPICalled")return `${event.method}: ${(p.args||[]).map(x=>x.value||x.description).join(" ")}`;
  if(event.method==="Runtime.exceptionThrown")return `${event.method}: ${p.exceptionDetails?.exception?.description||p.exceptionDetails?.text}`;
  if(event.method==="Log.entryAdded")return `${event.method}: ${p.entry?.level} ${p.entry?.text}`;
  if(event.method==="Network.loadingFailed")return `${event.method}: ${p.errorText} ${p.blockedReason||""}`;
  return `${event.method}: ${JSON.stringify(p)}`;
}

async function state(cdp,kind){
  return cdp.eval(`(async()=>{
    const peer=${kind==="timeline"?"networkPeer":"(phoneRoom?phonePeer:hostPeer)"};
    const conn=${kind==="timeline"?"(remotePhoneMode?hostConnection:[...remoteConnections.values()][0]?.conn)":"(phoneRoom?phoneConn:[...remoteContexts.values()][0]?.conn)"};
    const pc=conn?.peerConnection||conn?._negotiator?.connection||null;
    let selectedPair=null;
    if(pc){const stats=await pc.getStats();stats.forEach(item=>{if(item.type==="candidate-pair"&&item.state==="succeeded"&&(item.nominated||item.selected)){const local=stats.get(item.localCandidateId),remote=stats.get(item.remoteCandidateId);selectedPair={localType:local?.candidateType||null,remoteType:remote?.candidateType||null,protocol:local?.protocol||null}}})}
    return {
      href:location.href,peerLoaded:typeof Peer==="function",peerId:peer?.id||null,peerOpen:!!peer?.open,
      peerDisconnected:!!peer?.disconnected,peerDestroyed:!!peer?.destroyed,connectionPeer:conn?.peer||null,
      dataOpen:!!conn?.open,dataType:conn?.type||null,iceConnectionState:pc?.iceConnectionState||null,
      iceGatheringState:pc?.iceGatheringState||null,signalingState:pc?.signalingState||null,connectionState:pc?.connectionState||null,
      selectedPair,
      status:document.getElementById(${kind==="timeline"?'"networkStatus"':'phoneRoom?"joinStatus":"networkStatus"'})?.textContent||"",
      hostConnections:${kind==="timeline"?"(remotePhoneMode?null:remoteConnections.size)":"(phoneRoom?null:remoteContexts.size)"}
    };
  })()`)
}

async function runGame(host,phone,file,kind){
  const hostUrl=`${BASE}/${file}?diagnostic=${Date.now()}${FORCE_RELAY?"&networkRelay=1":""}`;
  await host.cdp.send("Page.navigate",{url:hostUrl});
  await waitFor(host.cdp,"document.readyState==='complete'");
  await waitFor(host.cdp,kind==="timeline"?"typeof roomCode==='string'&&roomCode.length===4":"typeof roomCode==='string'&&roomCode.length===4");
  const room=await host.cdp.eval("roomCode");
  const expected=await host.cdp.eval(kind==="timeline"?"peerRoomId(roomCode)":"hostPeerId(roomCode)");
  await waitFor(host.cdp,kind==="timeline"?"networkPeer?.open===true":"hostPeer?.open===true",12000);
  const phoneUrl=`${BASE}/${file}?phone=${room}&diagnostic=${Date.now()}${FORCE_RELAY?"&networkRelay=1":""}`;
  await phone.cdp.send("Page.navigate",{url:phoneUrl});
  await waitFor(phone.cdp,"document.readyState==='complete'");
  await waitFor(phone.cdp,kind==="timeline"?"networkPeer?.open===true":"phonePeer?.open===true",12000);
  await waitFor(phone.cdp,kind==="timeline"?"hostConnection?.open===true":"phoneConn?.open===true",15000);
  const computed=await phone.cdp.eval(kind==="timeline"?"peerRoomId(roomCode)":"hostPeerId(phoneRoom)");
  await phone.cdp.eval(kind==="timeline"?"document.getElementById('joinName').value='Diagnostic Player';joinPhoneGame();true":"document.getElementById('nameInput').value='Diagnostic Player';joinGame();true");
  const joined=await waitFor(host.cdp,kind==="timeline"?"playerCount===1":"players.length===1",8000);
  const identityBound=await host.cdp.eval(kind==="timeline"?"[...remoteConnections.values()].some(ctx=>ctx.playerId&&ctx.playerId===players[0]?.playerId)":"[...remoteContexts.values()].some(ctx=>ctx.playerId&&ctx.playerId===players[0]?.playerId)");
  const beforeReloadCount=await host.cdp.eval(kind==="timeline"?"playerCount":"players.length");
  await phone.cdp.send("Page.navigate",{url:`${phoneUrl}&reload=1`});
  await waitFor(phone.cdp,"document.readyState==='complete'");
  const reconnected=await waitFor(phone.cdp,kind==="timeline"?"hostConnection?.open===true&&joinedPhonePlayerIndex===0":"phoneConn?.open===true&&phoneState?.playerIndex===0",20000);
  const afterReloadCount=await host.cdp.eval(kind==="timeline"?"playerCount":"players.length");
  await phone.cdp.eval(kind==="timeline"?"window.confirm=()=>true;leavePhoneGame();true":"window.confirm=()=>true;leaveClassicGame();true");
  const left=await waitFor(host.cdp,kind==="timeline"?"playerCount===0":"players.length===0",8000);
  await delay(1200);
  const stayedLeft=await host.cdp.eval(kind==="timeline"?"playerCount===0":"players.length===0");
  await phone.cdp.send("Page.navigate",{url:`${phoneUrl}&removed=1`});
  await waitFor(phone.cdp,"document.readyState==='complete'",10000);
  await waitFor(phone.cdp,kind==="timeline"?"hostConnection?.open===true":"phoneConn?.open===true",20000);
  await phone.cdp.eval(kind==="timeline"?"document.getElementById('joinName').value='Removal Check';joinPhoneGame();true":"document.getElementById('nameInput').value='Removal Check';joinGame();true");
  const rejoinedForRemoval=await waitFor(host.cdp,kind==="timeline"?"playerCount===1":"players.length===1",8000);
  await host.cdp.eval(kind==="timeline"?"window.confirm=()=>true;hostRemoveTimelinePlayer(0);true":"window.confirm=()=>true;hostRemoveClassicPlayer(0);true");
  const removed=await waitFor(host.cdp,kind==="timeline"?"playerCount===0":"players.length===0",8000);
  const removalPhoneState=await phone.cdp.eval(kind==="timeline"?"({leaving:remoteLeaving,status:document.getElementById('networkStatus')?.textContent||''})":"({leaving:phoneLeaving,status:document.getElementById('joinStatus')?.textContent||''})");
  const hostRemovalMessage=/removed/i.test(removalPhoneState.status);
  const report={kind,file,room,expectedHostPeerId:expected,phoneComputedHostPeerId:computed,idsMatch:expected===computed,joined,identityBound,reconnected,beforeReloadCount,afterReloadCount,noDuplicatePlayer:beforeReloadCount===1&&afterReloadCount===1,left,stayedLeft,rejoinedForRemoval,removed,hostRemovalMessage,host:await state(host.cdp,kind),phone:await state(phone.cdp,kind),hostEvents:host.cdp.events.map(eventSummary),phoneEvents:phone.cdp.events.map(eventSummary)};
  console.log(JSON.stringify(report,null,2));
  host.cdp.events.length=0;phone.cdp.events.length=0;
  return report;
}

(async()=>{
  if(!fs.existsSync(CHROME))throw new Error(`Chrome not found: ${CHROME}`);
  const host=await launch(9333,"host"),phone=await launch(9334,"phone");
  try{
    const timeline=await runGame(host,phone,"dog-jeopardy.html","timeline");
    const classic=await runGame(host,phone,"classic-jeopardy.html","classic");
    if(!timeline.phone.dataOpen||!classic.phone.dataOpen||!timeline.joined||!classic.joined||!timeline.identityBound||!classic.identityBound||!timeline.reconnected||!classic.reconnected||!timeline.noDuplicatePlayer||!classic.noDuplicatePlayer||!timeline.left||!classic.left||!timeline.stayedLeft||!classic.stayedLeft||!timeline.rejoinedForRemoval||!classic.rejoinedForRemoval||!timeline.removed||!classic.removed||!timeline.hostRemovalMessage||!classic.hostRemovalMessage)process.exitCode=2;
  }finally{
    host.cdp.close();phone.cdp.close();host.child.kill();phone.child.kill();
    await delay(500);
    for(const profile of [host.profile,phone.profile])try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
