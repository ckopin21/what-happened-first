# Continuation instructions

Read `PROJECT_CONTEXT.md` before editing either game mode.

Preserve all existing features unless the user explicitly requests a change. The repository has two separate playable engines:

- `outputs/dog-jeopardy.html` — **What Happened First?** timeline mode.
- `outputs/classic-jeopardy.html` — **Classic Jeopardy** simultaneous open-ended mode.

`index.html` is the game-mode selector. Keep phone join query strings working on GitHub Pages.

The host must remain authoritative in both modes. Never accept score values, player indexes, or unrestricted state mutations from a phone. Validate every remote action against the connection's assigned player and the current game phase.

Mode-specific rules:

- Timeline mode: only the active player selects and answers a normal clue.
- Classic mode: only the active player selects the clue, but every joined player may answer that clue once. Answers reveal automatically when all players submit, with a host early-reveal override.
- Content-only pack work must not edit either game engine. Read `PACK_WORKFLOW.md`, `packs/schema/question-pack.schema.json`, the relevant manifest, every installed pack's metadata, and the matching history ledger; then edit only pack/manifest/history files. New catalog packs must be pure JSON and pass `node work/validate-packs.js`.

Run both static audits after relevant edits:

```text
node work/audit-game.js outputs/dog-jeopardy.html
node work/audit-classic.js
```

After networking or game-flow changes, also perform a real host/phone browser test over HTTP/HTTPS.
