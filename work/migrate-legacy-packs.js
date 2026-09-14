#!/usr/bin/env node
"use strict";

// One-time mechanical migration. It preserves every installed question and
// only expands legacy compact field names into the JSON v1 content contract.
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,".."),catalog=path.join(root,"packs","catalog"),manifests=path.join(root,"packs","manifests");
function load(file,global){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});return sandbox.window[global]}
function write(file,value){fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`)}
function migrateTimeline(){
  const legacy=load(path.join(root,"packs","timeline","current.js"),"TIMELINE_JEOPARDY_PACK");
  const id="timeline-general-knowledge-v3",pack={schemaVersion:1,id,name:legacy.name,genre:legacy.genre,answerType:"timeline",title:legacy.title,subtitle:legacy.subtitle,rules:legacy.rules||{},categories:legacy.categories.map(category=>({name:category.name,clues:category.clues.map((clue,index)=>{const out={id:clue.id,value:(index+1)*100,question:clue.q,answer:clue.a,aliases:[clue.a],hint:clue.h,choices:clue.choices};if(clue.special)out.followup={id:clue.followupId,question:clue.fq,answer:clue.fa,aliases:[clue.fa],hint:"Follow-up question",choices:clue.fchoices};return out})}))};
  write(path.join(catalog,`${id}.json`),pack);return{id,name:pack.name,genre:pack.genre,answerType:pack.answerType,file:`../catalog/${id}.json`};
}
function migrateClassic(){
  const legacy=load(path.join(root,"packs","classic","current.js"),"CLASSIC_JEOPARDY_PACK");
  const id="classic-general-knowledge-v3",pack={schemaVersion:1,id,name:legacy.name,genre:legacy.genre,answerType:"open-ended",title:legacy.title,subtitle:legacy.subtitle,rules:legacy.rules||{},categories:legacy.categories};
  write(path.join(catalog,`${id}.json`),pack);return{id,name:pack.name,genre:pack.genre,answerType:pack.answerType,file:`../catalog/${id}.json`};
}
fs.mkdirSync(catalog,{recursive:true});fs.mkdirSync(manifests,{recursive:true});
const timeline=migrateTimeline(),classic=migrateClassic();
write(path.join(manifests,"timeline.json"),{schemaVersion:1,mode:"timeline",defaultPackId:timeline.id,packs:[timeline]});
write(path.join(manifests,"classic.json"),{schemaVersion:1,mode:"classic",defaultPackId:classic.id,packs:[classic]});
console.log("Migrated legacy packs into JSON catalog.");
