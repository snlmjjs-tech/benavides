/* Arnés de pruebas: sirve el proyecto, simula Firebase y entrega una página lista. */
const http=require("http"),fs=require("fs"),path=require("path");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"..");
const LIBS=process.env.PDF_LIBS||"/tmp/claude-0/cdn/node_modules";
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".json":"application/json"};
function serve(){return new Promise(r=>{const s=http.createServer((q,res)=>{let p=decodeURIComponent(q.url.split("?")[0]);if(p==="/")p="/index.html";const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});fs.createReadStream(f).pipe(res)}).listen(0,()=>r(s))})}
async function open(opts={}){
  const server=await serve(),port=server.address().port;
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:opts.viewport||{width:1440,height:900},acceptDownloads:true});
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push("pageerror: "+e.message));
  page.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|fonts\.g/.test(m.text()))errors.push("console: "+m.text())});
  await page.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({status:200,contentType:"text/javascript",body:""}));
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:"text/css",body:""}));
  await page.route(/cdnjs\.cloudflare\.com.*jspdf/,r=>r.fulfill({path:LIBS+"/jspdf/dist/jspdf.umd.min.js",contentType:"text/javascript"}));
  await page.route(/cdnjs\.cloudflare\.com.*jspdf-autotable/,r=>r.fulfill({path:LIBS+"/jspdf-autotable/dist/jspdf.plugin.autotable.min.js",contentType:"text/javascript"}));
  await page.addInitScript({path:path.join(__dirname,"mock-firebase.js")});
  if(opts.seed)await page.addInitScript(opts.seed);
  if(opts.loggedOut)await page.addInitScript("window.__loggedOut=true");
  await page.goto(`http://127.0.0.1:${port}/index.html`+(opts.hash||""));
  await page.waitForFunction(()=>window.dbState!==undefined||document.querySelector("#main")?.textContent.length>0);
  return {page,errors,close:async()=>{await browser.close();server.close()}};
}
module.exports={open};
