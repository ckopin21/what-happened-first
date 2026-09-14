// Static registry: add future Classic packs here; engines discover packs only
// through this manifest. The default is synchronously loaded for GitHub Pages.
window.CLASSIC_PACK_MANIFEST={
  defaultPackId:"general-knowledge-v3",
  packs:[{id:"general-knowledge-v3",name:"General Knowledge",genre:"General Knowledge",file:"current.js"}]
};
window.CLASSIC_QUESTION_PACKS=window.CLASSIC_QUESTION_PACKS||{};
(function(){const p=window.CLASSIC_PACK_MANIFEST.packs.find(x=>x.id===window.CLASSIC_PACK_MANIFEST.defaultPackId);if(p)document.write('<script src="../packs/classic/'+p.file+'"><'+'/script>');})();
