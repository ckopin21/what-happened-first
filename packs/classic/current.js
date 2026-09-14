// Compatibility loader: production questions live in ../catalog/general-knowledge-v3.json
window.CLASSIC_JEOPARDY_PACK=window.WHF_JSON_PACKS.loadSync("../packs/catalog/general-knowledge-v3.json","classic");
window.CLASSIC_QUESTION_PACKS=window.CLASSIC_QUESTION_PACKS||{};window.CLASSIC_QUESTION_PACKS[window.CLASSIC_JEOPARDY_PACK.id]=window.CLASSIC_JEOPARDY_PACK;
