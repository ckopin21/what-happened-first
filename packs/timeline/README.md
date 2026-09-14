# Timeline question packs

`current.js` is the complete question source for **What Happened First?**. The
HTML game only loads `window.TIMELINE_JEOPARDY_PACK`; it does not contain a
second normal-question bank.

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
