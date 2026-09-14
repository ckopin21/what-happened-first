// Compatibility loader: production questions live in ../catalog/timeline-general-knowledge-v4.json
(function(){
  const pack=window.WHF_JSON_PACKS.loadSync("../packs/catalog/timeline-general-knowledge-v4.json","timeline");
  window.TIMELINE_QUESTION_PACKS=window.TIMELINE_QUESTION_PACKS||{};
  window.TIMELINE_QUESTION_PACKS[pack.id]=pack;
})();
