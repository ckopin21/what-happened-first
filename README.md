# Jeopardy Game Collection

A host-led, 1–5 player trivia collection. The host runs the board on a laptop or TV and players join from phones using the room link or QR code.

## Game modes

- **What Happened First?** — timeline trivia where the active player chooses and answers between two events.
- **Classic Jeopardy** — the active player chooses the clue, then every player types and submits an open-ended answer at the same time.

Open `index.html` (or the GitHub Pages root) to choose a mode.

## Classic question packs

Classic Jeopardy keeps its questions separate from the game engine. The current genre/question set is:

`packs/classic/current.js`

That means a genre change can be done without rewriting the multiplayer game. For example, ask ChatGPT:

> Replace the Classic Jeopardy question pack with a Disney theme. Keep 5 categories × 5 clues, values 100–500, hints, accepted aliases, and leave the game engine unchanged.

See `packs/classic/README.md` for the pack schema.

## Phone play

1. Open the desired game on the host device.
2. Keep the host page open for the entire game.
3. Players scan the large QR code or open the displayed phone link.
4. Each player enters a name, chooses an avatar, and joins.
5. The host remains authoritative for game state and scoring.

## Development

Read `PROJECT_CONTEXT.md` and `AGENTS.md` before making changes. Run both audits after relevant edits:

```text
node work/audit-game.js outputs/dog-jeopardy.html
node work/audit-classic.js
```

No build step is required. The games are static HTML/JavaScript apps. For local networking tests, serve the repository over HTTP/HTTPS rather than `file://`.

## Networking

Phone controllers use PeerJS/WebRTC. Game state travels directly between the host browser and phones; the public PeerJS cloud service handles connection signaling. Some restrictive networks may block peer-to-peer connections, in which case dedicated signaling/TURN infrastructure would be the production-grade fallback.
