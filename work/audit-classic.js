const fs=require('fs');
const path=require('path');
const vm=require('vm');

const htmlFile=path.resolve(__dirname,'../outputs/classic-jeopardy.html');
const packFile=path.resolve(__dirname,'../packs/classic/current.js');
const html=fs.readFileSync(htmlFile,'utf8');
const packJs=fs.readFileSync(packFile,'utf8');

const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(!scripts.length)throw new Error('No inline script found');
scripts.forEach((code,i)=>{try{new Function(code)}catch(err){throw new Error(`Inline script ${i+1} syntax error: ${err.message}`)}});
try{new Function(packJs)}catch(err){throw new Error(`Question pack syntax error: ${err.message}`)}

const sandbox={window:{}};
vm.runInNewContext(packJs,sandbox);
const pack=sandbox.window.CLASSIC_JEOPARDY_PACK;
if(!pack||!Array.isArray(pack.categories)||pack.categories.length<2)throw new Error('Invalid Classic question pack');
for(const category of pack.categories){
  if(!category.name||!Array.isArray(category.clues)||!category.clues.length)throw new Error('Invalid category in Classic question pack');
  for(const clue of category.clues){
    if(!Number.isFinite(clue.value)||!clue.question||!clue.answer||!Array.isArray(clue.aliases)||!clue.aliases.length)throw new Error(`Invalid clue in ${category.name}`);
  }
}
const twoPartCount=pack.categories.flatMap(category=>category.clues).filter(clue=>clue.followup).length;
if(twoPartCount<5)throw new Error('Classic pack must include at least five two-part clues');

const required=[
  '../packs/classic/current.js','Confirm & Submit','Reveal Now','fuzzyMatch','setJudgement',
  'applyScores','allSubmitted','classic-jeopardy-','QRCode','Peer','usedWinners','reviewClue',
  'showFinale','phaseMultiplier','Use Hint','New Game','Reset Game','toggleFullscreen',
  'Developer Mode','devPreview','devPanel','fullscreenExitBtn','devForcedMultiplier','CLASSIC_DEVTOOLS_V1',
  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2',
  'CLASSIC_DAILY_DOUBLE_V2','pendingDaily','dailyDoubleIds','daily-wager','classic-3','searchParams.set(\"mode\",\"classic\")','connectPhoneToHost'
];
for(const needle of required){if(!html.includes(needle))throw new Error(`Missing required feature marker: ${needle}`)}
if(!/if\(allSubmitted\(\)\)revealQuestion\(false\)/.test(html))throw new Error('Automatic reveal guard not found');
if(!/playerIndex!==activePlayer/.test(html))throw new Error('Chooser validation not found');
if(!/action\.type==="submit-answer"/.test(html))throw new Error('Remote answer validation not found');
if(!/action\.type==="use-hint"/.test(html))throw new Error('Per-player hint validation not found');
if(!/function toggleFullscreen\(\)\{if\(!document\.fullscreenElement\)document\.documentElement\.requestFullscreen/.test(html))throw new Error('Fullscreen toggle entry missing');
if(!html.includes('Choose the next question. Everyone will answer it.'))throw new Error('Player-facing question wording missing');
if(!/phoneAnswerInput[\s\S]*phoneHintAction[\s\S]*phone-submit/.test(html))throw new Error('Phone answer/hint/submit order is incorrect');
if(!html.includes('join-avatar{width:100%!important;min-width:0!important'))throw new Error('Phone avatar overflow fix missing');
if(!html.includes('CLASSIC_FULL_PHONE_PREVIEW_V1')||!html.includes('classicPreviewJoin')||!html.includes('PHONE CONNECTED • PREVIEW ONLY'))throw new Error('Full Classic phone preview missing');
// CLASSIC_PARITY_V2_AUDIT
// CLASSIC_DEVTOOLS_AUDIT
console.log(`Classic Jeopardy audit passed: ${pack.genre||pack.id}, ${pack.categories.length} categories`);
