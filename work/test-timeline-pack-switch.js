#!/usr/bin/env node
"use strict";

// Runtime-focused regression coverage for the Timeline pack path. The static
// audits validate pack files, but they cannot catch a selector that was never
// populated or verify the browser-side JSON compatibility loader and atomic
// switch behavior together.
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const timelineHtml = fs.readFileSync(path.join(ROOT, "outputs", "dog-jeopardy.html"), "utf8");
const inlineScript = timelineHtml.split("<script>")[1]?.split("</script>")[0];
if (!inlineScript) throw new Error("Timeline inline script not found");

assert.match(
  inlineScript,
  /chooseDailyDoubles\(\);\s*populateTimelinePackSelector\(\);\s*renderJoinAvatars\(\);/,
  "Timeline must populate its pack selector during startup"
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

const loaderContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets", "ui", "json-pack-loader.js"), "utf8"), loaderContext);
const { adaptTimeline } = loaderContext.window.WHF_JSON_PACKS;
const v3 = adaptTimeline(readJson("packs/catalog/timeline-general-knowledge-v3.json"));
const v4 = adaptTimeline(readJson("packs/catalog/timeline-general-knowledge-v4.json"));

assert.equal(v4.categories.length, 5);
assert.equal(v4.categories.flatMap(category => category.clues).filter(clue => clue.special).length, 5);
assert.ok(v4.categories.flatMap(category => category.clues)
  .filter(clue => clue.special)
  .every(clue => clue.fchoices.length === 4 && clue.fchoices.includes(clue.fcorrect)));

const manifestContext = { window: {}, document: { write() {} } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "packs", "timeline", "manifest.js"), "utf8"), manifestContext);
const manifest = manifestContext.window.TIMELINE_PACK_MANIFEST;
assert.ok(manifest.packs.length >= 2, "Timeline manifest must contain at least two packs");
const v4Entry = manifest.packs.find(entry => entry.id === v4.id);
assert.ok(v4Entry, "Timeline manifest must register v4");

const options = [];
const select = {
  options,
  value: "",
  appendChild(option) { options.push(option); },
};
Object.defineProperty(select, "innerHTML", {
  get() { return ""; },
  set() { options.length = 0; },
});

const packs = { [v3.id]: v3 };
const jsonEquivalent = value => JSON.parse(JSON.stringify(value));
const toasts = [];
const resets = [];
const errors = [];
const windowObject = {
  TIMELINE_PACK_MANIFEST: manifest,
  TIMELINE_QUESTION_PACKS: packs,
  WHF_JSON_PACKS: loaderContext.window.WHF_JSON_PACKS,
};

class FakeXHR {
  open(method, url, async) {
    assert.equal(method, "GET");
    assert.equal(async, false, "the current compatibility loader still uses its documented sync path");
    this.url = url;
  }
  send() {
    // XHR resolves relative URLs against the document (/outputs/), not the
    // compatibility-loader script's directory (/packs/timeline/).
    const file = path.resolve(ROOT, "outputs", this.url);
    this.status = 200;
    this.responseText = fs.readFileSync(file, "utf8");
  }
}
loaderContext.XMLHttpRequest = FakeXHR;

const context = {
  window: windowObject,
  XMLHttpRequest: FakeXHR,
  TIMELINE_PACK: v3,
  categories: JSON.parse(JSON.stringify(v3.categories)),
  used: new Set(),
  current: null,
  gameStarted: false,
  remotePhoneMode: false,
  confirm: () => true,
  console: { error(...args) { errors.push(args.join(" ")); } },
  showToast(text, type) { toasts.push({ text, type }); },
  resetGameState(keepPlayers) {
    resets.push(keepPlayers);
    context.used = new Set();
    context.current = null;
    context.gameStarted = false;
  },
  document: {
    getElementById(id) { return id === "timelinePackSelect" ? select : null; },
    createElement(tag) {
      if (tag === "option") return { value: "", textContent: "", selected: false };
      if (tag === "script") return { src: "", async: false, onload: null, onerror: null };
      throw new Error(`Unexpected element: ${tag}`);
    },
    head: {
      appendChild(script) {
        try {
          if (script.src.endsWith("invalid-test.js")) {
            packs["timeline-invalid"] = { ...v4, id: "timeline-invalid", categories: v4.categories.slice(0, 4) };
          } else {
            const file = path.resolve(ROOT, "packs", "timeline", script.src.split("../packs/timeline/")[1]);
            vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
          }
          script.onload();
        } catch (error) {
          if (script.onerror) script.onerror(error);
          else throw error;
        }
      },
    },
  },
};
vm.createContext(context);

const functionsStart = inlineScript.indexOf("function timelineManifestEntry");
const functionsEnd = inlineScript.indexOf("\nfunction leavePhoneGame", functionsStart);
if (functionsStart < 0 || functionsEnd < 0) throw new Error("Timeline pack functions not found");
vm.runInContext(inlineScript.slice(functionsStart, functionsEnd), context, { filename: "outputs/dog-jeopardy.html" });

vm.runInContext("populateTimelinePackSelector()", context);
assert.deepEqual(options.map(option => option.value), [v3.id, v4.id]);
assert.equal(select.value, v3.id);

(async () => {
  await vm.runInContext(`switchTimelinePack(${JSON.stringify(v4.id)})`, context);
  assert.equal(context.TIMELINE_PACK.id, v4.id);
  assert.deepEqual(jsonEquivalent(context.categories), jsonEquivalent(v4.categories));
  assert.equal(resets.length, 1);
  assert.equal(select.value, v4.id);
  assert.equal(packs[v4.id].categories[4].clues[0].fcorrect, v4.categories[4].clues[0].fcorrect);

  await vm.runInContext(`switchTimelinePack(${JSON.stringify(v3.id)})`, context);
  assert.equal(context.TIMELINE_PACK.id, v3.id);
  assert.deepEqual(jsonEquivalent(context.categories), jsonEquivalent(v3.categories));
  assert.equal(resets.length, 2);

  await vm.runInContext(`switchTimelinePack(${JSON.stringify(v4.id)})`, context);
  assert.equal(context.TIMELINE_PACK.id, v4.id, "repeated switching must keep the selected pack authoritative");
  assert.equal(resets.length, 3);

  manifest.packs.push({ id: "timeline-invalid", name: "Invalid Test Pack", genre: "Timeline", file: "invalid-test.js" });
  const beforeInvalid = context.TIMELINE_PACK;
  await vm.runInContext("switchTimelinePack(\"timeline-invalid\")", context);
  assert.equal(context.TIMELINE_PACK, beforeInvalid, "an invalid candidate must not replace the current pack");
  assert.equal(select.value, v4.id, "a failed switch must restore the current selector value");
  assert.equal(resets.length, 3, "a failed switch must not reset game state");
  assert.ok(errors.some(message => message.includes("Timeline pack switch failed")));

  assert.ok(toasts.some(toast => toast.text.includes("Switched to General Knowledge II")));
  console.log("Timeline runtime pack switching valid: startup selector, v3 ↔ v4, repeated switch, adapter, and atomic invalid-candidate retention.");
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
