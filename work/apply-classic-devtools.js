const fs=require('fs');
const path=require('path');

const htmlPath=path.resolve(__dirname,'../outputs/classic-jeopardy.html');
const auditPath=path.resolve(__dirname,'audit-classic.js');
let html=fs.readFileSync(htmlPath,'utf8');
let audit=fs.readFileSync(auditPath,'utf8');

if(html.includes('CLASSIC_DEVTOOLS_V1')){
  console.log('Classic developer tools already applied');
  process.exit(0);
}

function replaceOnce(source,needle,replacement,label){
  const i=source.indexOf(needle);
  if(i<0)throw new Error(`Missing anchor: ${label}`);
  return source.slice(0,i)+replacement+source.slice(i+needle.length);
}

const css=`
/* CLASSIC_DEVTOOLS_V1 */
.dev-toggle-wrap{display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:11px;background:#0a2d45;border:1px solid rgba(255,255,255,.13);font-weight:900}.dev-toggle-wrap input{accent-color:var(--accent)}
.dev-fab{position:fixed;right:16px;bottom:16px;z-index:320;display:none}.dev-fab-btn{width:62px;height:62px;border-radius:50%;margin:0;background:var(--accent);color:#18212a;font-size:16px;font-weight:1000;box-shadow:0 10px 28px rgba(0,0,0,.45)}
body.dev-mode #devFab{display:block!important}.dev-panel{position:fixed;right:16px;bottom:88px;width:min(390px,calc(100vw - 24px));max-height:min(70dvh,640px);overflow:auto;z-index:321;background:linear-gradient(160deg,#176b9e,#0b304b);border:3px solid rgba(255,255,255,.9);border-radius:20px;padding:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);text-align:left}.dev-panel-header{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.dev-kicker{font-size:10px;letter-spacing:.16em;color:#bfe1f4;font-weight:1000}.dev-title{font-size:21px;color:var(--accent);font-weight:1000}.dev-close{padding:5px 10px!important;margin:0!important;box-shadow:none!important;background:#fff;color:#173047}.dev-panel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dev-panel-grid button{margin:0;border-radius:12px;padding:10px 8px;font-size:12px}.dev-note{margin-top:10px;color:#c9dfec;font-size:11px;line-height:1.35}.dev-armed-banner{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:319;padding:9px 14px;border-radius:999px;background:#7a5100;color:#fff0b5;border:1px solid #ffd166;font-size:12px;font-weight:1000;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.dev-preview-overlay{position:fixed;inset:0;z-index:322;background:rgba(1,7,12,.88);display:none;align-items:center;justify-content:center;padding:20px}.dev-preview-card{width:min(520px,94vw);background:linear-gradient(160deg,#176b9e,#0b304b);border:4px solid rgba(255,255,255,.92);border-radius:24px;padding:28px 22px;text-align:center;box-shadow:0 30px 70px rgba(0,0,0,.55)}.dev-preview-icon{font-size:64px}.dev-preview-title{font-size:34px;font-weight:1000;color:var(--accent);margin:8px 0}.dev-preview-sub{font-size:15px;color:#d7ebf7;font-weight:800;line-height:1.4;margin-bottom:14px}
.fullscreen-exit{display:none;position:fixed;right:12px;top:12px;z-index:330;margin:0!important}.fullscreen-game .fullscreen-exit{display:block}.phone-mode .fullscreen-exit{display:none!important}.fullscreen-game.dev-mode #devFab{display:block!important}
@media(max-width:560px){.dev-panel-grid{grid-template-columns:1fr}.dev-panel{right:8px;bottom:78px;width:calc(100vw - 16px)}}
`;
html=replaceOnce(html,'</style>',css+'\n</style>','style end');

const setupAnchor='      <a class="mode-link" href="../index.html">Game Modes</a>\n      <button class="blue" id="fullscreenBtn" onclick="toggleFullscreen()">Fullscreen</button>';
const setupReplacement='      <a class="mode-link" href="../index.html">Game Modes</a>\n      <label class="dev-toggle-wrap"><input id="developerToggle" type="checkbox" onchange="setDeveloperMode(this.checked)"><span>Developer Mode</span></label>\n      <button class="blue" id="fullscreenBtn" onclick="toggleFullscreen()">Fullscreen</button>';
html=replaceOnce(html,setupAnchor,setupReplacement,'setup controls');

