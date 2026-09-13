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

const results = {
  syntax: "pass",
  categories: categories.length,
  questions: categories.reduce((count, category) => count + category.clues.length, 0),
  questionIssues,
  duplicateIds,
  missingIds,
  missingHandlers,
};

console.log(JSON.stringify(results, null, 2));
if (questionIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length) process.exitCode = 1;
