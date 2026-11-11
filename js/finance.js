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

