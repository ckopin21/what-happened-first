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

const regressionIssues=[];
const requirePattern=(name,pattern)=>{if(!pattern.test(html))regressionIssues.push(name)};
requirePattern('explicit lobby/start state',/(?:gameStarted|gamePhase|lobbyState)/);
requirePattern('host start action',/function\s+(?:startGame|hostStartGame)\s*\(/);
const remoteSelectDirectGate=/action\.type\s*===\s*["']select["'][\s\S]{0,240}(?:gameStarted|gamePhase|lobbyState)/.test(html);
const remoteSelectDelegatedGate=/action\.type\s*===\s*["']select["'][^\n]*openClue\(/.test(html)&&/function\s+openClue\s*\([^)]*\)\s*\{[^\n]*(?:gameStarted|gamePhase|lobbyState)/.test(html);
const remoteSelectCentralGate=/function\s+handleRemoteAction[\s\S]{0,2200}if\s*\(\s*!gameStarted[\s\S]{0,1000}action\.type\s*===\s*["']select["']/.test(html);
if(!remoteSelectDirectGate&&!remoteSelectDelegatedGate&&!remoteSelectCentralGate)regressionIssues.push('remote selection start gate');
requirePattern('persistent reconnect token',/localStorage\.getItem\([\s\S]{0,160}(?:token|TOKEN)/i);
requirePattern('validated reconnect token',/function\s+safeToken\s*\(/);
requirePattern('token-based player reclaim',/findIndex\([^)]*\.token\s*===\s*token/);
requirePattern('duplicate connection displacement or binding',/(?:replace|supersed|previous|existing|duplicate|playerConnections|connectionByPlayer)/i);
requirePattern('state resync after reconnect',/(?:rejoin|resume)[\s\S]{0,300}(?:sendState|broadcastState)/);
requirePattern('lobby state sent to phones',/!gameStarted[^\n]*mode\s*:\s*["']lobby["']/);
requirePattern('stale action epoch validation',/action\.gameEpoch\s*!==\s*gameEpoch/);
requirePattern('per-question action nonce validation',/action\.actionNonce\s*!==\s*actionNonce/);
requirePattern('generation guard on reconnect callbacks',/(?:phoneConnectionGeneration|connectionGeneration)[\s\S]{0,500}stale/);
requirePattern('visibility recovery',/visibilitychange/);
requirePattern('page restore recovery',/pageshow/);
requirePattern('online recovery',/addEventListener\(["']online["']/);
requirePattern('stale connection cleanup',/conn\.on\(["']close["'][\s\S]{0,180}(?:delete|cleanup|remove)/);
requirePattern('duplicate answer prevention',/submissions\.has\(i\)/);
requirePattern('duplicate scoring prevention',/questionResolved/);
requirePattern('new game keeps roster',/function\s+newGame\s*\([^)]*\)\s*\{(?![\s\S]{0,500}players\s*=\s*\[)/);
requirePattern('reset clears roster',/function\s+resetGame\s*\([^)]*\)\s*\{[\s\S]{0,500}players\s*=\s*\[\]/);
if(/action\.(?:score|playerIndex)|action\.type\s*===\s*["'](?:score|set-state|set-player)["']/.test(html))regressionIssues.push('phone action must not carry score/player authority');
if(regressionIssues.length)throw new Error(`Classic regression checks failed:\n- ${regressionIssues.join('\n- ')}`);
// CLASSIC_PARITY_V2_AUDIT
// CLASSIC_DEVTOOLS_AUDIT
console.log(`Classic Jeopardy audit passed: ${pack.genre||pack.id}, ${pack.categories.length} categories`);
