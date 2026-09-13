# Project context: What Happened First?

## Product intent

This is a playful, polished, host-led timeline trivia game for 1–5 players. Preserve the existing visual identity, animations, avatar art, developer previews, local player support, and phone-sized controller experience. Prefer a fun, non-technical UI.

## Non-negotiable behavior

- The host is authoritative for game state and scoring.
- Real phones join through the host's displayed link and four-character room code.
- Only the active player's phone can select a standard question or act on it.
- Tie-breakers do not meaningfully change displayed scores. They only select the winner used by the finale ranking.
- Every tied participant sees the same tie question on their phone.
- Tie answers submit on the first tap, with no confirmation button.
- The first correct tap wins. A wrong tap locks that player out; if one participant remains, that participant wins.
- Phone modifier/result animations remain compact, not full-screen.
- The DEV button remains available in fullscreen when Developer Mode is enabled.
- The host board must fit all five question rows in fullscreen.
- New Game resets the board and scores but keeps the roster. Reset Game clears the roster after confirmation.

## Current implementation

- Primary deliverable: `outputs/dog-jeopardy.html`
- GitHub Pages entry point: `index.html`
- Static audit: `work/audit-game.js`
- Networking: PeerJS 1.5.5 over WebRTC data channels, with the public PeerJS cloud signaling server.
- Host peer ID: `what-happened-first-<room code in lowercase>`
- Phone URL: the hosted game URL plus `?phone=ROOM`
- Host broadcasts compact state snapshots; base64 avatar images are represented by avatar indexes on the wire.
- Phones send validated intents such as join, select, choose, submit, wager, follow-up, and tie answer. Phones never submit scores.
- A session-scoped phone token allows a refreshed phone tab to reclaim its player during the current host session without causing separate tabs/devices to collide.

## Important fixes already made

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
```

Then test over HTTP with two browser contexts/tabs:

1. Host loads without console errors and reports phone service ready.
2. Phone link connects and joins a player.
3. Phone selection opens the same clue on host and phone.
4. Phone answer changes the host score exactly once.
5. Non-active phones cannot select normal clues.
6. Daily Double wager, hint, follow-up, and result states stay synchronized.
7. Two tied phones race on the same tie question; wrong answers lock out and correct first tap selects the finale winner without changing either score.
8. Host fullscreen at 1366×768 shows all five rows.

## Known limitations and next improvements

- The free public PeerJS service is suitable for casual play but has no uptime guarantee.
- WebRTC may fail on restrictive networks without a TURN relay.
- Host refresh creates a new room and resets the in-memory game.
- A production version could add a dedicated signaling/TURN service, reconnect persistence, QR-code display, and automated multi-browser tests.

## Provenance

The project was continued from ChatGPT conversation `6aa6d45e-3c40-83ea-87b8-055b22252e7e` (“Create Dog Jeopardy Game”) and then audited and extended in Codex.
