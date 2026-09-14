# Question pack workflow

## JSON pack contract (new content architecture)

The new pure-data contract lives at `packs/schema/question-pack.schema.json`.
Use `packs/templates/timeline-template.json` or
`packs/templates/open-ended-template.json` as the starting point. This is the
required format for new catalog packs; the installed JavaScript packs are a
temporary compatibility layer while their existing questions are migrated.

Never edit `outputs/**`, `assets/network/**`, shared UI, or scoring code for a
content-only request. Read, in order: this file, the schema, the relevant
manifest, installed-pack metadata, and permanent history. Use a unique
versioned pack ID (for example `science-v1`), five categories, five clues per
category, globally unique clue/follow-up IDs, readable `question`, `answer`,
`aliases`, and `hint` fields. Timeline clues additionally require exactly two
`choices`; their answer must identify one choice. A follow-up is a nested
`followup` object with the same readable answer fields.

Run `node work/validate-packs.js` for every JSON-only change, then the legacy
validator and mode audits while the compatibility layer remains installed.

Question packs are data-only. Do not edit either game HTML for a content-only
pack request. GitHub Pages loads `packs/<game>/manifest.js`; the manifest loads
its default pack synchronously and the host can load any registered pack later.

## Structure and manifest

```text
packs/timeline/manifest.js     packs/classic/manifest.js
packs/timeline/<pack>.js       packs/classic/<pack>.js
packs/history/timeline-used.json
packs/history/classic-used.json
```

Each manifest has `defaultPackId` and `packs`. Every entry needs a unique
`id`, human-readable `name`, `genre`, and local `file`. Each data file registers
the same `id`, `name`, and `genre` in `window.TIMELINE_QUESTION_PACKS` or
`window.CLASSIC_QUESTION_PACKS`. IDs are lowercase, stable, descriptive,
hyphenated identifiers. Display names should not be confusingly duplicated.

Timeline clues use `id`, `q`, `h`, `a`, and two `choices`; its fifth clue has
`special:true` plus `followupId`, `fq`, `fa`, `fchoices`, and `fcorrect`.
Classic clues use `id`, `value`, `question`, `answer`, `aliases`, and `hint`;
a follow-up has its own `id` and the same answer fields. Packs have exactly
five categories of five clues. `allowReuse:true` is the only approved, explicit
exception to duplicate protection.

The history ledgers are permanent. All questions in every registered pack are
reserved, as are every primary and follow-up question in history. Exact and
near-duplicate wording is rejected across packs and history.

## Instructions for ChatGPT when adding a question pack

1. Read this file, `packs/schema/question-pack.schema.json`, the relevant pack
   manifest, all installed-pack metadata, and that game's history ledger.
2. Do not edit `outputs/dog-jeopardy.html` or `outputs/classic-jeopardy.html`
   for a content-only change.
3. Create a unique pack ID and unique question IDs; check all new questions
   against installed packs and permanent history.
4. Create the new data file, register it in the relevant manifest, and append
   its questions to the matching history ledger.
5. Run `node work/validate-questions.js --game timeline` (or `classic`), then
   the relevant game audit. Confirm only pack, manifest, and history files
   changed.

To edit wording, update the pack and history only when the underlying question
is intentionally replaced; do not reuse a stable question ID for a new fact.
To replace a whole pack, retain its old history, add fresh IDs/questions, and
update its manifest entry if the filename changes. To rename a pack, update
matching `name`/`genre` in both file and manifest. To change the default, edit
only `defaultPackId`. To remove a pack, remove its manifest entry and data file
but never delete its history.

Examples: “Add a new Science pack to Timeline with 5 categories and 5 questions
each; do not reuse history” changes a new Timeline pack, manifest, and Timeline
history. “Add a Disney pack to Classic; keep existing packs” changes the Classic
equivalents. “Replace Sports” changes that pack and history. “Switch the default
Timeline pack to History” changes the Timeline manifest only.

| Request | Files normally changed |
| --- | --- |
| Add Timeline pack | new Timeline pack, Timeline manifest, Timeline history |
| Add Classic pack | new Classic pack, Classic manifest, Classic history |
| Edit a question | relevant pack; history if it becomes a new question |
| Change default | relevant manifest only |
| Change game mechanic | engine, audits, and docs |
| Change pack-switch mechanics | engine, audits, and docs; not question files |

Commands: `node work/validate-questions.js`, `node work/validate-questions.js
--game timeline`, `node work/validate-questions.js --game classic`, and
`node work/validate-questions.js --pack <pack-id>`. Finish with
`node work/audit-game.js outputs/dog-jeopardy.html` and
`node work/audit-classic.js`.

## Leave Game

Disconnect is temporary: the seat and token remain and the phone can reclaim it.
**Leave Game** is an explicit confirmed intent: the host validates the current
connection identity, removes only that player, revokes the token binding, and
the phone clears its room token. Timeline restores an unresolved active clue to
the board and advances safely. Classic removes the player from submissions,
hints, and judgments, then reveals if all remaining players have submitted.
Zero players returns to the host lobby; it does not end the room.
