const fs=require('fs');
const gamePath='outputs/dog-jeopardy.html';
const auditPath='work/audit-game.js';
let s=fs.readFileSync(gamePath,'utf8');

function once(from,to,label){
  const i=s.indexOf(from);
  if(i<0) throw new Error(`Missing anchor: ${label}`);
  if(s.indexOf(from,i+from.length)>=0) throw new Error(`Anchor not unique: ${label}`);
  s=s.slice(0,i)+to+s.slice(i+from.length);
}

const hintRewrites=[
  ["Both began during the first big wave of consumer internet companies, but one started the year before the other.","Both milestones landed in the mid-1990s web boom and were separated by roughly one year."],
  ["Think about which product category reached consumers first: modern Android smartphones or Apple tablets.","The two consumer-device launches were about two years apart around the end of the 2000s."],
  ["One arrived while social media was still very early; the other followed about a year later.","Both emerged during the mid-2000s Web 2.0 era, roughly a year apart."],
  ["They are close, but Microsoft's famous Start-menu era began just before Pokémon's debut.","These mid-1990s releases happened within about half a year of each other."],
  ["Music streaming became established just before app-based ride sharing started taking off.","Both milestones belong to the late 2000s and happened about a year apart."],
  ["Early aviation achieved its breakthrough several years before the famous ocean liner entered the water.","These early-20th-century milestones were separated by roughly eight years."],
  ["These happened only a couple of years apart, with the war ending shortly before Canadian Confederation.","These North American milestones happened only about two years apart in the 1860s."],
  ["The invention that transformed European publishing predates the Atlantic voyage by several decades.","Both are 15th-century milestones separated by several decades."],
  ["Photography's earliest successful experiments came well before Morse's famous demonstration.","Both breakthroughs arrived in the first half of the 1800s, less than two decades apart."],
  ["The Paris landmark was already standing when the modern Olympics returned a few years later.","These milestones happened near the turn of the 1890s, less than a decade apart."],
  ["Pixar's first feature film reached theaters shortly before Nintendo's 64-bit console arrived.","These entertainment milestones were released within about a year of each other in the mid-1990s."],
  ["These are both 1994 milestones, but the sitcom arrived a little earlier in the year.","Both happened in 1994, just a few months apart."],
  ["Both happened in 2005, but the video website technically came first.","Both debuted in 2005, only a few weeks apart."],
  ["Both are 2008 landmarks, but the TV series began several months before the Marvel film.","Both debuted in 2008, separated by only a few months."],
  ["The battle royale boom was already underway before Disney entered the streaming wars.","These launches occurred near the end of the 2010s, about two years apart."],
  ["Astronomers found the planet more than a decade before Darwin published his famous book.","Both are 19th-century science milestones separated by a little over a decade."],
  ["These two discoveries came in back-to-back years at the end of the 1800s.","These discoveries occurred in consecutive years in the mid-1890s."],
  ["The first woman followed the first man into space only a couple of years later.","These spaceflight milestones happened only about two years apart in the early 1960s."],
  ["The medical milestone happened in the late 1970s; the shuttle era began in the early 1980s.","Both milestones occurred around the turn from the 1970s to the 1980s, about three years apart."],
  ["These both happened around 1990, with the telescope reaching orbit slightly earlier.","Both milestones happened around 1990, less than a year apart."],
  ["Professional basketball's league era was underway several years before Formula 1's official championship.","These postwar sports milestones happened only a few years apart around the late 1940s and 1950."],
  ["The championship game began in the late 1960s; Earth Day followed a few years later.","Both U.S. milestones began within a few years of each other around the turn of the 1970s."],
  ["Serena's first major came just before Tiger completed that four-major milestone.","These achievements happened around the turn of the millennium, less than a year apart."],
  ["The NBA draft came first, with Messi's senior debut arriving the following year.","These career milestones occurred in consecutive years in the early 2000s."],
  ["Bolt's famous Berlin record came the year before Spain's World Cup victory.","These famous sports achievements happened in consecutive years around 2010."]
];
for(const [oldHint,newHint] of hintRewrites) once(`h:${JSON.stringify(oldHint)}`,`h:${JSON.stringify(newHint)}`,`hint rewrite: ${oldHint.slice(0,35)}`);

