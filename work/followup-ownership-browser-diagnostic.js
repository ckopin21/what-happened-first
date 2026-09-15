// Real-browser regression for Timeline follow-up ownership.
// Run over an HTTP server: node work/followup-ownership-browser-diagnostic.js http://127.0.0.1:4173/outputs
const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const CHROME=process.env.CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE=process.argv[2]||"http://127.0.0.1:4173/outputs";
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

class Cdp{
  constructor(url,label){this.url=url;this.label=label;this.id=0;this.pending=new Map()}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.addEventListener("open",resolve,{once:true});this.ws.addEventListener("error",reject,{once:true})});
    this.ws.addEventListener("message",event=>{const msg=JSON.parse(event.data);if(!msg.id)return;const pending=this.pending.get(msg.id);if(!pending)return;this.pending.delete(msg.id);msg.error?pending.reject(Error(msg.error.message)):pending.resolve(msg.result)});
    await this.send("Runtime.enable");await this.send("Page.enable");
  }
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  async eval(expression){const result=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value}
  close(){this.ws?.close()}
}
async function targets(port){for(let i=0;i<80;i++){try{const response=await fetch(`http://127.0.0.1:${port}/json/list`);if(response.ok)return response.json()}catch{}await delay(100)}throw Error(`Chrome ${port} did not start`)}
async function launch(port,label){const profile=fs.mkdtempSync(path.join(os.tmpdir(),`whf-followup-${label}-`));const child=spawn(CHROME,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--window-size=430,900","about:blank"],{stdio:"ignore",windowsHide:true});const target=(await targets(port)).find(item=>item.type==="page");const cdp=new Cdp(target.webSocketDebuggerUrl,label);await cdp.open();return{child,profile,cdp}}
async function waitFor(cdp,expression,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await cdp.eval(expression))return true;await delay(150)}return false}
async function navigate(cdp,url){await cdp.send("Page.navigate",{url});await waitFor(cdp,"document.readyState==='complete'",12000);await waitFor(cdp,"typeof sendRemoteAction==='function'",12000)}
async function visibility(cdp){return cdp.eval(`(()=>{const offer=document.getElementById("phoneFollowOffer"),view=document.getElementById("phoneFollowView"),buttons=[...document.querySelectorAll("#phoneFollowOffer button,#phoneFollowChoices button,#phoneFollowConfirmBtn")];return{offer:offer?.style.display||"",view:view?.style.display||"",visibleButtons:buttons.filter(button=>getComputedStyle(button).display!=="none"&&!button.disabled).length,allButtons:buttons.length,wait:[...document.querySelectorAll("#phoneFollowOfferWait,#phoneFollowWait")].map(el=>({display:el.style.display,text:el.textContent})),playerId:players[joinedPhonePlayerIndex]?.playerId||null}})()`)}

(async()=>{
  if(!fs.existsSync(CHROME))throw Error(`Chrome not found: ${CHROME}`);
  const host=await launch(9345,"host"),phones=await Promise.all([launch(9346,"a"),launch(9347,"b"),launch(9348,"c")]);
  try{
    const file="dog-jeopardy.html";
    await navigate(host.cdp,`${BASE}/${file}?followup-diagnostic=${Date.now()}`);
    await waitFor(host.cdp,"typeof roomCode==='string'&&roomCode.length===4",12000);
    const room=await host.cdp.eval("roomCode");
    await waitFor(host.cdp,"networkPeer?.open===true",12000);
    for(const [index,phone] of phones.entries()){
      await navigate(phone.cdp,`${BASE}/${file}?phone=${room}&followup-diagnostic=${Date.now()}`);
      await waitFor(phone.cdp,"networkPeer?.open===true",12000);
      await waitFor(phone.cdp,"hostConnection?.open===true",15000);
      await phone.cdp.eval(`document.getElementById("joinName").value="Player ${String.fromCharCode(65+index)}";joinPhoneGame();true`);
    }
    const joined=await waitFor(host.cdp,"playerCount===3",10000);if(!joined)throw Error("Three phone players did not join");
    await host.cdp.eval("startGame();const ci=categories.findIndex(category=>category.clues.some(clue=>clue.special));const clue=categories[ci].clues.find(item=>item.special);openClue(`${ci}-${categories[ci].clues.indexOf(clue)}`,clue,500,false);true");
    await Promise.all(phones.map(phone=>waitFor(phone.cdp,"current?.item?.special===true",10000)));
    await phones[0].cdp.eval("sendRemoteAction('choose',{choice:getCorrectChoice()});true");
    await waitFor(host.cdp,"selectedChoice!==null",6000);
    await phones[0].cdp.eval("sendRemoteAction('submit');true");
    const offered=await waitFor(host.cdp,"document.getElementById('followOffer').classList.contains('visible')",8000);if(!offered)throw Error("Follow-up offer did not appear");
    await delay(500);
    const owner=await host.cdp.eval("({owner:followupOwnerPlayerId,active:players[activePlayer]?.playerId,ids:players.slice(0,playerCount).map(p=>p.playerId)})");
    const before=await Promise.all(phones.map(phone=>visibility(phone.cdp)));
    await phones[1].cdp.eval("sendRemoteAction('follow-start');true");await delay(500);
    const forged=await host.cdp.eval("({offer:document.getElementById('followOffer').classList.contains('visible'),follow:document.getElementById('followBox').classList.contains('visible')})");
    await phones[0].cdp.eval("phoneStartFollowup();true");
    const started=await waitFor(host.cdp,"document.getElementById('followBox').classList.contains('visible')",6000);if(!started)throw Error("Owner could not start follow-up");
    await delay(500);
    const after=await Promise.all(phones.map(phone=>visibility(phone.cdp)));
    // Removing a non-owner must preserve the pending follow-up for its owner.
    await host.cdp.eval("window.confirm=()=>true;hostRemoveTimelinePlayer(1);true");
    const nonOwnerRemoved=await waitFor(host.cdp,"playerCount===2&&!!followupOwnerPlayerId&&players[activePlayer]?.playerId===followupOwnerPlayerId&&document.getElementById('followBox').classList.contains('visible')",6000);
    // Removing the owner must cancel the pending follow-up and restore the lobby state.
    await host.cdp.eval("hostRemoveTimelinePlayer(0);true");
    const ownerRemoved=await waitFor(host.cdp,"!current&&!followupOwnerPlayerId&&!document.getElementById('followBox').classList.contains('visible')",6000);
    const report={room,joined,owner,before,forged,after,nonOwnerRemoved,ownerRemoved,checks:{ownerIsActive:owner.owner===owner.active,onlyOwnerOffer:before[0].visibleButtons>0&&before[1].visibleButtons===0&&before[2].visibleButtons===0,forgedIgnored:forged.offer&&!forged.follow,onlyOwnerChoices:after[0].visibleButtons>0&&after[1].visibleButtons===0&&after[2].visibleButtons===0,nonOwnerPreservesFollowup:nonOwnerRemoved,ownerRemovalCancelsFollowup:ownerRemoved}};
    console.log(JSON.stringify(report,null,2));
    if(!report.checks.ownerIsActive||!report.checks.onlyOwnerOffer||!report.checks.forgedIgnored||!report.checks.onlyOwnerChoices||!report.checks.nonOwnerPreservesFollowup||!report.checks.ownerRemovalCancelsFollowup)process.exitCode=2;
  }finally{host.cdp.close();phones.forEach(phone=>phone.cdp.close());host.child.kill();phones.forEach(phone=>phone.child.kill());await delay(400);for(const item of [host,...phones])try{fs.rmSync(item.profile,{recursive:true,force:true})}catch{}}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
