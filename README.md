# Jeopardy Game Collection

A host-led, 1–5 player trivia collection. The host runs the board on a laptop or TV and players join from phones using the room link or QR code.

## Game modes

- **What Happened First?** — timeline trivia where the active player chooses and answers between two events.
- **Classic Jeopardy** — the active player chooses the clue, then every player types and submits an open-ended answer at the same time.

Open `index.html` (or the GitHub Pages root) to choose a mode.

## Question packs

Both games keep their questions separate from the game engine:

`packs/timeline/current.js` and `packs/classic/current.js`

That means a genre change can be done without rewriting the multiplayer game. For example, ask ChatGPT:

> Replace the Classic Jeopardy question pack with a Disney theme. Keep 5 categories × 5 clues, values 100–500, hints, accepted aliases, and leave the game engine unchanged.

See `QUESTION_WORKFLOW.md` for the atomic replacement workflow, validation, and
permanent question histories. `packs/timeline/README.md` and
`packs/classic/README.md` document their schemas.

## Phone play

1. Open the desired game on the host device.
2. Keep the host page open for the entire game.
3. Players scan the large QR code or open the displayed phone link.
4. Each player enters a name, chooses an avatar, and joins.
5. Phones wait in the lobby until the host presses **Start Game**.
6. The host remains authoritative for game state and scoring.

A phone stores a room-scoped session identity in browser storage. Refreshing, using back/forward navigation, or briefly backgrounding the browser reconnects that identity to the existing player and requests a complete state refresh. A new browser identity cannot join after gameplay starts, while an existing player can reclaim their seat.

## Development

Read `PROJECT_CONTEXT.md` and `AGENTS.md` before making changes. Run both audits after relevant edits:

```text
node work/audit-game.js outputs/dog-jeopardy.html
node work/audit-classic.js
node work/validate-questions.js
```

No build step is required. The games are static HTML/JavaScript apps. For local networking tests, serve the repository over HTTP/HTTPS rather than `file://`.

## Networking

Phone controllers use PeerJS/WebRTC. Game state travels directly between the host browser and phones; the public PeerJS cloud service handles connection signaling. Some restrictive networks may block peer-to-peer connections, in which case dedicated signaling/TURN infrastructure would be the production-grade fallback.

Both games retry interrupted signaling and data connections with backoff, replace duplicate connections for the same player session, and reject phone actions that do not match the connection's assigned player and current game phase. The timeline engine additionally uses monotonic state revisions and intent replay protection; Classic uses game epochs and per-phase action nonces.

Both pages load the shared `assets/network/peer-network.js` runtime. It records PeerJS, DataConnection, ICE gathering, ICE connection, signaling, and WebRTC connection-state transitions in `window.WHF_NETWORK.events`, and phone screens report whether a timeout occurred during signaling registration, ICE gathering, or data-channel opening. Run `node work/network-browser-diagnostic.js <served-outputs-url>` to exercise host registration, phone connection, joining, reload/reconnect, and duplicate-player prevention in isolated Chrome profiles for both games.

The shared runtime accepts a deployment-provided `window.WHF_TURN_ICE_SERVERS` array before it loads. Production TURN credentials should be short-lived credentials issued by a controlled backend; do not commit long-lived TURN secrets to this static repository.
