#!/usr/bin/env node
"use strict";

// Validates content without loading either game engine. It is deliberately
// shared by both audits so a future pack replacement cannot bypass it.
const fs=require("fs"), path=require("path"), vm=require("vm");
const ROOT=path.resolve(__dirname,"..");
const DEFINITIONS={
  timeline:{pack:"packs/timeline/current.js",history:"packs/history/timeline-used.json",global:"TIMELINE_JEOPARDY_PACK"},
  classic:{pack:"packs/classic/current.js",history:"packs/history/classic-used.json",global:"CLASSIC_JEOPARDY_PACK"}
};

function clean(value){return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function words(value){
  const stop=new Set("a an the is are was were what which who where when why how of to in on for with from by as at it this that these those and or than do does did called name names first earlier later happened launch launched launched released release opened open began begin before after between into about across within every another".split(" "));
  return [...new Set(clean(value).split(" ").filter(word=>word.length>1&&!stop.has(word)))];
}
function fingerprint(question){return words(question).sort().join("|")}
function similar(a,b){
  const exact=clean(a)===clean(b); if(exact)return "exact";
  const one=words(a),two=words(b), set=new Set(two), common=one.filter(word=>set.has(word)).length;
  const score=common/Math.max(1,new Set([...one,...two]).size);
  const binaryA=/which happened first|which came first|before .*\bor\b|\bor\b.*before/.test(clean(a));
  const binaryB=/which happened first|which came first|before .*\bor\b|\bor\b.*before/.test(clean(b));
  if((score>=.72&&common>=2) || (binaryA&&binaryB&&score>=.55&&common>=2))return `near match (${Math.round(score*100)}% shared terms)`;
  return null;
}
function loadPack(kind,file){
  const def=DEFINITIONS[kind]; if(!def)throw new Error(`Unknown pack kind: ${kind}`);
  const source=fs.readFileSync(file||path.join(ROOT,def.pack),"utf8"), sandbox={window:{}};
  vm.runInNewContext(source,sandbox,{filename:file||def.pack,timeout:1000});
  return sandbox.window[def.global];
}
function loadHistory(kind){return JSON.parse(fs.readFileSync(path.join(ROOT,DEFINITIONS[kind].history),"utf8"))}
function issue(errors,message){errors.push(message)}
function fieldCheck(errors,obj,allowed,label){Object.keys(obj||{}).filter(key=>!allowed.has(key)).forEach(key=>issue(errors,`${label} has unsupported field '${key}'`))}
function hasText(value){return typeof value==="string"&&value.trim().length>0}

function recordsFor(kind,pack){
  const records=[];
  (pack.categories||[]).forEach(category=>(category.clues||[]).forEach(clue=>{
    if(kind==="timeline"){
      records.push({id:clue.id,question:clue.q,answer:clue.a,category:category.name,allowReuse:clue.allowReuse,followup:false});
      if(clue.special)records.push({id:clue.followupId,question:clue.fq,answer:clue.fa,category:category.name,allowReuse:clue.followupAllowReuse,followup:true});
    }else{
      records.push({id:clue.id,question:clue.question,answer:clue.answer,category:category.name,allowReuse:clue.allowReuse,followup:false});
      if(clue.followup)records.push({id:clue.followup.id,question:clue.followup.question,answer:clue.followup.answer,category:category.name,allowReuse:clue.followup.allowReuse,followup:true});
    }
  }));
  return records;
}

function validatePack(kind,pack,history){
  const errors=[], warnings=[], def=DEFINITIONS[kind];
  if(!pack||typeof pack!=="object"){issue(errors,`${kind} pack did not assign window.${def.global}`);return {errors,warnings,records:[]}}
  fieldCheck(errors,pack,new Set(["id","title","subtitle","genre","rules","categories"]),`${kind} pack`);
  if(!hasText(pack.id))issue(errors,`${kind} pack needs a stable id`);
  if(!Array.isArray(pack.categories)||pack.categories.length!==5)issue(errors,`${kind} pack must have exactly 5 categories`);
  const categoryNames=new Set();
  (pack.categories||[]).forEach((category,categoryIndex)=>{
    const label=`${kind} category ${categoryIndex+1}`;
    fieldCheck(errors,category,new Set(["name","clues"]),label);
    if(!hasText(category.name))issue(errors,`${label} needs a name`);
    if(categoryNames.has(clean(category.name)))issue(errors,`${label} duplicates category '${category.name}'`); categoryNames.add(clean(category.name));
    if(!Array.isArray(category.clues)||category.clues.length!==5)issue(errors,`${label} must have exactly 5 clues`);
    (category.clues||[]).forEach((clue,clueIndex)=>{
      const clueLabel=`${label}, clue ${clueIndex+1}`;
      const allowed=kind==="timeline"
        ?new Set(["id","q","h","a","choices","special","followupId","fq","fa","fchoices","fcorrect","allowReuse","followupAllowReuse"])
        :new Set(["id","value","question","answer","aliases","hint","followup","allowReuse"]);
      fieldCheck(errors,clue,allowed,clueLabel);
      if(!hasText(clue.id))issue(errors,`${clueLabel} needs a stable id`);
      if(clue.allowReuse!==undefined&&clue.allowReuse!==true)issue(errors,`${clueLabel}.allowReuse must be true when present`);
      if(kind==="timeline"){
        if(!hasText(clue.q)||!hasText(clue.h)||!hasText(clue.a))issue(errors,`${clueLabel} needs q, h, and a text`);
        if(!Array.isArray(clue.choices)||clue.choices.length!==2||clue.choices.some(choice=>!hasText(choice))||new Set(clue.choices.map(clean)).size!==2)issue(errors,`${clueLabel} needs exactly two distinct choices`);
        const answer=clean(clue.a).replace(/\bfirst\b/g,"").trim();
        if(Array.isArray(clue.choices)&&!clue.choices.some(choice=>answer.includes(clean(choice).replace(/\bfirst\b/g,"").trim())))issue(errors,`${clueLabel} answer must identify one of its choices`);
        const followFields=["followupId","fq","fa","fchoices","fcorrect"];
        if(clue.special){
          if(followFields.some(key=>clue[key]===undefined))issue(errors,`${clueLabel} special clue needs every follow-up field`);
          if(!hasText(clue.followupId)||!hasText(clue.fq)||!hasText(clue.fa)||!hasText(clue.fcorrect))issue(errors,`${clueLabel} follow-up needs id, question, answer, and correct answer`);
          if(!Array.isArray(clue.fchoices)||clue.fchoices.length!==4||new Set(clue.fchoices.map(clean)).size!==4)issue(errors,`${clueLabel} follow-up needs four distinct choices`);
          if(Array.isArray(clue.fchoices)&&!clue.fchoices.some(choice=>clean(choice)===clean(clue.fcorrect)))issue(errors,`${clueLabel} follow-up correct answer must be a choice`);
        }else if(followFields.some(key=>clue[key]!==undefined))issue(errors,`${clueLabel} has follow-up fields without special:true`);
      }else{
        if(!Number.isFinite(clue.value)||clue.value!==[100,200,300,400,500][clueIndex])issue(errors,`${clueLabel} must use value ${[100,200,300,400,500][clueIndex]}`);
        if(!hasText(clue.question)||!hasText(clue.answer)||!hasText(clue.hint))issue(errors,`${clueLabel} needs question, answer, and hint text`);
        if(!Array.isArray(clue.aliases)||!clue.aliases.length||clue.aliases.some(alias=>!hasText(alias)))issue(errors,`${clueLabel} needs non-empty aliases`);
        if(clue.followup){
          fieldCheck(errors,clue.followup,new Set(["id","question","answer","aliases","hint","allowReuse"]),`${clueLabel} follow-up`);
          if(!hasText(clue.followup.id)||!hasText(clue.followup.question)||!hasText(clue.followup.answer)||!hasText(clue.followup.hint))issue(errors,`${clueLabel} follow-up needs id, question, answer, and hint`);
          if(!Array.isArray(clue.followup.aliases)||!clue.followup.aliases.length)issue(errors,`${clueLabel} follow-up needs aliases`);
          if(clue.followup.allowReuse!==undefined&&clue.followup.allowReuse!==true)issue(errors,`${clueLabel} follow-up allowReuse must be true when present`);
        }
      }
    });
  });
  const records=recordsFor(kind,pack), ids=new Map();
  records.forEach(record=>{if(ids.has(record.id))issue(errors,`${kind} question id '${record.id}' is duplicated`);else ids.set(record.id,record)});
  for(let i=0;i<records.length;i++)for(let j=0;j<i;j++){
    const match=similar(records[i].question,records[j].question);
    if(match)issue(errors,`${kind} current pack has ${match}: '${records[i].question}' / '${records[j].question}'`);
  }
  const historyRecords=Array.isArray(history?.questions)?history.questions:[];
  historyRecords.forEach((record,index)=>{
    if(!hasText(record.id)||!hasText(record.question)||!hasText(record.answer)||!hasText(record.category)||!hasText(record.firstUsedPack))issue(errors,`${kind} history entry ${index+1} is malformed`);
  });
  records.forEach(record=>historyRecords.forEach(old=>{
    const self=old.id===record.id&&old.firstUsedPack===pack.id&&clean(old.question)===clean(record.question);
    if(self)return;
    const match=similar(record.question,old.question);
    if(match&&!record.allowReuse)issue(errors,`${kind} '${record.id}' reuses a historical question (${match}) from '${old.id}'. Set allowReuse:true only for an intentional exception.`);
    else if(match)warnings.push(`${kind} '${record.id}' intentionally reuses historical '${old.id}'`);
    if(old.id===record.id&&!self&&!record.allowReuse)issue(errors,`${kind} '${record.id}' changes a previously recorded stable id`);
  }));
  return {errors,warnings,records};
}

function validateCurrentPacks(kinds=Object.keys(DEFINITIONS)){
  const result={errors:[],warnings:[],packs:{}};
  kinds.forEach(kind=>{const check=validatePack(kind,loadPack(kind),loadHistory(kind));result.errors.push(...check.errors);result.warnings.push(...check.warnings);result.packs[kind]=check});
  return result;
}
function recordCurrent(kind){
  const historyPath=path.join(ROOT,DEFINITIONS[kind].history), history=loadHistory(kind), pack=loadPack(kind), check=validatePack(kind,pack,history);
  if(check.errors.length)throw new Error(check.errors.join("\n"));
  const known=new Set(history.questions.map(record=>`${record.id}\u0000${clean(record.question)}`));
  check.records.forEach(record=>{const key=`${record.id}\u0000${clean(record.question)}`;if(!known.has(key))history.questions.push({id:record.id,question:record.question,answer:record.answer,category:record.category,firstUsedPack:pack.id});});
  const temporary=`${historyPath}.tmp`; fs.writeFileSync(temporary,`${JSON.stringify(history,null,2)}\n`);fs.renameSync(temporary,historyPath);
}
function cli(){
  const args=process.argv.slice(2), selected=args.filter(arg=>arg==="timeline"||arg==="classic");
  if(args.includes("--record-current")){(selected.length?selected:Object.keys(DEFINITIONS)).forEach(recordCurrent);console.log("Question history recorded.");return}
  const result=validateCurrentPacks(selected.length?selected:Object.keys(DEFINITIONS));
  result.warnings.forEach(message=>console.warn(`WARNING: ${message}`));
  if(result.errors.length){result.errors.forEach(message=>console.error(`ERROR: ${message}`));process.exitCode=1;return}
  console.log(`Question packs valid: ${(selected.length?selected:Object.keys(DEFINITIONS)).join(", ")}.`);
}
if(require.main===module)cli();
module.exports={DEFINITIONS,clean,fingerprint,similar,loadPack,loadHistory,recordsFor,validatePack,validateCurrentPacks};
