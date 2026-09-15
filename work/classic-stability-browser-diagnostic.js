// Real-browser Classic turn-transition regression.
// Run over an HTTP server: node work/classic-stability-browser-diagnostic.js http://127.0.0.1:4173/outputs
const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const CHROME=process.env.CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE=process.argv[2]||"http://127.0.0.1:4173/outputs";
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
  async eval(expression){const result=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value}
  close(){this.ws?.close()}
}
async function listTargets(port){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);if(r.ok)return r.json()}catch{}await delay(100)}throw Error(`Chrome ${port} did not start`)}
async function launch(port){const profile=fs.mkdtempSync(path.join(os.tmpdir(),`whf-classic-${port}-`));const child=spawn(CHROME,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--window-size=430,900","about:blank"],{stdio:"ignore",windowsHide:true});const target=(await listTargets(port)).find(x=>x.type==="page");const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.open();return{child,profile,cdp}}
async function waitFor(cdp,expression,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await cdp.eval(expression))return true;await delay(120)}return false}
function eventText(event){const p=event.params||{};if(event.method==="Runtime.exceptionThrown")return p.exceptionDetails?.text||p.exceptionDetails?.exception?.description||"exception";if(event.method==="Runtime.consoleAPICalled")return `${p.type||"log"}: ${(p.args||[]).map(arg=>arg.value??arg.description??"").join(" ")}`;return `${p.entry?.level||"log"}: ${p.entry?.text||""}`}

