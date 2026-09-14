# Question pack workflow

Questions are content, not game logic. The two production packs are:

- Timeline: `packs/timeline/current.js`
- Classic: `packs/classic/current.js`

Their permanent ledgers are `packs/history/timeline-used.json` and
`packs/history/classic-used.json`. A history entry records its stable ID,
question text, answer, category, and the pack in which it first appeared.

## Safe atomic replacement

1. Work from the current pack; do not edit either HTML engine for a content-only
   refresh.
2. Give every primary question and every follow-up a new stable ID. Keep the
   documented schema exactly; Timeline's legacy `q`/`a`/`fq` fields are part of
   its engine contract.
3. Copy every outgoing current-pack question into that game's history before
   replacing it. `node work/validate-questions.js --record-current timeline`
   (or `classic`) appends only missing entries and writes atomically.
4. Replace the pack, then run:

   ```text
   node work/validate-questions.js
   node work/audit-game.js outputs/dog-jeopardy.html
   node work/audit-classic.js
   ```

5. Serve the site over HTTP and open both game pages once before committing.

The validator requires five categories of five clues, complete special/follow-up
data, unique IDs, valid choices/answers, supported fields only, and checks each
new question against the permanent history for exact or obvious near-duplicate
underlying facts. A deliberate reuse must set `allowReuse:true` on that exact
primary clue or Classic follow-up; this should be exceptional and reviewable.

Do not delete history entries. They are the permanent record that keeps a later
theme swap from accidentally bringing back old material.
