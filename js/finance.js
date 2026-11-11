/* ---------- reglas de negocio ---------- */
function estadoContrato(k){
  const t=todayISO();
  if(k.inicio&&k.inicio>t)return {c:"acc",t:"Por iniciar",vig:false};
  if(k.termino&&k.termino<t)return {c:"",t:"Terminado",vig:false};
  if(k.termino&&daysTo(k.termino)<=60)return {c:"warn",t:"Vence en "+daysTo(k.termino)+" días",vig:true};
  return {c:"ok",t:"Vigente",vig:true};
}
const vigentes=()=>S.contratos.filter(k=>estadoContrato(k).vig);
function contratoDe(propId){return S.contratos.find(k=>k.propiedadId===propId&&estadoContrato(k).vig)}
function estadoCuota(q){
  if(q.pagada)return {c:"ok",t:"Pagada"};
  if(!q.vencimiento)return {c:"",t:"Pendiente"};
  const d=daysTo(q.vencimiento);
  if(d<0)return {c:"bad",t:"Vencida"};
  if(d<=30)return {c:"warn",t:"Vence en "+d+" días"};
  return {c:"",t:"Por pagar"};
}
function pagoDelPeriodo(kid,per){return S.pagos.find(p=>p.contratoId===kid&&p.periodo===per)}
function estadoArriendo(k,per){
  const p=pagoDelPeriodo(k.id,per);
  if(p)return {c:"ok",t:"Pagado",p};
  const dia=Number(k.diaPago)||5;
  if(per<curPeriod()||(per===curPeriod()&&new Date().getDate()>dia))return {c:"bad",t:"Atrasado"};
  return {c:"warn",t:"Pendiente"};
}
const nextNro=()=>S.pagos.reduce((m,p)=>Math.max(m,Number(p.numero)||0),0)+1;
const CUOTAS=[["04","30"],["06","30"],["09","30"],["11","30"]];


/* ---------- cálculos financieros (funciones puras sobre el estado S) ---------- */
const sum=(a,f)=>a.reduce((s,x)=>s+(Number(typeof f==="function"?f(x):x[f])||0),0);
const cargoPropietario=g=>g.cargo!=="Arrendatario";   // solo estos restan del resultado del propietario
const ymOf=s=>(s||"").slice(0,7);
const addMonths=(ym,n)=>{let [y,m]=ym.split("-").map(Number);m+=n;y+=Math.floor((m-1)/12);m=((m-1)%12+12)%12+1;return y+"-"+pad(m)};
/* Cobranza de un período: contratado vs cobrado vs pendiente vs atrasado. CLP y UF nunca se suman entre sí. */
function cobranza(per){
  const rows=vigentes().map(k=>({k,e:estadoArriendo(k,per)}));
  const pagados=rows.filter(r=>r.e.p),atrasados=rows.filter(r=>!r.e.p&&r.e.c==="bad"),pendientes=rows.filter(r=>!r.e.p&&r.e.c!=="bad");
  const tot=a=>({clp:sum(a.filter(r=>r.k.moneda!=="UF"),r=>r.k.canon),uf:sum(a.filter(r=>r.k.moneda==="UF"),r=>r.k.canon),n:a.length});
  const cobrado=S.pagos.filter(p=>p.periodo===per);
  return {rows,contratado:tot(rows),pendiente:tot(pendientes),atrasado:tot(atrasados),cobradoClp:sum(cobrado,"monto"),cobradoN:cobrado.length,pagados,atrasados,pendientes};
}
/* Flujo de caja de un mes (por fecha de pago/gasto): ingresos − egresos del propietario − contribuciones pagadas. */
function flujoMes(ym){
  const I=sum(S.pagos.filter(p=>ymOf(p.fecha)===ym),"monto");
  const G=sum(S.gastos.filter(g=>cargoPropietario(g)&&ymOf(g.fecha)===ym),"monto");
  const C=sum(S.contribuciones.filter(q=>q.pagada&&ymOf(q.fechaPago)===ym),"monto");
  return {I,G,C,E:G+C,neto:I-G-C};
}
const serieMeses=(hasta,n)=>Array.from({length:n},(_,i)=>{const ym=addMonths(hasta,i-n+1),f=flujoMes(ym);return {ym,m:mesCortoYM(ym),I:f.I,E:f.E}});
const mesCortoYM=ym=>MESES[+ym.slice(5,7)-1].slice(0,3)+" "+ym.slice(2,4);
function balanceAnio(y){
  const ms=Array.from({length:12},(_,i)=>flujoMes(y+"-"+pad(i+1)));
  const I=sum(ms,"I"),G=sum(ms,"G"),C=sum(ms,"C");
  const arr=sum(S.gastos.filter(g=>!cargoPropietario(g)&&(g.fecha||"").startsWith(y)),"monto");
  return {I,G,C,E:G+C,neto:I-G-C,gastosArrendatario:arr};
}
function vencimientos(){
  const out=[];
  S.contribuciones.filter(q=>!q.pagada&&q.vencimiento).forEach(q=>out.push({f:q.vencimiento,d:daysTo(q.vencimiento),tipo:"Contribución",t:propName(q.propiedadId),s:`Cuota ${q.cuota}/${q.anio} · ${clp(q.monto)}`,act:"con-pay",lab:"Marcar pagada",id:q.id}));
  S.contratos.filter(k=>{const e=estadoContrato(k);return e.vig&&k.termino&&daysTo(k.termino)<=90}).forEach(k=>out.push({f:k.termino,d:daysTo(k.termino),tipo:"Contrato",t:k.arrendatario,s:`Término de contrato · ${propName(k.propiedadId)}`,act:"ctr-edit",lab:"Renovar",id:k.id}));
  const per=curPeriod();
  vigentes().forEach(k=>{if(pagoDelPeriodo(k.id,per))return;const f=per+"-"+pad(Math.min(Number(k.diaPago)||5,28)),d=daysTo(f);if(d>=0&&d<=7)out.push({f,d,tipo:"Arriendo",t:k.arrendatario,s:`Pago esperado · ${money(k.canon,k.moneda)}`,act:"pay-new",lab:"Registrar",id:k.id})});
  return out.sort((a,b)=>a.f.localeCompare(b.f));
}
function actividad(n,propId){
  const a=[];
  S.pagos.forEach(p=>a.push({f:p.fecha,dir:"in",t:`Pago ${nro(p.numero)} · ${p.arrendatario}`,s:`${fperiod(p.periodo)} · ${propName(p.propiedadId)}`,m:clp(p.monto),act:"rec-ver",id:p.id,p:p.propiedadId}));
  S.gastos.forEach(g=>a.push({f:g.fecha,dir:"out",t:g.descripcion||"Gasto de mantención",s:`${g.categoria||""} · ${propName(g.propiedadId)}${cargoPropietario(g)?"":" · cargo arrendatario"}`,m:clp(g.monto),act:"gas-ver",id:g.id,p:g.propiedadId}));
  S.contribuciones.filter(q=>q.pagada&&q.fechaPago).forEach(q=>a.push({f:q.fechaPago,dir:"out",t:`Contribución cuota ${q.cuota}/${q.anio}`,s:propName(q.propiedadId),m:clp(q.monto),act:"con-edit",id:q.id,p:q.propiedadId}));
  return a.filter(x=>x.f&&(!propId||x.p===propId)).sort((x,y)=>y.f.localeCompare(x.f)).slice(0,n);
}
