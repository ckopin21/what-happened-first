const fs=require('fs');
const path=require('path');
const file=path.resolve(__dirname,'../outputs/classic-jeopardy.html');
const html=fs.readFileSync(file,'utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(!scripts.length)throw new Error('No inline script found');
scripts.forEach((code,i)=>{try{new Function(code)}catch(err){throw new Error(`Inline script ${i+1} syntax error: ${err.message}`)}});
const required=[
  'CLASSIC JEOPARDY','Confirm & Submit','Reveal Now','fuzzyMatch','participantIndices',
  'classic-jeopardy-','QRCode','Peer','applyScores','toggleJudgment','allSubmitted'
];
for(const needle of required){if(!html.includes(needle))throw new Error(`Missing required feature marker: ${needle}`)}
if(!/if\(allSubmitted\(\)\)/.test(html))throw new Error('Automatic reveal guard not found');
if(!/i!==activeChooser/.test(html))throw new Error('Chooser validation not found');
console.log('Classic Jeopardy audit passed');
