const fs=require('fs');
const path='outputs/dog-jeopardy.html';
let s=fs.readFileSync(path,'utf8');
s=s.replace(`.remote-room-qr{\n  width:108px;\n  height:108px;\n  flex:0 0 108px;`,` .remote-room-qr{\n  width:280px;\n  height:280px;\n  flex:0 0 280px;`);
s=s.replace(`  width:94px!important;\n  height:94px!important;`,`  width:258px!important;\n  height:258px!important;`);
s=s.replace(`    width:94,\n    height:94,`,`    width:258,\n    height:258,`);
fs.writeFileSync(path,s);
