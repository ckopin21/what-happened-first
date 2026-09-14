const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { validateCurrentPacks } = require("./validate-questions");

const file = process.argv[2];
if (!file) throw new Error("Usage: node work/audit-game.js outputs/dog-jeopardy.html");
const html = fs.readFileSync(file, "utf8");
const script = html.split("<script>")[1]?.split("</script>")[0];
if (!script) throw new Error("Inline game script not found");
new Function(script);

if (!html.includes('../packs/timeline/manifest.js')) throw new Error("Timeline pack manifest is not loaded");
if (!/TIMELINE_PACK\.categories/.test(script)) throw new Error("Timeline engine is not using the external question pack");
const { loadPack } = require("./validate-questions");
const timelinePack = loadPack("timeline");
if (!timelinePack || !Array.isArray(timelinePack.categories)) throw new Error("Timeline question pack is invalid");
const categories = timelinePack.categories;
const questionPackValidation = validateCurrentPacks();
if (questionPackValidation.errors.length) throw new Error(`Question pack validation failed:\n- ${questionPackValidation.errors.join("\n- ")}`);

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

// Asset regression checks intentionally resolve paths relative to the page, just as a
// browser does on GitHub Pages. This catches both a missing file and the historically
// easy-to-miss `image`/`src` avatar property mismatch.
const assetReferences = [...new Set([...html.matchAll(/["']((?:\.\.\/)?assets\/[^"'?]+)(?:\?[^"']*)?["']/g)].map(match => match[1]))];
const assetIssues = [];
for (const reference of assetReferences) {
  const resolved = path.resolve(path.dirname(file), reference);
  if (!fs.existsSync(resolved)) {
    assetIssues.push({ reference, issue: "missing file" });
    continue;
  }
  const bytes = fs.readFileSync(resolved);
  if (!bytes.length) assetIssues.push({ reference, issue: "empty file" });
  if (/\.svg$/i.test(resolved)) {
    const svg = bytes.toString("utf8").replace(/^\uFEFF/, "");
    if (!/^\s*<svg\b/i.test(svg) || !/<\/svg>\s*$/i.test(svg) || !/\bviewBox=["'][^"']+["']/i.test(svg)) {
      assetIssues.push({ reference, issue: "invalid SVG wrapper or missing viewBox" });
    }
    if (/<(?:image|script)\b|\b(?:href|src)=["'](?:https?:|data:)/i.test(svg)) {
      assetIssues.push({ reference, issue: "SVG embeds an external/data resource" });
    }
  }
}
const avatarSource = script.match(/const avatarOptions\s*=\s*(\[[\s\S]*?\]);/)?.[1];
const usesSharedAvatarRegistry = /const avatarOptions\s*=\s*window\.JEOPARDY_AVATARS\s*\|\|\s*\[\]/.test(script);
if (usesSharedAvatarRegistry) {
  const registryPath = path.resolve(__dirname, "..", "assets", "ui", "avatar-registry.js");
  if (!fs.existsSync(registryPath) || !fs.readFileSync(registryPath, "utf8").includes("JEOPARDY_AVATARS")) assetIssues.push({ reference: "avatarOptions", issue: "shared avatar registry missing or malformed" });
} else if (!avatarSource) assetIssues.push({ reference: "avatarOptions", issue: "avatar declaration missing" });
else {
  const avatars = new Function(`return ${avatarSource}`)();
  avatars.forEach((avatar, index) => {
    if (!avatar.name || typeof avatar.src !== "string" || !avatar.src) {
      assetIssues.push({ reference: `avatarOptions[${index}]`, issue: "must define name and src" });
    }
  });
}

const regressionIssues = [];
const requirePattern = (name, pattern) => {
  if (!pattern.test(script)) regressionIssues.push(name);
};
requirePattern("explicit lobby/start state", /(?:gameStarted|gamePhase|lobbyState)/);
requirePattern("host start action", /function\s+(?:startGame|hostStartGame)\s*\(/);
requirePattern("Timeline manifest", /TIMELINE_PACK_MANIFEST/);
requirePattern("Timeline pack selector", /timelinePackSelect/);
requirePattern("host Timeline pack switch", /async function switchTimelinePack/);
requirePattern("explicit Timeline leave intent", /action===\"leave\"[\s\S]{0,500}removeTimelinePlayer/);
requirePattern("Timeline disconnect remains distinct from leave", /remoteLeaving[\s\S]{0,300}scheduleRemoteReconnect/);
requirePattern("start gate on remote clue selection", /action\s*===\s*["']select["'][\s\S]{0,240}(?:gameStarted|gamePhase|lobbyState)/);
requirePattern("persistent reconnect token", /localStorage\.getItem\([\s\S]{0,160}(?:token|TOKEN)/i);
requirePattern("token validation", /function\s+(?:safeToken|validToken|normalizeToken)\s*\(/);
requirePattern("token-based player reclaim", /(?:remotePlayerTokens\.get|findIndex\([^)]*token)/);
requirePattern("Timeline connection identity binding", /entry\.playerId=players\[idx\]\.playerId/);
requirePattern("Last Chance identity state", /let lastChancePlayerId=null/);
requirePattern("Last Chance identity comparison", /players\[i\]\?\.playerId===lastChancePlayerId/);
requirePattern("duplicate connection displacement or binding", /(?:replace|supersed|previous|existing|duplicate|playerConnections|connectionByPlayer)/i);
requirePattern("state resync after reconnect", /(?:resume|rejoin)[\s\S]{0,300}(?:broadcastGameState|sendNetworkSnapshot|sendState)/);
requirePattern("ordered state snapshots", /revision[\s\S]{0,300}(?:appliedNetworkRevision|lastAppliedRevision)/);
requirePattern("idempotent remote intents", /intentId[\s\S]{0,500}(?:recentRemoteIntents|seenIntents|processedIntents)/);
requirePattern("visibility recovery", /visibilitychange/);
requirePattern("page restore recovery", /pageshow/);
requirePattern("online recovery", /addEventListener\(["']online["']/);
requirePattern("stale connection cleanup", /conn\.on\(["']close["'][\s\S]{0,180}(?:delete|cleanup|remove)/);
requirePattern("epoch guard for delayed work", /gameEpoch/);
requirePattern("duplicate scoring guard", /questionResolved/);
requirePattern("lobby state sent to phones", /gameStarted[\s\S]{0,500}(?:Waiting for host|lobby)/i);
requirePattern("new game keeps roster", /function\s+newGame\s*\([^)]*\)\s*\{[\s\S]{0,120}(?:resetGameState\(true\)|resetGameState\([^)]*keep)/);
requirePattern("full reset clears roster", /function\s+resetGame\s*\([^)]*\)\s*\{[\s\S]{0,120}(?:resetGameState\(false\)|playerCount\s*=\s*0)/);
if ((script.match(/action===\"profile-update\"/g)||[]).length !== 1) regressionIssues.push("Timeline must have exactly one profile-update action handler");
if (/\{\s*(?:score|playerIndex)\s*:/.test(script.match(/function\s+sendRemoteAction[\s\S]*?\n\}/)?.[0] || "")) {
  regressionIssues.push("phone intent helper must not send score/playerIndex authority");
}

const specials=categories.flatMap((category)=>category.clues.map((clue,row)=>({category:category.name,row,clue}))).filter(x=>x.clue.special);
if(specials.length!==5||specials.some(x=>x.row!==4||!x.clue.fq||!x.clue.fa)) throw new Error("Expected five playable 500-point follow-up clues");
if(!html.includes("shuffledFollowupChoices")||!html.includes("follow-choice")||!html.includes("phoneFollowChoices")||!(html.includes("AVATAR_CENTERING_V12")||html.includes("AVATAR_NEW_VECTOR_ART_V14"))) throw new Error("Randomized follow-up/avatar centering fix missing");
if(!html.includes("shuffledPrimaryChoices")||!html.includes("primaryChoicesForCurrent")||!/choiceOrder\s*:\s*Array\.isArray\(current\.choiceOrder\)/.test(html)||!/broadcastGameState\(true\)\s*;\s*showToast\(["']Primary answer correct["']/.test(html)) throw new Error("Primary choice shuffle or follow-up broadcast fix missing");
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
  assets: { references: assetReferences.length, issues: assetIssues },
  regressionIssues,
};

console.log(JSON.stringify(results, null, 2));
if (questionIssues.length || followupIssues.length || hintIssues.length || duplicateIds.length || missingIds.length || missingHandlers.length || assetIssues.length || regressionIssues.length) process.exitCode = 1;
