/* Browser-side counterpart to work/validate-packs.js. It only loads data; a
   game retains its current pack if parsing or compatibility validation fails. */
(function(){
  function adaptTimeline(pack){
    return {id:pack.id,name:pack.name,genre:pack.genre,title:pack.title,subtitle:pack.subtitle,rules:pack.rules||{},categories:pack.categories.map(category=>({name:category.name,clues:category.clues.map(clue=>{
      const result={id:clue.id,q:clue.question,h:clue.hint,a:clue.answer,choices:clue.choices,allowReuse:clue.allowReuse};
      if(clue.followup){result.special=true;result.followupId=clue.followup.id;result.fq=clue.followup.question;result.fa=clue.followup.answer;result.fchoices=clue.followup.choices;result.fcorrect=clue.followup.correctChoice;result.followupAllowReuse=clue.followup.allowReuse}
      return result;
    })}))};
  }
  function adaptClassic(pack){return {id:pack.id,name:pack.name,genre:pack.genre,title:pack.title,subtitle:pack.subtitle,rules:pack.rules||{},categories:pack.categories}}
  function loadSync(url,mode){
    const request=new XMLHttpRequest();
    request.open("GET",url,false);request.send(null);
    if(request.status<200||request.status>=300)throw new Error(`Could not load question pack (${request.status})`);
    const pack=JSON.parse(request.responseText);
    return mode==="timeline"?adaptTimeline(pack):mode==="classic"?adaptClassic(pack):pack;
  }
  window.WHF_JSON_PACKS=Object.freeze({loadSync,adaptTimeline,adaptClassic});
})();
