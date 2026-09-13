# Codex continuation instructions

Read `PROJECT_CONTEXT.md` before editing the game.

Preserve all existing features unless the user explicitly requests a change. Treat `outputs/dog-jeopardy.html` as the source of truth and keep `index.html` forwarding its query string so phone join links continue to work on GitHub Pages.

The host must remain authoritative. Never accept score values, player indexes, or unrestricted state mutations from a phone. Validate every remote action against the connection's assigned player and the current game phase.

Use `apply_patch` for edits. Run `node work/audit-game.js outputs/dog-jeopardy.html` and perform a real host/phone browser test after networking or game-flow changes.
