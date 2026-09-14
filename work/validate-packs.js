#!/usr/bin/env node
"use strict";

/* Pure-data validation for the v1 JSON contract. This intentionally has no
   dependency on a game engine, so CI and a future browser loader use the same
   content rules. */
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),catalog=path.join(root,"packs","catalog");
const errors=[],seenIds=new Set(),seenClues=new Set();
const historyFile=path.join(root,"packs","history","used-questions.json"),historyById=new Map();
function fail(file,message){errors.push(`${path.relative(root,file)}: ${message}`)}
function text(value){return typeof value==="string"&&value.trim().length>0}
function checkClue(file,clue,index,kind){
  const label=`clue ${index+1}`;
  if(!clue||typeof clue!=="object"){fail(file,`${label} must be an object`);return}
  for(const field of ["id","question","answer","hint"])if(!text(clue[field]))fail(file,`${label}.${field} is required`);
  if(!Number.isFinite(clue.value)||clue.value!==[100,200,300,400,500][index])fail(file,`${label}.value must be ${[100,200,300,400,500][index]}`);
  if(!Array.isArray(clue.aliases)||!clue.aliases.length||clue.aliases.some(alias=>!text(alias)))fail(file,`${label}.aliases must be a non-empty string array`);
  if(seenClues.has(clue.id))fail(file,`${label}.id '${clue.id}' is globally duplicated`);seenClues.add(clue.id);
  const historical=historyById.get(clue.id);if(historical&&historical!==clue.question)fail(file,`${label}.id '${clue.id}' changes permanent history`);
  if(kind==="timeline"&&(!Array.isArray(clue.choices)||clue.choices.length!==2||clue.choices.some(choice=>!text(choice))))fail(file,`${label}.choices must contain two readable choices`);
  if(clue.followup){const followup=clue.followup;if(!text(followup.id)||!text(followup.question)||!text(followup.answer)||!text(followup.hint)||!Array.isArray(followup.aliases)||!followup.aliases.length)fail(file,`${label}.followup is incomplete`);if(seenClues.has(followup.id))fail(file,`${label}.followup.id '${followup.id}' is globally duplicated`);seenClues.add(followup.id)}
}
if(fs.existsSync(historyFile)){
  let history;try{history=JSON.parse(fs.readFileSync(historyFile,"utf8"))}catch(error){fail(historyFile,`invalid JSON: ${error.message}`)}
  if(!Array.isArray(history?.questions))fail(historyFile,"questions must be an array");else for(const record of history.questions){if(!text(record?.id)||!text(record?.packId)||!text(record?.mode)||!text(record?.question)||!text(record?.answer)||!text(record?.category))fail(historyFile,"every record needs id, packId, mode, question, answer, and category");else if(historyById.has(record.id)&&historyById.get(record.id)!==record.question)fail(historyFile,`history id '${record.id}' has conflicting questions`);else historyById.set(record.id,record.question)}
}
function check(file){
  let pack;try{pack=JSON.parse(fs.readFileSync(file,"utf8"))}catch(error){fail(file,`invalid JSON: ${error.message}`);return}
  for(const field of ["schemaVersion","id","name","genre","answerType","title","subtitle","rules","categories"])if(pack[field]===undefined)fail(file,`missing ${field}`);
  if(pack.schemaVersion!==1)fail(file,"schemaVersion must be 1");if(!/^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*$/.test(pack.id||""))fail(file,"id must be a versioned slug");
  if(seenIds.has(pack.id))fail(file,`pack id '${pack.id}' is duplicated`);seenIds.add(pack.id);
  if(!["timeline","open-ended"].includes(pack.answerType))fail(file,"answerType must be timeline or open-ended");
  if(!Array.isArray(pack.categories)||pack.categories.length!==5){fail(file,"categories must contain exactly five entries");return}
  pack.categories.forEach((category,categoryIndex)=>{if(!text(category?.name))fail(file,`category ${categoryIndex+1}.name is required`);if(!Array.isArray(category?.clues)||category.clues.length!==5)fail(file,`category ${categoryIndex+1}.clues must contain five entries`);else category.clues.forEach((clue,index)=>checkClue(file,clue,index,pack.answerType))});
}
if(fs.existsSync(catalog))fs.readdirSync(catalog).filter(name=>name.endsWith(".json")).sort().forEach(name=>check(path.join(catalog,name)));
if(errors.length){errors.forEach(error=>console.error(`ERROR: ${error}`));process.exitCode=1}else console.log("JSON question packs valid.");
