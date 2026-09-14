// Static registry: add future Timeline packs here; engines discover packs only
// through this manifest. The default is synchronously loaded for GitHub Pages.
window.TIMELINE_PACK_MANIFEST={
  defaultPackId:"timeline-general-knowledge-v3",
  packs:[
    {id:"timeline-general-knowledge-v3",name:"General Knowledge",genre:"Timeline",file:"current.js"},
    {id:"timeline-general-knowledge-v4",name:"General Knowledge II",genre:"Timeline",file:"timeline-general-knowledge-v4.js"}
  ]
};
window.TIMELINE_QUESTION_PACKS=window.TIMELINE_QUESTION_PACKS||{};
(function(){const p=window.TIMELINE_PACK_MANIFEST.packs.find(x=>x.id===window.TIMELINE_PACK_MANIFEST.defaultPackId);if(p)document.write('<script src="../packs/timeline/'+p.file+'"><'+'/script>');})();