const devHtml=`
<button class="blue fullscreen-exit" id="fullscreenExitBtn" onclick="toggleFullscreen()">Exit Fullscreen</button>
<div class="dev-armed-banner" id="devArmedBanner" style="display:none"></div>
<div class="dev-fab" id="devFab"><button class="dev-fab-btn" onclick="toggleDevPanel()">DEV</button></div>
<div class="dev-panel" id="devPanel" style="display:none">
  <div class="dev-panel-header"><div><div class="dev-kicker">DEVELOPER PREVIEW</div><div class="dev-title">Modifiers & Animations</div></div><button class="dev-close" onclick="toggleDevPanel(false)">×</button></div>
  <div class="dev-panel-grid">
    <button onclick="devPreview('daily')">Daily Double</button>
    <button onclick="devPreview('double')">Double Points</button>
    <button onclick="devPreview('triple')">Triple Points</button>
    <button onclick="devPreview('lastchance')">Last Chance</button>
    <button onclick="devPreview('fire')">On Fire</button>
    <button onclick="devPreview('cold')">Cold Streak</button>
    <button onclick="devPreview('comeback')">Comeback</button>
    <button onclick="devPreview('correct')">Correct Result</button>
    <button onclick="devPreview('incorrect')">Incorrect Result</button>
    <button onclick="devPreview('followup')">Two-Part Follow-Up</button>
    <button onclick="devPreview('tiebreaker')">Tie-Breaker</button>
    <button onclick="devPreview('finale')">Winner Celebration</button>
  </div>
  <div class="dev-note">Classic keeps its everyone-answers format. Double/Triple can arm the next real clue; the other controls preview the corresponding presentation states without changing normal scoring.</div>
</div>
<div class="dev-preview-overlay" id="devPreviewOverlay"><div class="dev-preview-card"><div class="dev-preview-icon" id="devPreviewIcon"></div><div class="dev-preview-title" id="devPreviewTitle"></div><div class="dev-preview-sub" id="devPreviewSub"></div><button class="white" onclick="closeDevPreview()">Close Preview</button></div></div>
`;
html=replaceOnce(html,'<section class="phone-root" id="phoneRoot">',devHtml+'\n<section class="phone-root" id="phoneRoot">','phone root');

const stateAnchor='let players=[],used=new Set(),history=new Map(),activePlayer=0,current=null,submissions=new Map(),judgements=new Map(),hintsUsed=new Set(),questionRevealed=false,questionResolved=false,reviewRecord=null,finalShown=false;';
html=replaceOnce(html,stateAnchor,stateAnchor+'\nlet developerMode=false,devForcedMultiplier=0;','state variables');

const phaseAnchor='function phaseMultiplier(){const left=questionsRemaining();if(left<=3&&left>0)return 3;if(left<=6&&left>3)return 2;return 1}';
html=replaceOnce(html,phaseAnchor,'function phaseMultiplier(){if(devForcedMultiplier===2||devForcedMultiplier===3)return devForcedMultiplier;const left=questionsRemaining();if(left<=3&&left>0)return 3;if(left<=6&&left>3)return 2;return 1}','phase multiplier');

const openRegex=/  const mult=phaseMultiplier\(\);current=\{[^\n]+\};\n  submissions=/;
const openMatch=html.match(openRegex);
if(!openMatch)throw new Error('Missing openClue current anchor');
html=html.replace(openRegex,openMatch[0].replace('\n  submissions=','\n  if(devForcedMultiplier){devForcedMultiplier=0;setDevArmed("");}\n  submissions='));

