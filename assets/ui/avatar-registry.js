/* Shared, asset-backed avatar catalog. Game engines store avatarId or index,
   but never duplicate emoji artwork lists. */
(function(){
  const base="../assets/avatars/";
  window.JEOPARDY_AVATARS=Object.freeze([
    {id:"corgi",name:"Corgi",src:`${base}corgi.svg?v=2`},
    {id:"cat",name:"Cat",src:`${base}cat.svg?v=2`},
    {id:"panda",name:"Panda",src:`${base}panda.svg?v=2`},
    {id:"penguin",name:"Penguin",src:`${base}penguin.svg?v=2`},
    {id:"fox",name:"Fox",src:`${base}fox.svg?v=2`},
    {id:"frog",name:"Frog",src:`${base}frog.svg?v=2`},
    {id:"shark",name:"Shark",src:`${base}shark.svg?v=2`},
    {id:"duck",name:"Duck",src:`${base}duck.png?v=3`}
  ]);
  window.JEOPARDY_AVATAR_BY_ID=Object.freeze(Object.fromEntries(window.JEOPARDY_AVATARS.map(avatar=>[avatar.id,avatar])));
})();
