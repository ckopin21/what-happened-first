#!/usr/bin/env node
"use strict";

// One-time mechanical migration. It preserves every installed question and
// only expands legacy compact field names into the JSON v1 content contract.
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,".."),catalog=path.join(root,"packs","catalog"),manifests=path.join(root,"packs","manifests");
function load(file,global){
  const source=fs.readFileSync(file,"utf8"),match=source.match(/WHF_JSON_PACKS\.loadSync\("([^"\\]+)"/);
  if(match){
    const pack=JSON.parse(fs.readFileSync(path.resolve(root,"outputs",match[1]),"utf8"));
    if(pack.answerType==="open-ended")return pack;
    return {id:pack.id,name:pack.name,genre:pack.genre,title:pack.title,subtitle:pack.subtitle,rules:pack.rules,categories:pack.categories.map(category=>({name:category.name,clues:category.clues.map(clue=>({id:clue.id,q:clue.question,h:clue.hint,a:clue.answer,choices:clue.choices,special:!!clue.followup,followupId:clue.followup?.id,fq:clue.followup?.question,fa:clue.followup?.answer,fchoices:clue.followup?.choices,fcorrect:clue.followup?.correctChoice}))}))};
  }
  const sandbox={window:{}};vm.runInNewContext(source,sandbox,{filename:file});return sandbox.window[global];
}
function write(file,value){fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`)}
function migrateTimeline(){
  const legacy=load(path.join(root,"packs","timeline","current.js"),"TIMELINE_JEOPARDY_PACK");
  const id=legacy.id,pack={schemaVersion:1,id,name:legacy.name,genre:legacy.genre,answerType:"timeline",title:legacy.title,subtitle:legacy.subtitle,rules:legacy.rules||{},categories:legacy.categories.map(category=>({name:category.name,clues:category.clues.map((clue,index)=>{const out={id:clue.id,value:(index+1)*100,question:clue.q,answer:clue.a,aliases:[clue.a],hint:clue.h,choices:clue.choices};if(clue.special)out.followup={id:clue.followupId,question:clue.fq,answer:clue.fa,aliases:[clue.fa],hint:"Follow-up question",choices:clue.fchoices,correctChoice:clue.fcorrect};return out})}))};
  write(path.join(catalog,`${id}.json`),pack);return{id,name:pack.name,genre:pack.genre,answerType:pack.answerType,file:`../catalog/${id}.json`};
}
function migrateClassic(){
  const legacy=load(path.join(root,"packs","classic","current.js"),"CLASSIC_JEOPARDY_PACK");
  const id=legacy.id,pack={schemaVersion:1,id,name:legacy.name,genre:legacy.genre,answerType:"open-ended",title:legacy.title,subtitle:legacy.subtitle,rules:legacy.rules||{},categories:legacy.categories};
  write(path.join(catalog,`${id}.json`),pack);return{id,name:pack.name,genre:pack.genre,answerType:pack.answerType,file:`../catalog/${id}.json`};
}
fs.mkdirSync(catalog,{recursive:true});fs.mkdirSync(manifests,{recursive:true});
const timeline=migrateTimeline(),classic=migrateClassic();
const obsoleteClassic=path.join(catalog,"classic-general-knowledge-v3.json");if(classic.id!=="classic-general-knowledge-v3"&&fs.existsSync(obsoleteClassic))fs.unlinkSync(obsoleteClassic);
write(path.join(manifests,"timeline.json"),{schemaVersion:1,mode:"timeline",defaultPackId:timeline.id,packs:[timeline]});
write(path.join(manifests,"classic.json"),{schemaVersion:1,mode:"classic",defaultPackId:classic.id,packs:[classic]});
fs.writeFileSync(path.join(root,"packs","timeline","current.js"),`// Compatibility loader: production questions live in ../catalog/${timeline.id}.json\nwindow.TIMELINE_JEOPARDY_PACK=window.WHF_JSON_PACKS.loadSync(\"../packs/catalog/${timeline.id}.json\",\"timeline\");\nwindow.TIMELINE_QUESTION_PACKS=window.TIMELINE_QUESTION_PACKS||{};window.TIMELINE_QUESTION_PACKS[window.TIMELINE_JEOPARDY_PACK.id]=window.TIMELINE_JEOPARDY_PACK;\n`);
fs.writeFileSync(path.join(root,"packs","classic","current.js"),`// Compatibility loader: production questions live in ../catalog/${classic.id}.json\nwindow.CLASSIC_JEOPARDY_PACK=window.WHF_JSON_PACKS.loadSync(\"../packs/catalog/${classic.id}.json\",\"classic\");\nwindow.CLASSIC_QUESTION_PACKS=window.CLASSIC_QUESTION_PACKS||{};window.CLASSIC_QUESTION_PACKS[window.CLASSIC_JEOPARDY_PACK.id]=window.CLASSIC_JEOPARDY_PACK;\n`);
console.log("Migrated legacy packs into JSON catalog.");
