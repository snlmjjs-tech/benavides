/* Ejecuta toda la suite: node tests/run.js  (requiere playwright; PDF_LIBS apunta a node_modules con jspdf y jspdf-autotable) */
const {spawnSync}=require("child_process"),fs=require("fs"),path=require("path");
const files=fs.readdirSync(__dirname).filter(f=>/(smoke|\.test)\.js$/.test(f)).sort();let bad=0;
for(const f of files){console.log("\n=== "+f+" ===");const r=spawnSync("node",[path.join(__dirname,f)],{stdio:"inherit",env:process.env});if(r.status!==0)bad++}
console.log(bad?`\n${bad} archivo(s) con fallas`:"\nSUITE COMPLETA OK");process.exit(bad?1:0);