(async()=>{
  if(!fs.existsSync(CHROME))throw Error(`Chrome not found: ${CHROME}`);
  const host=await launch(9355),phones=await Promise.all([launch(9356),launch(9357),launch(9358)]);
  try{
    const url=`${BASE}/classic-jeopardy.html?stability=${Date.now()}`;
    await host.cdp.send("Page.navigate",{url});await waitFor(host.cdp,"document.readyState==='complete'");await waitFor(host.cdp,"typeof roomCode==='string'&&roomCode.length===4");
    const room=await host.cdp.eval("roomCode");await waitFor(host.cdp,"hostPeer?.open===true",15000);
    for(const [i,phone] of phones.entries()){
      await phone.cdp.send("Page.navigate",{url:`${BASE}/classic-jeopardy.html?phone=${room}&stability=${Date.now()}`});await waitFor(phone.cdp,"document.readyState==='complete'");await waitFor(phone.cdp,"phonePeer?.open===true",15000);await waitFor(phone.cdp,"phoneConn?.open===true",15000);
      await phone.cdp.eval(`document.getElementById("nameInput").value="Player ${String.fromCharCode(65+i)}";joinGame();true`);
      if(!await waitFor(host.cdp,`players.length===${i+1}`,20000)){
        console.log(JSON.stringify({failedJoin:i+1,host:await host.cdp.eval("({players:players.map(p=>({name:p.name,id:p.playerId})),contexts:remoteContexts.size,status:document.getElementById('networkStatus')?.textContent||''})"),phone:await phone.cdp.eval("({status:document.getElementById('joinStatus')?.textContent||'',state:phoneState?.mode||null,conn:!!phoneConn?.open})"),phoneEvents:phone.cdp.events.map(eventText)}));
        throw Error(`Classic player ${i+1} did not join`);
      }
    }
    await host.cdp.eval("startGame();true");
    const rounds=[];
    for(let round=0;round<12;round++){
      const picked=await host.cdp.eval("(()=>{for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const c=categories[ci].clues[qi],id=clueId(ci,qi);if(c&&!used.has(id)&&!dailyDoubleIds.has(id)&&!c.followup)return{ci,qi,id}}return null})()");
      if(!picked)break;
      const active=await host.cdp.eval("activePlayer");
      await phones[active].cdp.eval(`phoneSelect(${picked.ci},${picked.qi});true`);
      if(!await waitFor(host.cdp,"!!current&&!questionRevealed",10000))throw Error(`Round ${round+1}: clue did not open`);
      if(!await Promise.all(phones.map(phone=>waitFor(phone.cdp,"phoneState?.mode===\"answer\"",10000))).then(values=>values.every(Boolean)))throw Error(`Round ${round+1}: not all phones entered answer phase`);
      await Promise.all(phones.map(phone=>phone.cdp.eval("document.getElementById('phoneAnswerInput').value='No answer';submitPhoneAnswer();true")));
      if(!await waitFor(host.cdp,"questionRevealed===true&&!!current",10000))throw Error(`Round ${round+1}: automatic reveal did not happen`);
      await host.cdp.eval("applyScores();true");
      const cleared=await waitFor(host.cdp,`!current&&!questionRevealed&&used.has("${picked.id}")`,10000);
      const next=await host.cdp.eval("activePlayer");
      rounds.push({round:round+1,clue:picked.id,active,cleared,next,expectedNext:(active+1)%3,phoneModes:await Promise.all(phones.map(phone=>phone.cdp.eval("phoneState?.mode||null")))});
      if(!cleared||next!==(active+1)%3)throw Error(`Round ${round+1}: state failed to clear/advance`);
    }
    const mechanics={};
    const lastChanceClue=await host.cdp.eval("(()=>{for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const c=categories[ci].clues[qi],id=clueId(ci,qi);if(c&&!used.has(id)&&!dailyDoubleIds.has(id)&&!c.followup)return{ci,qi,id}}return null})()");
    const lcOwner=await host.cdp.eval("activePlayer");
    await host.cdp.eval(`lastChanceAwarded=true;lastChancePlayerIndex=${lcOwner};lastChancePlayerId=players[${lcOwner}]?.playerId||null;lastChancePending=true;renderHost();broadcastState();true`);
    await phones[lcOwner].cdp.eval(`phoneSelect(${lastChanceClue.ci},${lastChanceClue.qi});true`);
    if(!await waitFor(host.cdp,"!!current&&!questionRevealed&&current.lastChancePlayerId===lastChancePlayerId",10000))throw Error("Last Chance clue did not open");
    await Promise.all(phones.map(phone=>waitFor(phone.cdp,"phoneState?.mode===\"answer\"",10000)));
    await Promise.all(phones.map(phone=>phone.cdp.eval("document.getElementById('phoneAnswerInput').value='wrong';submitPhoneAnswer();true")));
    if(!await waitFor(host.cdp,"questionRevealed===true",10000))throw Error("Last Chance clue did not reveal");
    await host.cdp.eval("players.forEach((_p,i)=>setJudgement(i,true));true");
    const lcBefore=await host.cdp.eval("players.map(p=>p.score)");await host.cdp.eval("applyScores();true");
    if(!await waitFor(host.cdp,"!current&&!questionRevealed",10000))throw Error("Last Chance clue did not resolve");
    const lcAfter=await host.cdp.eval("players.map(p=>p.score)");mechanics.lastChance={owner:lcOwner,ownerDelta:lcAfter[lcOwner]-lcBefore[lcOwner],otherDelta:lcAfter[(lcOwner+1)%3]-lcBefore[(lcOwner+1)%3],consumed:await host.cdp.eval("!lastChancePending")};

    const dailyClue=await host.cdp.eval("(()=>{for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const c=categories[ci].clues[qi],id=clueId(ci,qi);if(c&&!used.has(id)&&!c.followup)return{ci,qi,id}}return null})()");
    const dailyActive=await host.cdp.eval("activePlayer");
    await host.cdp.eval(`dailyDoubleIds=new Set(["${dailyClue.id}"]);renderHost();broadcastState();true`);
    await phones[dailyActive].cdp.eval(`phoneSelect(${dailyClue.ci},${dailyClue.qi});true`);
    if(!await waitFor(host.cdp,"!!pendingDaily&&!current",10000))throw Error("Daily Double did not open");
    const dailyModes=await Promise.all(phones.map(phone=>waitFor(phone.cdp,"phoneState?.mode===\"daily-wager\"||phoneState?.mode===\"wait-daily\"",10000)));
    await phones[dailyActive].cdp.eval("document.getElementById('phoneDailyWager').value='100';submitPhoneDailyWager();true");
    if(!await waitFor(host.cdp,"!!current&&current.isDaily",10000))throw Error("Daily wager did not start");
    const dailyState=await Promise.all(phones.map(phone=>phone.cdp.eval("phoneState?.mode||null")));
    await phones[dailyActive].cdp.eval("document.getElementById('phoneAnswerInput').value='wrong';submitPhoneAnswer();true");
    if(!await waitFor(host.cdp,"questionRevealed===true",10000))throw Error("Daily Double did not reveal");
    await host.cdp.eval("applyScores();true");if(!await waitFor(host.cdp,"!current&&!questionRevealed",10000))throw Error("Daily Double did not resolve");
    mechanics.dailyDouble={owner:dailyActive,modesReady:dailyModes.every(Boolean),phoneModes:dailyState,onlyOwnerAnswer:dailyState[dailyActive]==="answer"&&dailyState.every((mode,i)=>i===dailyActive||mode==="wait-daily")};

    const followClue=await host.cdp.eval("(()=>{for(let ci=0;ci<categories.length;ci++)for(let qi=0;qi<categories[ci].clues.length;qi++){const c=categories[ci].clues[qi],id=clueId(ci,qi);if(c&&!used.has(id)&&c.followup)return{ci,qi,id}}return null})()");
    const followActive=await host.cdp.eval("activePlayer");await phones[followActive].cdp.eval(`phoneSelect(${followClue.ci},${followClue.qi});true`);
    if(!await waitFor(host.cdp,"!!current&&!!current.followup&&!questionRevealed",10000))throw Error("Classic follow-up did not open");
    await Promise.all(phones.map(phone=>waitFor(phone.cdp,"phoneState?.mode===\"answer\"",10000)));await Promise.all(phones.map(phone=>phone.cdp.eval("document.getElementById('phoneAnswerInput').value='wrong';submitPhoneAnswer();true")));
    if(!await waitFor(host.cdp,"questionRevealed===true",10000))throw Error("Follow-up Part 1 did not reveal");await host.cdp.eval("applyScores();true");
    if(!await waitFor(host.cdp,"!!current&&current.followup&&current.part===2&&!questionRevealed",10000))throw Error("Follow-up Part 2 did not start");
    await Promise.all(phones.map(phone=>waitFor(phone.cdp,"phoneState?.mode===\"answer\"",10000)));await Promise.all(phones.map(phone=>phone.cdp.eval("document.getElementById('phoneAnswerInput').value='wrong';submitPhoneAnswer();true")));
    if(!await waitFor(host.cdp,"questionRevealed===true",10000))throw Error("Follow-up Part 2 did not reveal");await host.cdp.eval("applyScores();true");
    mechanics.followup={active:followActive,completed:await waitFor(host.cdp,`!current&&!questionRevealed&&used.has("${followClue.id}")`,10000)};
    const exceptions=[...host.cdp.events,...phones.flatMap(phone=>phone.cdp.events)].map(eventText).filter(text=>/exception|error/i.test(text)&&!/AudioContext was not allowed/.test(text)&&!/Failed to load resource: the server responded with a status of 404/.test(text));
    const report={room,rounds,roundCount:rounds.length,allCleared:rounds.every(r=>r.cleared),activeAdvanced:rounds.every(r=>r.next===r.expectedNext),mechanics,exceptions};
    console.log(JSON.stringify(report,null,2));
    if(rounds.length<10||!report.allCleared||!report.activeAdvanced||!mechanics.lastChance?.consumed||mechanics.lastChance.ownerDelta!==mechanics.lastChance.otherDelta*2||!mechanics.dailyDouble?.onlyOwnerAnswer||!mechanics.followup?.completed||exceptions.length)process.exitCode=2;
  }finally{host.cdp.close();phones.forEach(phone=>phone.cdp.close());host.child.kill();phones.forEach(phone=>phone.child.kill());await delay(300);for(const item of [host,...phones])try{fs.rmSync(item.profile,{recursive:true,force:true})}catch{}}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
