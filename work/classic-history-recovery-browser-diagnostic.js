// Real-browser Classic Back/Forward and bfcache recovery regression.
// Run over an HTTP server or deployed Pages:
//   node work/classic-history-recovery-browser-diagnostic.js https://ckopin21.github.io/what-happened-first/outputs
const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const CHROME=process.env.CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE=(process.argv[2]||"http://127.0.0.1:4173/outputs").replace(/\/$/,"");
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class Cdp{
  constructor(url){this.url=url;this.id=0;this.pending=new Map();this.events=[]}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.addEventListener("open",resolve,{once:true});this.ws.addEventListener("error",reject,{once:true})});
    this.ws.addEventListener("message",event=>{const msg=JSON.parse(event.data);if(msg.id){const p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);return}if(["Runtime.consoleAPICalled","Runtime.exceptionThrown","Log.entryAdded"].includes(msg.method))this.events.push(msg)});
    await this.send("Runtime.enable");await this.send("Log.enable");await this.send("Page.enable");
  }
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  async eval(expression){const result=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text||"Runtime evaluation failed");return result.result.value}
  close(){this.ws?.close()}
}
async function listTargets(port){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);if(r.ok)return r.json()}catch{}await delay(100)}throw Error(`Chrome ${port} did not start`)}
async function launch(port){const profile=fs.mkdtempSync(path.join(os.tmpdir(),`whf-classic-history-${port}-`));const child=spawn(CHROME,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--window-size=430,900","about:blank"],{stdio:"ignore",windowsHide:true});const target=(await listTargets(port)).find(x=>x.type==="page");if(!target)throw Error(`No page target for Chrome ${port}`);const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.open();return{child,profile,cdp}}
async function waitFor(cdp,expression,timeout=20000){const end=Date.now()+timeout;while(Date.now()<end){if(await cdp.eval(expression))return true;await delay(150)}return false}
async function navigateHistory(cdp,delta){const history=await cdp.send("Page.getNavigationHistory");const target=history.entries[history.currentIndex+delta];if(!target)throw Error(`No history entry at offset ${delta}`);await cdp.send("Page.navigateToHistoryEntry",{entryId:target.id})}
function eventText(event){const p=event.params||{};if(event.method==="Runtime.exceptionThrown")return p.exceptionDetails?.text||p.exceptionDetails?.exception?.description||"exception";if(event.method==="Runtime.consoleAPICalled")return `${p.type||"log"}: ${(p.args||[]).map(arg=>arg.value??arg.description??"").join(" ")}`;return `${p.entry?.level||"log"}: ${p.entry?.text||""}`}

(async()=>{
  if(!fs.existsSync(CHROME))throw Error(`Chrome not found: ${CHROME}`);
  const host=await launch(9365),phone=await launch(9366);
  try{
    const hostUrl=`${BASE}/classic-jeopardy.html?history=${Date.now()}`;
    await host.cdp.send("Page.navigate",{url:hostUrl});await waitFor(host.cdp,"document.readyState==='complete'");await waitFor(host.cdp,"typeof roomCode==='string'&&roomCode.length===4");
    const room=await host.cdp.eval("roomCode");await waitFor(host.cdp,"hostPeer?.open===true");
    const phoneUrl=`${BASE}/classic-jeopardy.html?mode=classic&phone=${room}&history=${Date.now()}`;
    await phone.cdp.send("Page.navigate",{url:`${BASE}/../index.html?history-seed=${Date.now()}`});await waitFor(phone.cdp,"document.readyState==='complete'");
    await phone.cdp.send("Page.navigate",{url:phoneUrl});await waitFor(phone.cdp,"document.readyState==='complete'");await waitFor(phone.cdp,"phonePeer?.open===true");await waitFor(phone.cdp,"phoneConn?.open===true");
    await phone.cdp.eval("document.getElementById('nameInput').value='History Player';joinGame();true");
    if(!await waitFor(host.cdp,"players.length===1"))throw Error("Initial history-test join failed");
    const identity=await host.cdp.eval("({id:players[0].playerId,token:players[0].token,score:players[0].score})");
    await host.cdp.eval("startGame();true");if(!await waitFor(phone.cdp,"phoneState?.mode===\"choose\""))throw Error("Phone did not enter board phase");
    const clue=await host.cdp.eval("(()=>{for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const c=categories[ci].clues[qi],id=clueId(ci,qi);if(c&&!used.has(id)&&!dailyDoubleIds.has(id)&&!c.followup)return{ci,qi,id}}return null})()");
    await phone.cdp.eval(`phoneSelect(${clue.ci},${clue.qi});true`);if(!await waitFor(phone.cdp,"phoneState?.mode===\"answer\""))throw Error("Initial clue did not open");
    await phone.cdp.eval("document.getElementById('phoneAnswerInput').value='No answer';submitPhoneAnswer();true");if(!await waitFor(host.cdp,"questionRevealed===true"))throw Error("Initial clue did not reveal");await host.cdp.eval("applyScores();true");if(!await waitFor(host.cdp,"!current&&!questionRevealed"))throw Error("Initial clue did not resolve");
    const cycles=[];
    for(let cycle=1;cycle<=3;cycle++){
      // Build a seed -> controller history pair, then exercise Back -> Forward.
      await phone.cdp.send("Page.navigate",{url:`${BASE}/../index.html?history-seed=${Date.now()}-${cycle}`});await waitFor(phone.cdp,"document.readyState==='complete'");
      await phone.cdp.send("Page.navigate",{url:`${phoneUrl}&cycle=${cycle}`});await waitFor(phone.cdp,"document.readyState==='complete'");await waitFor(phone.cdp,"phoneConn?.open===true");await waitFor(host.cdp,"players.length===1");
      await navigateHistory(phone.cdp,-1);if(!await waitFor(phone.cdp,"!location.pathname.includes('classic-jeopardy.html')"))throw Error(`Cycle ${cycle}: Back did not leave controller`);
      await navigateHistory(phone.cdp,1);
      const restored=await waitFor(phone.cdp,"phoneConn?.open===true&&phoneState?.playerIndex===0&&phoneLeaving===false",25000);if(!restored)throw Error(`Cycle ${cycle}: Forward did not restore Classic controller`);
      const state=await phone.cdp.eval("({url:location.href,mode:phoneState?.mode||null,id:phoneState?.players?.[phoneState.playerIndex]?.playerId||null,token:(()=>{try{return JSON.parse(localStorage.getItem(PHONE_TOKEN_KEY)||'{}')[phoneRoom]||''}catch{return''}})(),leaving:phoneLeaving})");
      const hostState=await host.cdp.eval("({count:players.length,id:players[0]?.playerId||null,score:players[0]?.score||0,active:activePlayer,current:!!current})");
      cycles.push({cycle,state,host:hostState,sameIdentity:state.id===identity.id&&hostState.id===identity.id,seatCountStable:hostState.count===1});
      if(!cycles.at(-1).sameIdentity||!cycles.at(-1).seatCountStable||!state.token||state.mode!=="choose")throw Error(`Cycle ${cycle}: identity/state was not restored`);
    }
    const exceptions=[...host.cdp.events,...phone.cdp.events].map(eventText).filter(text=>/exception|error/i.test(text)&&!/AudioContext was not allowed/.test(text)&&!/Failed to load resource: the server responded with a status of 404/.test(text));
    const report={room,identity,cycles,exceptions};console.log(JSON.stringify(report,null,2));if(cycles.length!==3||cycles.some(c=>!c.sameIdentity||!c.seatCountStable)||exceptions.length)process.exitCode=2;
  }finally{host.cdp.close();phone.cdp.close();host.child.kill();phone.child.kill();await delay(300);for(const item of [host,phone])try{fs.rmSync(item.profile,{recursive:true,force:true})}catch{}}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
