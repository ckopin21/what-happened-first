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
- 2× and 3× endgame phases, streak visuals, player avatars, manual host score adjustment, fullscreen board, New Game/Reset Game behavior, large QR joining, used-clue review, and animated final ranking mirror the timeline game's design language.
- New Game resets board/scores while keeping the roster. Reset Game clears the roster after confirmation.

## Swappable Classic question packs

Classic content is intentionally separated from its engine.

- Current pack: `packs/classic/current.js`
- Pack instructions/schema: `packs/classic/README.md`
- Changing only the Classic theme/genre/questions should normally require editing **only** `packs/classic/current.js`.
- The engine reads pack title, subtitle, genre, categories, clue values, questions, canonical answers, accepted aliases, hints, and scoring rule multipliers.
- This separation is specifically intended so the user can tell ChatGPT something like “make Classic Jeopardy Disney-themed” without risking game-flow or networking code.

## Shared networking rules

- The host is authoritative for game state and scoring.
- Real phones join through the host's displayed link / QR and four-character room code.
- Networking uses PeerJS 1.5.5 over WebRTC data channels with the public PeerJS cloud signaling service.
- Phones send validated intents, never score values or unrestricted state.
- A session-scoped phone token lets a refreshed phone reclaim its player in the current host session.
- Timeline host peer ID: `what-happened-first-<room code in lowercase>`.
- Classic host peer ID: `classic-jeopardy-<room code in lowercase>`.

## Repository entry points

- `index.html` — game-mode selector.
- `outputs/dog-jeopardy.html` — timeline game.
- `outputs/classic-jeopardy.html` — Classic open-ended game.
- `packs/classic/current.js` — swappable Classic content.
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
- A production version could add dedicated signaling/TURN infrastructure and automated multi-browser tests.

## Provenance

The original timeline project was continued from ChatGPT conversation `6aa6d45e-3c40-83ea-87b8-055b22252e7e` (“Create Dog Jeopardy Game”) and then extended with the Classic simultaneous-answer mode.