const hostWagerGrid=`<input id="wagerInput" type="hidden" value="500">\n    <div class="daily-wager-grid" id="dailyWagerChoices" aria-label="Choose Daily Double wager">\n      <button class="daily-wager-btn" onclick="confirmDailyWager(100)">100</button>\n      <button class="daily-wager-btn" onclick="confirmDailyWager(200)">200</button>\n      <button class="daily-wager-btn" onclick="confirmDailyWager(300)">300</button>\n      <button class="daily-wager-btn" onclick="confirmDailyWager(400)">400</button>\n      <button class="daily-wager-btn" onclick="confirmDailyWager(500)">500</button>\n      <button class="daily-wager-btn" onclick="confirmDailyWager(1000)">1000</button>\n    </div>\n    <div class="daily-actions">\n      <button class="white" onclick="cancelDailyWager()">Cancel</button>\n    </div>`;
once(`<input id="wagerInput" type="number" min="100" step="100" value="100">\n    <div class="daily-actions">\n      <button class="white" onclick="cancelDailyWager()">Cancel</button>\n      <button class="gold" onclick="confirmDailyWager()">Lock Wager</button>\n    </div>`,hostWagerGrid,'host static Daily Double wagers');

const phoneWagerGrid=`<input id="phoneWagerInput" type="hidden" value="500">\n        <div class="daily-wager-grid phone-daily-wagers" id="phoneDailyWagerChoices" aria-label="Choose Daily Double wager">\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(100)">100</button>\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(200)">200</button>\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(300)">300</button>\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(400)">400</button>\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(500)">500</button>\n          <button class="daily-wager-btn" onclick="phoneConfirmDailyWager(1000)">1000</button>\n        </div>`;
once(`<input id="phoneWagerInput" class="phone-wager" type="number" min="100" step="100" value="100">\n        <button class="phone-action" onclick="phoneConfirmDailyWager()">Lock Wager</button>`,phoneWagerGrid,'phone static Daily Double wagers');

const stylePatch=`\n/* DAILY_STATIC_WAGER_V11 */\n.daily-wager-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px auto 8px;max-width:520px}\n.daily-wager-btn{margin:0!important;min-width:0;padding:13px 8px!important;border-radius:12px!important;background:#ffd166;color:#17202a;font-size:18px;font-weight:1000}\n.phone-daily-wagers{grid-template-columns:repeat(2,minmax(0,1fr));width:100%;max-width:none}\n.phone-daily-wagers .daily-wager-btn{min-height:54px;font-size:17px}\n\n/* PHONE_HORIZONTAL_GUTTER_FIX_V11 */\nbody.remote-phone-mode .phone-shell,body.remote-phone-mode .join-shell{padding-right:calc(18px + var(--safe-right))!important;padding-left:calc(18px + var(--safe-left))!important}\nbody.remote-phone-mode #phoneQuestionView{box-sizing:border-box!important;width:100%!important;max-width:100%!important;padding-left:4px!important;padding-right:4px!important}\nbody.remote-phone-mode .phone-choice-grid,body.remote-phone-mode .phone-follow-choices{box-sizing:border-box!important;width:100%!important;max-width:100%!important;padding-left:2px;padding-right:2px}\nbody.remote-phone-mode .phone-choice-btn.selected{outline:none!important;box-shadow:inset 0 0 0 3px rgba(255,255,255,.9)!important}\nbody.remote-phone-mode .phone-follow-choices .phone-action.selected-choice{outline:none!important;box-shadow:inset 0 0 0 3px var(--accent)!important}\n@media(max-width:380px){body.remote-phone-mode .phone-shell,body.remote-phone-mode .join-shell{padding-right:calc(14px + var(--safe-right))!important;padding-left:calc(14px + var(--safe-left))!important}}\n`;
once('\n</style>\n</head>',stylePatch+'\n</style>\n</head>','v11 CSS patch');

once('function phoneConfirmDailyWager(){','const DAILY_WAGER_OPTIONS=[100,200,300,400,500,1000];\nfunction normalizeDailyWager(value){const n=Number(value);return DAILY_WAGER_OPTIONS.includes(n)?n:500}\n\nfunction phoneConfirmDailyWager(wagerOverride){','daily wager helper and phone signature');
once(`  const maxWager=Math.max(100,Math.max(players[activePlayer].score,1000));\n  const phoneInput=document.getElementById("phoneWagerInput");\n  let wager=Math.round(Number(phoneInput?.value||100)/100)*100;\n  wager=Math.max(100,Math.min(maxWager,wager));`, `  const phoneInput=document.getElementById("phoneWagerInput");\n  const wager=normalizeDailyWager(wagerOverride ?? phoneInput?.value);\n  if(phoneInput)phoneInput.value=wager;`, 'phone wager validation');
once('function confirmDailyWager(){','function confirmDailyWager(wagerOverride){','host wager signature');
once(`  const maxWager=Math.max(100,Math.max(players[activePlayer].score,1000));\n  let wager=Math.round(Number(document.getElementById("wagerInput").value||100)/100)*100;\n  wager=Math.max(100,Math.min(maxWager,wager));`, `  const wager=normalizeDailyWager(wagerOverride ?? document.getElementById("wagerInput")?.value);\n  const hostWagerInput=document.getElementById("wagerInput");if(hostWagerInput)hostWagerInput.value=wager;`, 'host wager validation');
once(`    const max=Math.max(100,Math.max(players[i].score,1000));\n    const wager=Math.max(100,Math.min(max,Math.round(Number(msg.wager||100)/100)*100));\n    document.getElementById("wagerInput").value=wager;confirmDailyWager();`, `    const wager=normalizeDailyWager(msg.wager);\n    const wagerInput=document.getElementById("wagerInput");if(wagerInput)wagerInput.value=wager;confirmDailyWager(wager);`, 'remote wager validation');