const devJs=`
function setDeveloperMode(enabled){
  developerMode=!!enabled;
  document.body.classList.toggle("dev-mode",developerMode);
  const fab=document.getElementById("devFab");
  if(fab)fab.style.display=developerMode?"block":"none";
  if(!developerMode){toggleDevPanel(false);closeDevPreview();devForcedMultiplier=0;setDevArmed("");renderHost()}
  toast(developerMode?"Developer Mode enabled":"Developer Mode disabled","");
}
function toggleDevPanel(force){
  if(!developerMode)return;
  const panel=document.getElementById("devPanel");if(!panel)return;
  const show=typeof force==="boolean"?force:panel.style.display==="none";
  panel.style.display=show?"block":"none";
}
function setDevArmed(text){const el=document.getElementById("devArmedBanner");if(!el)return;el.textContent=text||"";el.style.display=text?"block":"none"}
function closeDevPreview(){const el=document.getElementById("devPreviewOverlay");if(el)el.style.display="none"}
function devGenericPreview(icon,title,sub){
  document.getElementById("devPreviewIcon").textContent=icon;
  document.getElementById("devPreviewTitle").textContent=title;
  document.getElementById("devPreviewSub").textContent=sub;
  document.getElementById("devPreviewOverlay").style.display="flex";
}
function ensureDevPlayer(){
  if(players.length)return Math.min(activePlayer,players.length-1);
  players.push({name:"Dev Player",score:0,token:"dev-local",avatar:0,correctStreak:0,wrongStreak:0});
  activePlayer=0;renderHost();return 0;
}
function devPreview(kind){
  if(!developerMode)return;
  toggleDevPanel(false);closeDevPreview();
  if(kind==="double"||kind==="triple"){
    devForcedMultiplier=kind==="double"?2:3;
    const label=devForcedMultiplier===2?"DOUBLE POINTS":"TRIPLE POINTS";
    setDevArmed(`DEV: ${label} ARMED • SELECT A QUESTION`);showPhaseOverlay(label);renderHost();toast(`${label} armed`,"");return;
  }
  if(kind==="fire"){const i=ensureDevPlayer();players[i].correctStreak=3;players[i].wrongStreak=0;renderHost();flashPlayer(i,"good");toast(`${players[i].name} is ON FIRE`,"good");return}
  if(kind==="cold"){const i=ensureDevPlayer();players[i].correctStreak=0;players[i].wrongStreak=3;renderHost();flashPlayer(i,"bad");toast(`${players[i].name} is on a COLD STREAK`,"bad");return}
  if(kind==="correct"){const i=ensureDevPlayer();flashPlayer(i,"good");toast("CORRECT!","good");return}
  if(kind==="incorrect"){const i=ensureDevPlayer();flashPlayer(i,"bad");toast("INCORRECT","bad");return}
  if(kind==="finale"){
    if(!players.length){players.push({name:"Winner",score:1200,token:"dev-winner",avatar:0,correctStreak:0,wrongStreak:0},{name:"Runner Up",score:800,token:"dev-runner",avatar:1,correctStreak:0,wrongStreak:0});renderHost()}
    showFinale();return;
  }
  const previews={
    daily:["⚡","DAILY DOUBLE","Presentation preview for the Daily Double state. Classic still keeps everyone answering the clue."],
    lastchance:["🎯","LAST CHANCE","Preview of the comeback / Last Chance presentation state."],
    comeback:["🚀","COMEBACK","Preview of the comeback animation and messaging."],
    followup:["➕","TWO-PART FOLLOW-UP","Preview of the second-part question presentation."],
    tiebreaker:["⚔️","TIE-BREAKER","Preview of the tie-breaker presentation state."]
  };
  const p=previews[kind]||["🧪","DEV PREVIEW",String(kind||"").toUpperCase()];devGenericPreview(...p);
}
`;
html=replaceOnce(html,'function toggleFullscreen(){',devJs+'\nfunction toggleFullscreen(){','fullscreen function');

if(!audit.includes('CLASSIC_DEVTOOLS_AUDIT')){
  audit=audit.replace("  'showFinale','phaseMultiplier','Use Hint','New Game','Reset Game','toggleFullscreen'","  'showFinale','phaseMultiplier','Use Hint','New Game','Reset Game','toggleFullscreen',\n  'Developer Mode','devPreview','devPanel','fullscreenExitBtn','devForcedMultiplier','CLASSIC_DEVTOOLS_V1'");
  audit=audit.replace("console.log(`Classic Jeopardy audit passed: ${pack.genre||pack.id}, ${pack.categories.length} categories`);","if(!/function toggleFullscreen\\(\\)\\{if\\(!document\\.fullscreenElement\\)document\\.documentElement\\.requestFullscreen/.test(html))throw new Error('Fullscreen toggle entry missing');\n// CLASSIC_DEVTOOLS_AUDIT\nconsole.log(`Classic Jeopardy audit passed: ${pack.genre||pack.id}, ${pack.categories.length} categories`);");
}

fs.writeFileSync(htmlPath,html);
fs.writeFileSync(auditPath,audit);
console.log('Applied Classic developer tools and fullscreen exit control');
