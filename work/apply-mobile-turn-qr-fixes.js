const fs = require('fs');

const file = 'outputs/dog-jeopardy.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(from, to, label) {
  if (!html.includes(from)) throw new Error(`Missing patch target: ${label}`);
  html = html.replace(from, to);
}

// 1) Mobile browser viewport: support notches and dynamic browser chrome.
if (!html.includes('viewport-fit=cover')) {
  replaceOnce(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">',
    'viewport meta'
  );
}

// Old 100vh phone shells can extend behind Samsung/iPhone browser chrome.
html = html.replace(/height:100vh;/g, (match, offset) => {
  const before = html.slice(Math.max(0, offset - 180), offset);
  return /\.phone-shell|\.join-shell/.test(before) ? 'height:100dvh;' : match;
});

if (!html.includes('--phone-visual-top:')) {
  replaceOnce(
    ':root{\n  --safe-top: env(safe-area-inset-top, 0px);',
    ':root{\n  --phone-visual-top: 0px;\n  --phone-visual-height: 100dvh;\n  --safe-top: env(safe-area-inset-top, 0px);',
    'safe-area root'
  );
}

if (!html.includes('/* Dynamic mobile browser viewport guard */')) {
  replaceOnce(
    '</style>\n</head>',
    `/* Dynamic mobile browser viewport guard */
body.remote-phone-mode .controller-preview,
body.remote-phone-mode .phone-join{
  top:var(--phone-visual-top)!important;
  bottom:auto!important;
  height:var(--phone-visual-height)!important;
  min-height:0!important;
}
body.remote-phone-mode .phone-shell,
body.remote-phone-mode .join-shell{
  height:100%!important;
  min-height:0!important;
  max-height:100%!important;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding-top:calc(14px + var(--safe-top))!important;
  padding-right:calc(14px + var(--safe-right))!important;
  padding-bottom:calc(18px + var(--safe-bottom))!important;
  padding-left:calc(14px + var(--safe-left))!important;
}

/* Host QR join */
.remote-room-qr{
  width:108px;
  height:108px;
  flex:0 0 108px;
  display:none;
  align-items:center;
  justify-content:center;
  padding:7px;
  border-radius:12px;
  background:#fff;
  box-shadow:0 5px 16px rgba(0,0,0,.3);
}
.remote-room-qr img,
.remote-room-qr canvas{
  width:94px!important;
  height:94px!important;
  display:block;
}
@media(max-width:680px){
  .remote-room-card{justify-content:center;text-align:center}
  .remote-room-info{flex-basis:100%}
}
</style>\n</head>`,
    'head style close'
  );
}

// 2) Host join QR, generated locally in the browser.
if (!html.includes('id="joinQr"')) {
  replaceOnce(
    '    <button class="blue" id="copyJoinBtn" onclick="copyJoinLink()">Copy Phone Link</button>',
    '    <div class="remote-room-qr" id="joinQr" aria-label="QR code to join the game"></div>\n    <button class="blue" id="copyJoinBtn" onclick="copyJoinLink()">Copy Phone Link</button>',
    'join QR slot'
  );
}

if (!html.includes('qrcodejs@1.0.0')) {
  replaceOnce(
    '<script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js"></script>',
    '<script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>',
    'QR library include'
  );
}

if (!html.includes('function renderJoinQr()')) {
  replaceOnce(
    'function updateJoinLink(){',
    `function renderJoinQr(){
  const box=document.getElementById("joinQr");
  if(!box)return;
  box.innerHTML="";
  if(location.protocol==="file:" || typeof QRCode==="undefined"){
    box.style.display="none";
    return;
  }
  box.style.display="flex";
  new QRCode(box,{
    text:getJoinUrl(),
    width:94,
    height:94,
    colorDark:"#061725",
    colorLight:"#ffffff",
    correctLevel:QRCode.CorrectLevel.M
  });
}

function updateJoinLink(){`,
    'updateJoinLink function'
  );

  replaceOnce(
    '  el.textContent=location.protocol==="file:"\n    ? "Publish/open the hosted page to create a shareable phone link."\n    : getJoinUrl();\n}',
    '  el.textContent=location.protocol==="file:"\n    ? "Publish/open the hosted page to create a shareable phone link."\n    : getJoinUrl();\n  renderJoinQr();\n}',
    'updateJoinLink body'
  );
}

// 3) Inactive phones can watch the question but cannot touch answers/hint/submit.
if (!html.includes('function phoneCanInteract()')) {
  replaceOnce(
    'function renderPhoneChoices(){',
    `function phoneCanInteract(){
  return Number.isInteger(joinedPhonePlayerIndex) && joinedPhonePlayerIndex===activePlayer;
}

function renderPhoneChoices(){`,
    'renderPhoneChoices function'
  );
}

{
  const start = html.indexOf('function renderPhoneChoices(){');
  const end = html.indexOf('\nfunction renderPhoneController()', start);
  if (start < 0 || end < 0) throw new Error('Could not isolate renderPhoneChoices');
  let block = html.slice(start, end);
  block = block.replace('    b.disabled=choiceLocked;', '    b.disabled=choiceLocked || !phoneCanInteract();');
  block = block.replace('    submit.disabled=!selectedChoice || choiceLocked || reviewMode;', '    submit.disabled=!selectedChoice || choiceLocked || reviewMode || !phoneCanInteract();');
  html = html.slice(0, start) + block + html.slice(end);
}

replaceOnce(
  '  const hintBtn=document.getElementById("phoneHintBtn");\n  if(hintBtn) hintBtn.style.display=hintUsed||reviewMode?"none":"block";',
  '  const hintBtn=document.getElementById("phoneHintBtn");\n  if(hintBtn){\n    hintBtn.style.display=hintUsed||reviewMode?"none":"block";\n    hintBtn.disabled=!phoneCanInteract();\n  }',
  'phone hint state'
);

replaceOnce(
  'function phoneUseHint(){\n  haptic(10);',
  'function phoneUseHint(){\n  if(!phoneCanInteract())return;\n  haptic(10);',
  'phone hint guard'
);

// Keep viewport dimensions synced to the actual visible browser area as URL bars expand/collapse.
if (!html.includes('function syncPhoneVisualViewport()')) {
  replaceOnce(
    'function makeRoomCode(){',
    `function syncPhoneVisualViewport(){
  if(!remotePhoneMode)return;
  const vv=window.visualViewport;
  const top=Math.max(0,Math.round(vv?.offsetTop||0));
  const height=Math.max(320,Math.round(vv?.height||window.innerHeight));
  document.documentElement.style.setProperty("--phone-visual-top",top+"px");
  document.documentElement.style.setProperty("--phone-visual-height",height+"px");
}
window.addEventListener("resize",syncPhoneVisualViewport,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(syncPhoneVisualViewport,80),{passive:true});
if(window.visualViewport){
  visualViewport.addEventListener("resize",syncPhoneVisualViewport,{passive:true});
  visualViewport.addEventListener("scroll",syncPhoneVisualViewport,{passive:true});
}

function makeRoomCode(){`,
    'makeRoomCode function'
  );

  // Run after remotePhoneMode is initialized and again after page setup settles.
  replaceOnce(
    'const remotePhoneMode=!!phoneRoomParam;',
    'const remotePhoneMode=!!phoneRoomParam;\nqueueMicrotask(()=>syncPhoneVisualViewport());\nsetTimeout(syncPhoneVisualViewport,120);',
    'remotePhoneMode initialization'
  );
}

fs.writeFileSync(file, html);
console.log('Applied mobile turn lock, browser viewport, and QR join fixes.');
