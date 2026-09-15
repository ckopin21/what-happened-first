# Project context: Jeopardy game collection

## Product intent

This repository contains two polished, host-led, phone-connected Jeopardy-style games for 1–5 players. Preserve the shared visual identity, animated player cards, blue/gold board styling, room QR flow, mobile controller experience, host-authoritative networking, and fullscreen-friendly host display.

## Game modes

### What Happened First?

Primary file: `outputs/dog-jeopardy.html`

- Timeline trivia.
- Only the active player selects and answers a normal clue.
- Binary event-order answers.
- Hidden Daily Doubles, hints, phase multipliers, streak effects, Last Chance, two-part follow-ups, tie-breakers, DEV tools, and animated finale.
- Tie-breakers select a winner without meaningfully changing displayed scores.

### Classic Jeopardy

Primary file: `outputs/classic-jeopardy.html`

- The active player chooses the clue, but **every player answers simultaneously**.
- Each phone types an open-ended answer and presses **Confirm & Submit**. The answer is then locked.
- The host automatically reveals once every player has submitted, or can press **Reveal Now** early.
- Fuzzy judging tolerates reasonable spelling differences and accepted aliases. The host can override every player's result before scoring.
- Used board tiles show which player(s) got the clue correct and can be clicked to review the answers.
- Per-player hints reveal only on that player's phone and reduce only that player's possible points for the clue.
- Hidden Daily Doubles keep wager/answer ownership with the active player's stable identity. Real Last Chance awards one trailing player a one-clue 2× opportunity; in Classic only that player's score delta is doubled while everyone still answers simultaneously.
- 2× and 3× endgame phases, streak visuals, player avatars, manual host score adjustment, fullscreen board, New Game/Reset Game behavior, large QR joining, used-clue review, and animated final ranking mirror the timeline game's design language.
- New Game resets board/scores while keeping the roster. Reset Game clears the roster after confirmation.

## Swappable question packs

Both games use manifest-backed, data-only question packs. `packs/timeline/manifest.js`
and `packs/classic/manifest.js` list installed packs and their default. Hosts may
switch packs in place: the new pack is loaded and checked first, then a fresh
game starts with the roster, room, connections, and settings preserved. New Game
keeps the selected pack and roster; Reset Game clears the roster.

- Pack workflow: `PACK_WORKFLOW.md`
- Pack instructions/schema: `packs/classic/README.md`
- A content-only pack change must not edit an HTML engine.
- The engine reads pack title, subtitle, genre, categories, clue values, questions, canonical answers, accepted aliases, hints, and scoring rule multipliers.
- This separation is specifically intended so the user can tell ChatGPT something like “make Classic Jeopardy Disney-themed” without risking game-flow or networking code.

## Shared networking rules

- The host is authoritative for game state and scoring.
- Real phones join through the host's displayed link / QR and four-character room code.
- Networking uses PeerJS 1.5.5 over WebRTC data channels with the public PeerJS cloud signaling service.
- Phones send validated intents, never score values or unrestricted state.
- A session-scoped phone token lets a refreshed phone reclaim its player in the current host session.
- The host owns an explicit lobby phase. Players may join before **Start Game**; once started, only a known session token may reclaim an existing seat.
- Phone identities are persisted per room with a local-storage preference and session-storage fallback. Duplicate live connections for one identity are superseded instead of creating duplicate players.
- A normal disconnect is temporary and retains a reclaimable seat. Leave Game is
  an explicit authenticated intent: only the connection's own player can be
  removed, its token binding is revoked, and remaining players continue with
  reindexed authoritative state.
- Phones recover in place after connection errors, app/background resume, browser page restoration, and network return. Reconnects receive a complete authoritative state snapshot.
- A phone that has submitted a join while its first data channel is closing replays that authenticated join on the next connection, avoiding the one-shot join race that can leave the controller stuck at “Connecting to host…”.
- Classic also handles Back/Forward and bfcache restoration as temporary disconnects: stale PeerJS objects are rebuilt, a saved room token is rejoined, and only an acknowledged Leave Game suppresses future recovery.
- Timeline snapshots carry monotonic revisions and remote intents carry replay IDs. Classic actions carry the current game epoch and phase nonce. These guards prevent delayed messages from an earlier question or game from mutating current state.
- Timeline host peer ID: `what-happened-first-<room code in lowercase>`.
- Classic host peer ID: `classic-jeopardy-<room code in lowercase>`.

## Repository entry points

- `index.html` — game-mode selector.
- `outputs/dog-jeopardy.html` — timeline game.
- `outputs/classic-jeopardy.html` — Classic open-ended game.
- `packs/timeline/manifest.js` and `packs/classic/manifest.js` — installed pack registries.
- `work/audit-game.js` — timeline static audit.
- `work/audit-classic.js` — Classic engine + pack static audit.

## Important timeline fixes already made

- Tie-breaker winner stored separately in `tieWinnerIndex`; no score inflation.
- Duplicate answer/tap scoring guarded by `questionResolved` and tie answer sets.
- Stale delayed callbacks guarded by `gameEpoch`.
- Fullscreen board uses a flex-column layout so the fifth row stays visible.
- Last Chance values and badge behavior corrected.
- Developer modifier cancellation restores armed state.
- Five 500-point clues have real two-part follow-ups.
- Board keyboard accessibility and zero-player selection guard added.

## Testing expectations

Run:

```text
node work/audit-game.js outputs/dog-jeopardy.html
node work/audit-classic.js
```

For networking/game-flow changes, test over HTTP/HTTPS with multiple browser contexts. For Classic specifically verify:

1. Host loads with the current pack and reports phone service ready.
2. Multiple phones can join with names/avatars.
3. Only the active player's phone can choose a clue.
4. Every joined phone receives the same clue and can submit exactly once.
5. A per-player hint affects only that phone and that player's award.
6. All-submitted triggers automatic reveal; host Reveal Now works before that.
7. Fuzzy judgments can be overridden before scoring.
8. Scoring applies exactly once to every player.
9. Used tiles display correct player names and open a non-scoring review.
10. New Game keeps the roster; Reset Game clears it.
11. 2×/3× phases, fullscreen, finale, and mobile safe-area behavior remain intact.

## Known limitations

- The free public PeerJS service is suitable for casual play but has no uptime guarantee.
- WebRTC may fail on restrictive networks without a TURN relay.
- Host refresh creates a new room and resets in-memory game state.
- Browser suspension may still interrupt a WebRTC data channel; the phone now reconnects after it is resumed, but it cannot exchange data while the operating system has frozen the page.
- The highest-value production reliability upgrade is dedicated PeerJS signaling plus a TURN relay. After that, add automated Chromium/WebKit multi-context tests for lobby, reconnect, network-loss, and repeated-game flows.

## Provenance

The original timeline project was continued from ChatGPT conversation `6aa6d45e-3c40-83ea-87b8-055b22252e7e` (“Create Dog Jeopardy Game”) and then extended with the Classic simultaneous-answer mode.
