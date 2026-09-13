const fs = require("fs");

const file = process.argv[2];
const html = fs.readFileSync(file, "utf8");
const script = html.split("<script>")[1]?.split("</script>")[0];
if (!script) throw new Error("Inline game script not found");
new Function(script);

const categoriesSource = script.match(/const categories=(\[[\s\S]*?\]);\s*\n\s*let players=/)?.[1];
if (!categoriesSource) throw new Error("Question data not found");
const categories = new Function(`return ${categoriesSource}`)();

const normalize = (text) => String(text || "")
  .toLowerCase()
  .replace(/^the\s+/, "")
  .replace(/\s+first$/, "")
  .replace(/[’']/g, "'")
  .replace(/[^\w\s'-]/g, "")
  .trim();

const questionIssues = [];
const followupIssues = [];
const hintIssues = [];
for (const category of categories) {
  category.clues.forEach((clue, row) => {
    const matches = (clue.choices || []).filter((choice) => {
      const answer = normalize(clue.a);
      const candidate = normalize(choice);
      return answer === candidate || answer.includes(candidate) || candidate.includes(answer);
    });
    if ((clue.choices || []).length !== 2 || matches.length !== 1 || !clue.h) {
      questionIssues.push({ category: category.name, row: row + 1, matches: matches.length });
    }
    const hint=String(clue.h||"");
    const directionalSpoiler=/\b(before|after|earlier|later|predates|preceded|followed|came first|first came|already (?:standing|underway)|slightly earlier|shortly before|year before)\b/i;
    const hintNorm=normalize(hint);
    const choiceLeak=(clue.choices||[]).some(choice=>{const c=normalize(choice);return c.length>=10 && hintNorm.includes(c)});
    if(!hint || directionalSpoiler.test(hint) || choiceLeak) hintIssues.push({category:category.name,row:row+1,hint});
    if (clue.special) {
      const options = clue.fchoices || [];
      const banned = /^(all|none|not enough|cannot determine)/i;
      if (options.length !== 4 || !clue.fcorrect || !options.includes(clue.fcorrect) || options.some(x => banned.test(String(x)))) {
        followupIssues.push({ category: category.name, row: row + 1 });
      }
    }
  });
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const staticIdSet = new Set(ids);
const referencedIds = [...script.matchAll(/getElementById\("([^"]+)"\)/g)].map((match) => match[1]);
const missingIds = [...new Set(referencedIds.filter((id) => !staticIdSet.has(id) && !/^player\d$/.test(id)))];

const definedFunctions = new Set([...script.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]));
const handlers = [...html.matchAll(/\sonclick="([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]);
const missingHandlers = [...new Set(handlers.filter((handler) => !definedFunctions.has(handler)))];

const specials=categories.flatMap((category)=>category.clues.map((clue,row)=>({category:category.name,row,clue}))).filter(x=>x.clue.special);
if(specials.length!==5||specials.some(x=>x.row!==4||!x.clue.fq||!x.clue.fa)) throw new Error("Expected five playable 500-point follow-up clues");
if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!html.includes("AVATAR_CENTERING_V12")) throw new Error("Randomized follow-up/avatar centering fix missing");
if(!html.includes("shuffledPrimaryChoices")||!html.includes("primaryChoicesForCurrent")||!html.includes("choiceOrder:Array.isArray(current.choiceOrder)")||!html.includes('broadcastGameState(true);\n      showToast("Primary answer correct"')) throw new Error("Primary choice shuffle or follow-up broadcast fix missing");
if(!html.includes("PHONE_SCROLL_CHOICE_FIX_V7")||!html.includes("primaryCorrectSideBag")||!html.includes("buildPrimaryChoiceOrder")||!html.includes("nextPrimaryCorrectSide")) throw new Error("Phone scrolling or balanced primary answer-side randomization missing");
if(!html.includes("DAILY_STATIC_WAGER_V11")||!html.includes("PHONE_HORIZONTAL_GUTTER_FIX_V11")) throw new Error("Static Daily Double wager or mobile gutter fix missing");
for(const amount of [100,200,300,400,500,1000]){if(!html.includes("confirmDailyWager("+amount+")")||!html.includes("phoneConfirmDailyWager("+amount+")"))throw new Error("Missing static Daily Double wager "+amount)}
if(/id="(?:phone)?wagerInput"[^>]*type="number"/.test(html)) throw new Error("Manual Daily Double number input still present");

const results = {
  syntax: "pass",
  categories: categories.length,
  questions: categories.reduce((count, category) => count + category.clues.length, 0),
  questionIssues,
  followupIssues,
  hintIssues,
  duplicateIds,
  missingIds,
  missingHandlers,
};

console.log(JSON.stringify(results, null, 2));
if (questionIssues.length || followupIssues.length || hintIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;
