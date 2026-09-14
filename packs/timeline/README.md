# Timeline question packs

`manifest.js` is the Timeline registry; each registered `.js` file is one
complete question pack. The HTML discovers packs through the manifest and does
not contain a normal-question bank. Read [`PACK_WORKFLOW.md`](../../PACK_WORKFLOW.md)
before adding or changing content.

Keep exactly five categories with five clues each. A normal clue is:

```js
{ id:"timeline-theme-category-100", q:"Which happened first: ...?", h:"Neutral clue.", a:"The earlier event first", choices:["Event A","Event B"] }
```

The fifth clue in each category is a two-part special. It keeps the existing
engine field names and adds a separate permanent follow-up ID:

```js
{ id:"timeline-theme-category-500", q:"...", h:"...", a:"...", choices:["A","B"],
  special:true, followupId:"timeline-theme-category-500-followup",
  fq:"Follow-up question", fa:"Explanation", fchoices:["A","B","C","D"], fcorrect:"A" }
```

Every primary and follow-up question needs a unique stable ID. See
[`QUESTION_WORKFLOW.md`](../../QUESTION_WORKFLOW.md) before replacing a pack.
