// Compatibility loader: production questions live in ../catalog/general-knowledge-v4.json
(function(){
  const pack=window.WHF_JSON_PACKS.loadSync("../packs/catalog/general-knowledge-v4.json","classic");
  window.CLASSIC_QUESTION_PACKS=window.CLASSIC_QUESTION_PACKS||{};
  window.CLASSIC_QUESTION_PACKS[pack.id]=pack;
})();