const fixedPrompt='choose 100, 200, 300, 400, 500, or 1000 points.';
const oldPlayerText='document.getElementById("dailyPlayerText").textContent=`${players[activePlayer].name}, wager between 100 and ${maxWager} points.`;';
const occurrences=s.split(oldPlayerText).length-1;
if(occurrences!==2) throw new Error(`Expected 2 Daily Double player prompts, got ${occurrences}`);
s=s.split(oldPlayerText).join('document.getElementById("dailyPlayerText").textContent=`${players[activePlayer].name}, '+fixedPrompt+'`;');

if(!s.includes('DAILY_STATIC_WAGER_V11')||!s.includes('PHONE_HORIZONTAL_GUTTER_FIX_V11')||!s.includes('phoneConfirmDailyWager(1000)')) throw new Error('Required game v11 markers missing');
fs.writeFileSync(gamePath,s);

let a=fs.readFileSync(auditPath,'utf8');
function aonce(from,to,label){const i=a.indexOf(from);if(i<0)throw new Error(`Missing audit anchor: ${label}`);if(a.indexOf(from,i+from.length)>=0)throw new Error(`Audit anchor not unique: ${label}`);a=a.slice(0,i)+to+a.slice(i+from.length)}
aonce('const followupIssues = [];','const followupIssues = [];\nconst hintIssues = [];','hint audit state');
aonce(`    if ((clue.choices || []).length !== 2 || matches.length !== 1 || !clue.h) {\n      questionIssues.push({ category: category.name, row: row + 1, matches: matches.length });\n    }`, `    if ((clue.choices || []).length !== 2 || matches.length !== 1 || !clue.h) {\n      questionIssues.push({ category: category.name, row: row + 1, matches: matches.length });\n    }\n    const hint=String(clue.h||\"\");\n    const directionalSpoiler=/\\b(before|after|earlier|later|predates|preceded|followed|came first|first came|already (?:standing|underway)|slightly earlier|shortly before|year before)\\b/i;\n    const hintNorm=normalize(hint);\n    const choiceLeak=(clue.choices||[]).some(choice=>{const c=normalize(choice);return c.length>=10 && hintNorm.includes(c)});\n    if(!hint || directionalSpoiler.test(hint) || choiceLeak) hintIssues.push({category:category.name,row:row+1,hint});`, 'hint spoiler checks');
aonce(`if(!html.includes("PHONE_SCROLL_CHOICE_FIX_V7")||!html.includes("primaryCorrectSideBag")||!html.includes("buildPrimaryChoiceOrder")||!html.includes("nextPrimaryCorrectSide")) throw new Error("Phone scrolling or balanced primary answer-side randomization missing");`, `if(!html.includes("PHONE_SCROLL_CHOICE_FIX_V7")||!html.includes("primaryCorrectSideBag")||!html.includes("buildPrimaryChoiceOrder")||!html.includes("nextPrimaryCorrectSide")) throw new Error("Phone scrolling or balanced primary answer-side randomization missing");\nif(!html.includes("DAILY_STATIC_WAGER_V11")||!html.includes("PHONE_HORIZONTAL_GUTTER_FIX_V11")) throw new Error("Static Daily Double wager or mobile gutter fix missing");\nfor(const amount of [100,200,300,400,500,1000]){if(!html.includes(`confirmDailyWager(${amount})`)||!html.includes(`phoneConfirmDailyWager(${amount})`))throw new Error(`Missing static Daily Double wager ${amount}`)}\nif(/id=\"(?:phone)?wagerInput\"[^>]*type=\"number\"/.test(html)) throw new Error("Manual Daily Double number input still present");`, 'v11 audit markers');
aonce('  followupIssues,','  followupIssues,\n  hintIssues,','hint result');
aonce('if (questionIssues.length || followupIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;','if (questionIssues.length || followupIssues.length || hintIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;','hint audit failure');
fs.writeFileSync(auditPath,a);
console.log('Applied hint audit, mobile gutter, and static Daily Double wagers v11');
