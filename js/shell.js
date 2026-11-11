/* Carcasa de la aplicación: navegación, migas de pan, búsqueda global, menú móvil, tablas ordenables y paginadas. */
const NAV_GROUPS=[
  ["Principal",["resumen","propiedades"]],
  ["Finanzas",["contratos","pagos","contribuciones","gastos"]],
  ["Documentación",["documentos"]],
  ["Análisis",["informes"]],
  ["Configuración",["ajustes"]]
];
const NAV_LABEL={resumen:"Resumen",propiedades:"Propiedades",contribuciones:"Contribuciones",documentos:"Documentos",contratos:"Contratos",pagos:"Pagos y recibos",gastos:"Mantención",informes:"Informes",ajustes:"Datos del emisor"};
const PAGE_SIZE=20;

function navCounts(){
  const y=String(new Date().getFullYear()),vencidas=S.contribuciones.filter(q=>!q.pagada&&q.vencimiento&&daysTo(q.vencimiento)<0).length;
  return {propiedades:[S.propiedades.length],contribuciones:[S.contribuciones.filter(q=>!q.pagada).length,vencidas>0],documentos:[S.documentos.length],contratos:[vigentes().length],pagos:[S.pagos.length],gastos:[S.gastos.filter(g=>(g.fecha||"").slice(0,4)===y).length]};
}
function nav(){
  const cnt=navCounts();
  $("#nav").innerHTML=NAV_GROUPS.map(([g,ids])=>`<div class="grp">${g}</div>`+ids.map(k=>{const c=cnt[k];return `<button data-act="nav" data-id="${k}"${view===k?' aria-current="page"':""}>${ico(k)}<span class="l">${NAV_LABEL[k]}</span>${c&&c[0]?`<span class="count${c[1]?" alert":""}">${c[0]}</span>`:""}</button>`}).join("")).join("");
  $("#crumbs").innerHTML=`<span class="hide-sm">Familia Benavides</span>${ico("chevron").replace("<svg","<svg class=\"hide-sm\"")}<b>${NAV_LABEL[view]||"Resumen"}</b>`;
}
function renderUser(){
  const u=window.firebase&&firebase.auth&&firebase.auth().currentUser;
  $("#userBox").innerHTML=u?`<span>${esc(u.email||"Sesión iniciada")}</span><button class="btn small ghost" data-act="logout" title="Cerrar sesión">${ico("logout")}<span class="hide-sm">Salir</span></button>`:"";
}

/* ---- menú móvil ---- */
function setMenu(open){document.body.classList.toggle("nav-open",open);$("#menuBtn").setAttribute("aria-expanded",String(open))}
document.addEventListener("click",ev=>{
  if(ev.target.closest("#menuBtn")){setMenu(!document.body.classList.contains("nav-open"));return}
  if(document.body.classList.contains("nav-open")&&!ev.target.closest("aside"))setMenu(false);
  if(ev.target.closest("aside [data-act=nav]"))setMenu(false);
});

/* ---- búsqueda global ---- */
function searchAll(q){
  q=q.trim().toLowerCase();if(q.length<2)return [];
  const has=(...a)=>a.join(" ").toLowerCase().includes(q),out=[];
  S.propiedades.filter(p=>has(p.nombre,p.direccion,p.comuna,p.rol,p.propietario)).slice(0,5).forEach(p=>out.push({g:"Propiedades",t:p.nombre||p.direccion,s:[p.direccion,p.comuna].filter(Boolean).join(", "),a:"prop-ver",id:p.id}));
  S.contratos.filter(k=>has(k.arrendatario,k.rut,propName(k.propiedadId))).slice(0,5).forEach(k=>out.push({g:"Contratos",t:k.arrendatario,s:propName(k.propiedadId)+" · "+money(k.canon,k.moneda),a:"ctr-edit",id:k.id}));
  S.pagos.filter(p=>has(nro(p.numero),p.arrendatario,p.periodo,fperiod(p.periodo))).slice(0,5).forEach(p=>out.push({g:"Pagos y recibos",t:nro(p.numero)+" · "+p.arrendatario,s:fperiod(p.periodo)+" · "+clp(p.monto),a:"rec-ver",id:p.id}));
  S.gastos.filter(g=>has(g.descripcion,g.proveedor,g.categoria,g.nDoc)).slice(0,5).forEach(g=>out.push({g:"Gastos",t:g.descripcion,s:fdate(g.fecha)+" · "+clp(g.monto),a:"gas-ver",id:g.id}));
  S.documentos.filter(d=>has(d.tipo,d.notaria,d.repertorio,propName(d.propiedadId))).slice(0,4).forEach(d=>out.push({g:"Documentos",t:d.tipo,s:propName(d.propiedadId),a:"doc-edit",id:d.id}));
  return out;
}
let gsIdx=-1;
function renderSearch(){
  const q=$("#gSearch").value,box=$("#gRes");
  if(q.trim().length<2){box.hidden=true;return}
  const r=searchAll(q);gsIdx=r.length?0:-1;
  let last="";
  box.innerHTML=r.length?r.map((x,i)=>(x.g!==last?(last=x.g,`<h4>${x.g}</h4>`):"")+`<button data-gs="${i}" class="${i===0?"on":""}"><span><b class="t1">${esc(x.t)}</b><br><span class="sub">${esc(x.s)}</span></span></button>`).join(""):`<div class="none">Sin resultados para «${esc(q)}»</div>`;
  box.hidden=false;box._r=r;
}
function pickSearch(i){
  const box=$("#gRes"),x=box._r&&box._r[i];if(!x)return;
  box.hidden=true;$("#gSearch").value="";$("#gSearch").blur();
  const fake=document.createElement("button");fake.dataset.act=x.a;fake.dataset.id=x.id;document.body.appendChild(fake);fake.click();fake.remove();
}
document.addEventListener("input",ev=>{if(ev.target.id==="gSearch")renderSearch()});
document.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-gs]");if(b){pickSearch(+b.dataset.gs);return}
  if(!ev.target.closest(".gsearch"))$("#gRes").hidden=true;
});
document.addEventListener("keydown",ev=>{
  const inp=$("#gSearch"),box=$("#gRes");
  if((ev.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$("#modalRoot").innerHTML)||((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="k")){ev.preventDefault();inp.focus();inp.select();return}
  if(document.activeElement!==inp)return;
  const items=[...box.querySelectorAll("[data-gs]")];
  if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){ev.preventDefault();if(!items.length)return;gsIdx=(gsIdx+(ev.key==="ArrowDown"?1:-1)+items.length)%items.length;items.forEach((b,i)=>b.classList.toggle("on",i===gsIdx));items[gsIdx].scrollIntoView({block:"nearest"})}
  else if(ev.key==="Enter"&&gsIdx>=0){ev.preventDefault();pickSearch(gsIdx)}
  else if(ev.key==="Escape"){box.hidden=true;inp.blur()}
});

