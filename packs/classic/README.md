# Classic Jeopardy question packs

`current.js` contains the content currently loaded by Classic Jeopardy. The game engine is separate, so changing the genre should normally require editing only this file.

## Fastest ChatGPT workflow

Ask ChatGPT something like:

> Replace the Classic Jeopardy question pack with a Disney theme. Keep 5 categories with 5 clues each, values 100–500, include a concise hint for every clue, and provide accepted answer aliases for fuzzy judging. Do not change the Classic game engine.

ChatGPT should update only `packs/classic/current.js` unless you explicitly request game-mechanic changes.

## Pack schema

```js
window.CLASSIC_JEOPARDY_PACK = {
  id: "unique-pack-id",
  title: "CLASSIC JEOPARDY",
  subtitle: "Everyone answers every clue.",
  genre: "Genre name",
  rules: {
    wrongMultiplier: 0,
    hintMultiplier: 0.5
  },
  categories: [
    {
      name: "Category",
      clues: [
        {
          value: 100,
          question: "Question text",
          answer: "Canonical answer",
          aliases: ["Accepted answer", "Alternate wording"],
          hint: "A useful hint that does not directly give the answer."
        }
      ]
    }
  ]
};
```

The default board is designed for 5 categories × 5 clues, but the engine reads the category count and clue data from the pack rather than embedding questions in the game HTML.
