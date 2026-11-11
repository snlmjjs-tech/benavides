const {open}=require("./harness"),fs=require("fs"),path=require("path");
const seed=fs.readFileSync(path.join(__dirname,"seed.js"),"utf8");
const out=process.env.OUT||"/tmp/claude-0/shots";fs.mkdirSync(out,{recursive:true});
const views=(process.env.VIEWS||"resumen").split(","),sizes={desktop:[1440,900],tablet:[820,1000],mobile:[390,844]};
(async()=>{for(const [name,[w,h]] of Object.entries(sizes)){
  if(process.env.SIZE&&process.env.SIZE!==name)continue;
  const t=await open({seed,viewport:{width:w,height:h}});const p=t.page;await p.waitForSelector(".kpis,.head");
  for(const v of views){await p.evaluate(v=>{location.hash=v},v);await p.waitForTimeout(700);await p.screenshot({path:`${out}/${v}-${name}.png`,fullPage:process.env.FULL==="1"})}
  if(t.errors.length)console.log(name,t.errors);await t.close()}})()
