const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const DEFAULT_CHROME=process.platform==="win32"
  ?"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  :"/usr/bin/google-chrome";
const CHROME=process.env.CHROME_PATH||DEFAULT_CHROME;
const BASE=(process.argv[2]||"http://127.0.0.1:4173/outputs").replace(/\/$/,"");
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const LONG_TIMELINE_NAMES=["Alexandria Weston","Christopher Miles","Maximilian Stone","Penelope Carter","Theodore Bennett"];
const LONG_CLASSIC_NAMES=["Alexandria Montgomery","Christopher Vandermeer","Maximilian Kensington","Penelope Worthington","Theodore Ravenscroft"];

class Cdp{
  constructor(url,label){this.url=url;this.label=label;this.id=0;this.pending=new Map();this.events=[]}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.addEventListener("open",resolve,{once:true});this.ws.addEventListener("error",reject,{once:true})});
    this.ws.addEventListener("message",event=>{
      const msg=JSON.parse(event.data);
      if(msg.id){
        const p=this.pending.get(msg.id);if(!p)return;
        this.pending.delete(msg.id);
        msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);
        return;
      }
      if(["Runtime.consoleAPICalled","Runtime.exceptionThrown","Log.entryAdded"].includes(msg.method))this.events.push(msg);
    });
    await this.send("Runtime.enable");
    await this.send("Log.enable");
    await this.send("Page.enable");
  }
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  async eval(expression){
    const result=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||"Runtime evaluation failed");
    return result.result.value;
  }
  close(){this.ws?.close()}
}
async function listTargets(port){
  for(let i=0;i<100;i++){
    try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);if(r.ok)return r.json()}catch{}
    await delay(100);
  }
  throw Error(`Chrome ${port} did not start`);
}
async function launch(port,label,width,height){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),`whf-layout-${label}-`));
  const child=spawn(CHROME,[
    `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
    "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
    `--window-size=${width},${height}`,"about:blank"
  ],{stdio:"ignore",windowsHide:true});
  const target=(await listTargets(port)).find(x=>x.type==="page");
  if(!target)throw Error(`No page target for ${label}`);
  const cdp=new Cdp(target.webSocketDebuggerUrl,label);await cdp.open();
  await setViewport(cdp,width,height);
  return{child,profile,cdp};
}
async function setViewport(cdp,width,height){
  await cdp.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  await delay(80);
}
async function waitFor(cdp,expression,timeout=18000){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    try{if(await cdp.eval(expression))return true}catch{}
    await delay(150);
  }
  return false;
}
async function navigate(cdp,url){
  await cdp.send("Page.navigate",{url});
  if(!await waitFor(cdp,"document.readyState==='complete'",20000))throw Error(`Navigation timed out: ${url}`);
}
function eventText(event){
  const p=event.params||{};
  if(event.method==="Runtime.exceptionThrown")return p.exceptionDetails?.exception?.description||p.exceptionDetails?.text||"exception";
  if(event.method==="Runtime.consoleAPICalled")return `${p.type||"log"}: ${(p.args||[]).map(a=>a.value??a.description??"").join(" ")}`;
  return `${p.entry?.level||"log"}: ${p.entry?.text||""}`;
}
async function audit(cdp,label){
  const result=await cdp.eval(`(()=>{
    const issues=[];
    const visible=el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=="none"&&cs.visibility!=="hidden"&&Number(cs.opacity||1)>.01&&r.width>.5&&r.height>.5;
    };
    const text=el=>{
      if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)return String(el.value||el.placeholder||"").trim();
      if(el instanceof HTMLSelectElement)return String(el.selectedOptions?.[0]?.textContent||"").trim();
      return String(el.innerText||"").replace(/\\\\s+/g," ").trim();
    };
    const desc=el=>{
      const id=el.id?"#"+el.id:"";
      const cls=typeof el.className==="string"&&el.className.trim()?"."+el.className.trim().split(/\\\\s+/).slice(0,3).join("."):"";
      return (el.tagName.toLowerCase()+id+cls).slice(0,180);
    };
    const meaningful=el=>el.matches("button,input,select,textarea,label,[role='button'],.player,.player-name,.category,.clue,.question,.answer,.phone-name,.phone-room,.phone-kicker,.phone-score,.phone-meta,.phone-question,.phone-choice,.phone-action,.classic-preview-name,.classic-preview-score,.classic-preview-cat,.classic-preview-q,.classic-preview-question,.winner-tag,.status-bar,.small-note,.join-note,.phone-status,.modal-card,.daily-double-title,.dev-title,.dev-kicker");
    const all=[...document.body.querySelectorAll("*")].filter(visible);
    if(document.documentElement.scrollWidth>window.innerWidth+3){
      issues.push({type:"page-horizontal-overflow",amount:document.documentElement.scrollWidth-window.innerWidth});
    }
    for(const el of all){
      const t=text(el);if(!t)continue;
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      if(cs.textOverflow==="ellipsis")issues.push({type:"ellipsis",element:desc(el),text:t.slice(0,120)});
      if((cs.overflowX==="hidden"||cs.overflowX==="clip")&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+2){
        issues.push({type:"clipped-x",element:desc(el),delta:el.scrollWidth-el.clientWidth,text:t.slice(0,120)});
      }
      if((cs.overflowY==="hidden"||cs.overflowY==="clip")&&el.clientHeight>0&&el.scrollHeight>el.clientHeight+2){
        issues.push({type:"clipped-y",element:desc(el),delta:el.scrollHeight-el.clientHeight,text:t.slice(0,120)});
      }
      if(meaningful(el)&&(r.left<-3||r.right>window.innerWidth+3)){
        issues.push({type:"viewport-x",element:desc(el),left:Math.round(r.left),right:Math.round(r.right),width:window.innerWidth,text:t.slice(0,120)});
      }
    }
    for(const parent of all){
      const pcs=getComputedStyle(parent);
      if(!["flex","grid","block"].includes(pcs.display))continue;
      const kids=[...parent.children].filter(el=>visible(el)&&meaningful(el)).filter(el=>{
        const p=getComputedStyle(el).position;
        return p!=="absolute"&&p!=="fixed"&&p!=="sticky";
      });
      if(kids.length<2||kids.length>24)continue;
      for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){
        const a=kids[i].getBoundingClientRect(),b=kids[j].getBoundingClientRect();
        const w=Math.min(a.right,b.right)-Math.max(a.left,b.left);
        const h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(w>3&&h>3){
          issues.push({type:"sibling-overlap",a:desc(kids[i]),b:desc(kids[j]),overlap:[Math.round(w),Math.round(h)]});
        }
      }
    }
    const dedup=[];const seen=new Set();
    for(const issue of issues){
      const key=JSON.stringify(issue);if(!seen.has(key)){seen.add(key);dedup.push(issue)}
    }
    return {viewport:[window.innerWidth,window.innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],issues:dedup.slice(0,80)};
  })()`);
  console.log(JSON.stringify({label,...result},null,2));
  return result.issues.map(issue=>({label,...issue}));
}
async function addTimelinePlayers(cdp){
  for(const name of LONG_TIMELINE_NAMES){
    await cdp.eval(`openComputerJoin();document.getElementById("hostJoinName").value=${JSON.stringify(name)};addComputerPlayer();true`);
  }
}
async function addClassicPlayers(cdp){
  for(const name of LONG_CLASSIC_NAMES){
    await cdp.eval(`openClassicAddPlayer();document.getElementById("classicAddName").value=${JSON.stringify(name)};addClassicLocalPlayer();true`);
  }
}
async function hostVisualAudit(cdp,kind,file){
  const issues=[];
  await setViewport(cdp,1280,720);
  await navigate(cdp,`${BASE}/${file}?layout-host=${Date.now()}`);
  await waitFor(cdp,"typeof roomCode==='string'&&roomCode.length===4");
  if(kind==="timeline")await addTimelinePlayers(cdp);else await addClassicPlayers(cdp);
  issues.push(...await audit(cdp,`${kind}-host-lobby-1280x720`));
  await setViewport(cdp,1024,600);
  issues.push(...await audit(cdp,`${kind}-host-lobby-1024x600`));
  await setViewport(cdp,1280,720);
  await cdp.eval("startGame();true");
  issues.push(...await audit(cdp,`${kind}-host-board-1280x720`));
  if(kind==="timeline"){
    await cdp.eval(`(()=>{const id="0-0";used.add(id);categories[0].clues[0].winnerName=players[0].name;buildBoard();return true})()`);
  }else{
    await cdp.eval(`(()=>{const id=clueId(0,0);used.add(id);history.set(id,{winners:[players[0].name,players[1].name]});renderHost();return true})()`);
  }
  issues.push(...await audit(cdp,`${kind}-host-used-tile-long-name`));
  if(kind==="timeline"){
    await cdp.eval(`(()=>{let best=null;for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const item=categories[ci].clues[qi],key=ci+"-"+qi;if(used.has(key)||dailyDoubleKeys.has(key))continue;if(!best||String(item.q||"").length>String(best.item.q||"").length)best={key,item,base:(qi+1)*100};}if(best)openClue(best.key,best.item,best.base,false);return !!best})()`);
  }else{
    await cdp.eval(`(()=>{let best=null;for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const clue=categories[ci].clues[qi],id=clueId(ci,qi);if(used.has(id)||dailyDoubleIds.has(id))continue;if(!best||String(clue.question||"").length>String(best.clue.question||"").length)best={ci,qi,clue};}return best?openClue(best.ci,best.qi,activePlayer):false})()`);
  }
  await delay(150);
  issues.push(...await audit(cdp,`${kind}-host-long-question-1280x720`));
  if(kind==="timeline"){
    await cdp.eval("joinedPhonePlayerIndex=0;document.getElementById('modal')?.classList.remove('showing');current=null;openControllerPreview();true");
  }else{
    await cdp.eval("document.getElementById('questionOverlay')?.classList.remove('showing');current=null;openClassicPhonePreview();true");
  }
  issues.push(...await audit(cdp,`${kind}-host-phone-preview-1280x720`));
  if(kind==="timeline")await cdp.eval("closeControllerPreview();document.body.classList.add('fullscreen-game');true");
  else await cdp.eval("closeClassicPhonePreview();document.body.classList.add('fullscreen-game');true");
  await setViewport(cdp,1280,720);
  issues.push(...await audit(cdp,`${kind}-fullscreen-1280x720`));
  await setViewport(cdp,1024,600);
  issues.push(...await audit(cdp,`${kind}-fullscreen-1024x600`));
  return issues;
}
async function remotePhoneAudit(host,phone,kind,file){
  const issues=[];
  await setViewport(host.cdp,1280,720);
  await navigate(host.cdp,`${BASE}/${file}?layout-net=${Date.now()}`);
  await waitFor(host.cdp,"typeof roomCode==='string'&&roomCode.length===4");
  const peerOpen=kind==="timeline"?"networkPeer?.open===true":"hostPeer?.open===true";
  if(!await waitFor(host.cdp,peerOpen,15000))throw Error(`${kind}: host PeerJS did not open`);
  const room=await host.cdp.eval("roomCode");
  await setViewport(phone.cdp,390,844);
  await navigate(phone.cdp,`${BASE}/${file}?phone=${room}&layout-net=${Date.now()}`);
  const phonePeer=kind==="timeline"?"networkPeer?.open===true&&hostConnection?.open===true":"phonePeer?.open===true&&phoneConn?.open===true";
  if(!await waitFor(phone.cdp,phonePeer,18000))throw Error(`${kind}: phone connection did not open`);
  if(kind==="timeline")await phone.cdp.eval("document.getElementById('joinName').value='Alexandria Weston';joinPhoneGame();true");
  else await phone.cdp.eval("document.getElementById('nameInput').value='Alexandria Montgomery';joinGame();true");
  const joined=kind==="timeline"?"playerCount===1":"players.length===1";
  if(!await waitFor(host.cdp,joined,10000))throw Error(`${kind}: phone player did not join`);
  issues.push(...await audit(phone.cdp,`${kind}-phone-lobby-390x844`));
  await host.cdp.eval("startGame();true");
  const choose=kind==="timeline"?"joinedPhonePlayerIndex===0&&gameStarted":"phoneState?.mode==='choose'";
  await waitFor(phone.cdp,choose,10000);
  issues.push(...await audit(phone.cdp,`${kind}-phone-board-390x844`));
  await setViewport(phone.cdp,360,740);
  issues.push(...await audit(phone.cdp,`${kind}-phone-board-360x740`));
  await setViewport(phone.cdp,390,844);
  if(kind==="timeline"){
    await host.cdp.eval(`(()=>{let best=null;for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const item=categories[ci].clues[qi],key=ci+"-"+qi;if(dailyDoubleKeys.has(key))continue;if(!best||String(item.q||"").length>String(best.item.q||"").length)best={key,item,base:(qi+1)*100};}if(best)openClue(best.key,best.item,best.base,false);return !!best})()`);
    await waitFor(phone.cdp,"!!current||document.querySelector('.phone-question')",8000);
  }else{
    await host.cdp.eval(`(()=>{let best=null;for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const clue=categories[ci].clues[qi],id=clueId(ci,qi);if(dailyDoubleIds.has(id))continue;if(!best||String(clue.question||"").length>String(best.clue.question||"").length)best={ci,qi,clue};}return best?openClue(best.ci,best.qi,activePlayer):false})()`);
    await waitFor(phone.cdp,"phoneState?.mode==='answer'",8000);
  }
  await delay(150);
  issues.push(...await audit(phone.cdp,`${kind}-phone-long-question-390x844`));
  await setViewport(phone.cdp,360,740);
  issues.push(...await audit(phone.cdp,`${kind}-phone-long-question-360x740`));
  return issues;
}

(async()=>{
  if(!fs.existsSync(CHROME))throw Error(`Chrome not found: ${CHROME}`);
  const host=await launch(9380,"host",1280,720);
  const phone=await launch(9381,"phone",390,844);
  const allIssues=[];
  try{
    allIssues.push(...await hostVisualAudit(host.cdp,"timeline","dog-jeopardy.html"));
    allIssues.push(...await hostVisualAudit(host.cdp,"classic","classic-jeopardy.html"));
    allIssues.push(...await remotePhoneAudit(host,phone,"timeline","dog-jeopardy.html"));
    allIssues.push(...await remotePhoneAudit(host,phone,"classic","classic-jeopardy.html"));
    const exceptions=[...host.cdp.events,...phone.cdp.events].map(eventText).filter(t=>/exception|error/i.test(t)&&!/AudioContext was not allowed/.test(t)&&!/Failed to load resource: the server responded with a status of 404/.test(t));
    console.log(JSON.stringify({summary:{issueCount:allIssues.length,exceptionCount:exceptions.length},issues:allIssues,exceptions},null,2));
    if(allIssues.length||exceptions.length)process.exitCode=2;
  }finally{
    host.cdp.close();phone.cdp.close();host.child.kill();phone.child.kill();await delay(250);
    for(const item of [host,phone])try{fs.rmSync(item.profile,{recursive:true,force:true})}catch{}
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