/* ---- tablas: orden por columna y paginación (se aplica sobre el DOM ya dibujado) ---- */
const SORT={};   // clave de tabla -> {col,dir}
const PAGE={};   // clave de tabla -> página
function cellValue(td){
  if(!td)return "";
  if(td.dataset.v!=null)return td.dataset.v;
  const t=td.textContent.trim();
  let m=t.match(/^(\d{2})-(\d{2})-(\d{4})/);if(m)return +(m[3]+m[2]+m[1]);
  m=t.match(/^-?\$\s?([\d.]+)/);if(m)return (t[0]==="-"?-1:1)*Number(m[1].replace(/\./g,""));
  m=t.match(/^N°\s*(\d+)/);if(m)return Number(m[1]);
  if(/^-?\d+([.,]\d+)?$/.test(t))return Number(t.replace(",","."));
  return t.toLowerCase();
}
function enhanceTables(){
  document.querySelectorAll("#main .panel table, #main .rsec table").forEach((tb,ti)=>{
    if(tb.closest(".items")||tb.closest(".sheet"))return;
    const body=tb.tBodies[0];if(!body||body.rows.length<2)return;
    const key=view+"|"+ti,heads=[...tb.tHead.rows[0].cells];
    heads.forEach((th,ci)=>{if(!th.textContent.trim())return;th.classList.add("sortable");th.dataset.col=ci;th.dataset.tk=key;th.setAttribute("tabindex","0");th.setAttribute("role","columnheader");
      const s=SORT[key];if(s&&s.col===ci){th.classList.add(s.dir>0?"sorted-asc":"sorted-desc");th.setAttribute("aria-sort",s.dir>0?"ascending":"descending")}});
    const s=SORT[key];
    if(s){const rows=[...body.rows];rows.sort((a,b)=>{const x=cellValue(a.cells[s.col]),y=cellValue(b.cells[s.col]);return (typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),"es",{numeric:true}))*s.dir});rows.forEach(r=>body.appendChild(r))}
    const pager=tb.closest(".panel").querySelector(":scope>.pager");if(pager)pager.remove();
    const total=body.rows.length,pages=Math.ceil(total/PAGE_SIZE);
    if(pages>1){
      const p=Math.min(PAGE[key]||0,pages-1);PAGE[key]=p;
      [...body.rows].forEach((r,i)=>r.hidden=i<p*PAGE_SIZE||i>=(p+1)*PAGE_SIZE);
      tb.closest(".panel").insertAdjacentHTML("beforeend",`<div class="pager" data-tk="${key}"><span>${p*PAGE_SIZE+1}–${Math.min(total,(p+1)*PAGE_SIZE)} de ${total}</span><span class="toolbar"><button class="btn small" data-pg="-1"${p===0?" disabled":""}>Anterior</button><span>Página ${p+1} de ${pages}</span><button class="btn small" data-pg="1"${p===pages-1?" disabled":""}>Siguiente</button></span></div>`);
    }
  });
}
function sortClick(th){
  const key=th.dataset.tk,col=+th.dataset.col,s=SORT[key];
  SORT[key]=s&&s.col===col?{col,dir:-s.dir}:{col,dir:1};PAGE[key]=0;render();
}
document.addEventListener("click",ev=>{
  const th=ev.target.closest("th.sortable");if(th){sortClick(th);return}
  const pg=ev.target.closest("[data-pg]");if(pg){const key=pg.closest(".pager").dataset.tk;PAGE[key]=(PAGE[key]||0)+Number(pg.dataset.pg);render()}
});
document.addEventListener("keydown",ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target.matches&&ev.target.matches("th.sortable")){ev.preventDefault();sortClick(ev.target)}});
