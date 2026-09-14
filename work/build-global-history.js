#!/usr/bin/env node
"use strict";

// Mechanical, additive history migration. Legacy ledgers remain in place for
// compatibility; this produces the single cross-mode ledger for JSON packs.
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),history=path.join(root,"packs","history");
const entries=[];
for(const mode of ["timeline","classic"]){
  const source=JSON.parse(fs.readFileSync(path.join(history,`${mode}-used.json`),"utf8"));
  for(const question of source.questions||[])entries.push({id:question.id,packId:question.firstUsedPack,mode,question:question.question,answer:question.answer,category:question.category});
}
entries.sort((a,b)=>a.id.localeCompare(b.id));
fs.writeFileSync(path.join(history,"used-questions.json"),`${JSON.stringify({schemaVersion:1,questions:entries},null,2)}\n`);
console.log(`Wrote ${entries.length} permanent question-history records.`);
