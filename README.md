# What Happened First?

A host-led, 1–5 player timeline trivia game. The host runs the board on a laptop or TV, and players join from their phones using the room link shown on the host screen.

## Play

1. Open the hosted game on the host device.
2. Keep the host page open for the entire game.
3. Copy the phone link shown beside the four-character room code and send it to each player.
4. Each player opens the link, enters a name, picks an avatar, and joins.
5. The active player chooses and answers from their phone. The host remains authoritative for turns, scoring, timers, and tie-breakers.

The game supports local host-created players and the built-in Player Phone Preview too.

## Continue development on another device

1. Clone this repository.
2. Open the cloned folder as a Codex project.
3. Ask Codex to read `PROJECT_CONTEXT.md` and `AGENTS.md` before making changes.
4. Run `node work/audit-game.js outputs/dog-jeopardy.html` after edits.

No build step is required. The game is a static HTML app. For local testing, serve the repository over HTTP rather than opening it with `file://`; real phone connections also need internet access to reach the PeerJS signaling service.

## Hosting

GitHub Pages can publish the repository root. `index.html` forwards to the current game file while preserving the phone-room query string.

## Networking

Phone controllers use PeerJS/WebRTC. Game state travels directly between the host browser and phones; the public PeerJS cloud service is used for connection signaling. No player names or scores are stored by this repository. Some restrictive school, corporate, carrier, or guest networks may block peer-to-peer connections; a self-hosted signaling/TURN deployment would be the production-grade fallback.
