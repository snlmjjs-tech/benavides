/* ---------- estado ---------- */
const S={propiedades:[],contribuciones:[],documentos:[],contratos:[],pagos:[],gastos:[],emisor:{},loaded:{}};
const COLS=["propiedades","contribuciones","documentos","contratos","pagos","gastos"];
/* Pega aquí la configuración de tu app web de Firebase (Consola → Configuración del proyecto → Tus apps) */
const FIREBASE_CONFIG={
  apiKey:"AIzaSyBQMgUFePamIOuU_O-PC0nW6hi2Qtca_2c",
  authDomain:"benavides-7dfa8.firebaseapp.com",
  projectId:"benavides-7dfa8",
  storageBucket:"benavides-7dfa8.firebasestorage.app",
  messagingSenderId:"253817951173",
  appId:"1:253817951173:web:05d23f2c8bcec8410271ac"
};
let db=null,assets=null,downloads=null,dbState="pending";
let view=(location.hash||"").slice(1)||"resumen";
const F={prop:"",anio:String(new Date().getFullYear()),q:"",cuantia:"",rep:"gastos",mes:"",desde:"",incContr:false};
const VIEWS=[["resumen","Resumen"],["propiedades","Propiedades"],["contribuciones","Contribuciones"],["documentos","Escrituras y documentos"],["contratos","Contratos de arriendo"],["pagos","Pagos y recibos"],["gastos","Gastos de mantención"],["informes","Informes"],["ajustes","Datos del emisor"]];
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clp=n=>{const v=Math.round(Number(n)||0);return (v<0?"-$":"$")+Math.abs(v).toLocaleString("es-CL")};
const uf=n=>"UF "+(Number(n)||0).toLocaleString("es-CL",{minimumFractionDigits:2,maximumFractionDigits:2});
const money=(n,m)=>m==="UF"?uf(n):clp(n);
const pad=n=>String(n).padStart(2,"0");
const todayISO=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const curPeriod=()=>todayISO().slice(0,7);
const fdate=s=>{if(!s)return "—";const [y,m,d]=s.split("-");return d?`${d}-${m}-${y}`:s};
const fperiod=p=>{if(!p)return "—";const [y,m]=p.split("-");return MESES[+m-1]+" "+y};
const daysTo=s=>Math.round((new Date(s+"T12:00:00")-new Date(todayISO()+"T12:00:00"))/864e5);
const nro=n=>"N° "+String(n||0).padStart(6,"0");
const byId=(col,id)=>S[col].find(x=>x.id===id);
const propName=id=>{const p=byId("propiedades",id);return p?(p.nombre||p.direccion):"(propiedad eliminada)"};
const exTag=o=>o&&o.ejemplo?'<span class="ex">ejemplo</span>':"";
const fileLink=o=>o&&(o.archivoUrl||o.archivoId)?`<a class="filelink" href="${esc(o.archivoUrl||"/_blob/"+o.archivoId)}" target="_blank" rel="noopener">${esc(o.archivoNombre||"Ver archivo")}</a>`:'<span class="sub">Sin archivo</span>';
function toast(msg,type){
  const r=$("#toastRoot"),el=document.createElement("div");
  el.className="toast"+(type==="err"?" err":"");el.setAttribute("role",type==="err"?"alert":"status");el.textContent=msg;
  while(r.children.length>=3)r.firstChild.remove();
  r.appendChild(el);
  setTimeout(()=>{el.classList.add("out");setTimeout(()=>el.remove(),220)},type==="err"?4200:2600);
}

function numLetras(n){
  n=Math.floor(Math.abs(Number(n)||0)); if(n===0)return "cero";
  const u=["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
  const d=["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
  const c=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
  const apo=s=>s.replace(/veintiuno$/,"veintiún").replace(/uno$/,"un");
  const cien=x=>{if(x===100)return "cien";const h=Math.floor(x/100),r=x%100;let s=h?c[h]:"";if(r)s+=(s?" ":"")+(r<30?u[r]:d[Math.floor(r/10)]+(r%10?" y "+u[r%10]:""));return s};
  const mil=x=>{const m=Math.floor(x/1000),r=x%1000;let s="";if(m)s=m===1?"mil":apo(cien(m))+" mil";if(r)s+=(s?" ":"")+cien(r);return s};
  const M=Math.floor(n/1e6),r=n%1e6;let s="";
  if(M)s=M===1?"un millón":apo(mil(M))+" millones";
  if(r)s+=(s?" ":"")+mil(r);
  s=apo(s);
  if(M&&!r)s+=" de";
  return s;
}


/* RUT chileno: módulo 11. Vacío es válido (campo opcional). */
function rutOk(r){
  r=String(r||"").replace(/[.\s]/g,"").toUpperCase();if(!r)return true;
  const m=r.match(/^(\d{1,8})-?([\dK])$/);if(!m)return false;
  let s=0,f=2;for(let i=m[1].length-1;i>=0;i--){s+=Number(m[1][i])*f;f=f===7?2:f+1}
  const d=11-(s%11),dv=d===11?"0":d===10?"K":String(d);return dv===m[2];
}
const emailOk=e=>!e||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const addDays=(iso,n)=>{const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
