const fs=require('fs');
const gamePath='outputs/dog-jeopardy.html';
const auditPath='work/audit-game.js';
let html=fs.readFileSync(gamePath,'utf8');

const start=html.indexOf('/* AVATAR_CROP_V5:');
const end=html.indexOf('.follow-choice-grid',start);
if(start<0||end<0) throw new Error('Current avatar crop block not found');

const centered=`/* AVATAR_CENTERING_V12: preserve the complete source art and center it consistently. */
.join-avatar,.host-avatar{
  min-width:0!important;
  width:100%!important;
  max-width:100%!important;
  margin:0!important;
  overflow:hidden!important;
  contain:paint;
  isolation:isolate;
}
.join-avatar img,.host-avatar img{
  width:100%!important;
  height:100%!important;
  min-width:0!important;
  max-width:100%!important;
  object-fit:contain!important;
  object-position:center center!important;
  display:block!important;
  transform:none!important;
  transform-origin:center center!important;
  margin:auto!important;
}
.join-avatar img{border-radius:50%!important}
.host-avatar img{border-radius:10px!important}
.phone-player-avatar,.player-avatar{
  object-fit:contain!important;
  object-position:center center!important;
  background:#0a2d45;
  clip-path:none!important;
  transform:none!important;
  border-radius:50%!important;
}
`;
html=html.slice(0,start)+centered+html.slice(end);
if(html.includes('AVATAR_CROP_V5')) throw new Error('Old avatar crop marker still present');
if(!html.includes('AVATAR_CENTERING_V12')||!html.includes('object-fit:contain!important')) throw new Error('Centered avatar styles missing');
fs.writeFileSync(gamePath,html);

let audit=fs.readFileSync(auditPath,'utf8');
const old='if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CROP_V5")) throw new Error("Randomized follow-up/avatar framing fix missing");';
const updated='if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CENTERING_V12")) throw new Error("Randomized follow-up/avatar centering fix missing");';
if(!audit.includes(old)) throw new Error('Avatar audit anchor not found');
audit=audit.replace(old,updated);
fs.writeFileSync(auditPath,audit);
console.log('Centered all Timeline avatar artwork without zoom/crop transforms.');
