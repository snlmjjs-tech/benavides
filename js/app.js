/* ---------- eventos ---------- */
document.addEventListener("click",async ev=>{
  const t=ev.target.closest("[data-act]"); if(!t)return;
  const a=t.dataset.act,id=t.dataset.id;
  if(a==="scrim"){if(ev.target===t)closeModal();return}
  try{
  switch(a){
    case "nav":closeModal();view=id;try{history.replaceState(null,"","#"+id)}catch(_){}render();window.scrollTo(0,0);break;
    case "close":closeModal();break;
    case "save":if(modalSave)await modalSave();break;
    case "prop-new":formPropiedad();break;
    case "prop-ver":verPropiedad(id);break;
    case "prop-edit":formPropiedad(byId("propiedades",id));break;
    case "prop-del":{const n=S.contratos.filter(k=>k.propiedadId===id).length+S.documentos.filter(d=>d.propiedadId===id).length;confirmar(`¿Eliminar la propiedad «${esc(propName(id))}»?${n?` Sus ${n} contratos y documentos quedarán sin propiedad asociada.`:""}`,()=>borrar("propiedades",id));break}
    case "con-new":if(!S.propiedades.length){toast("Primero agrega una propiedad");break}formCuota(null,{propiedadId:F.prop});break;
    case "con-gen":if(!S.propiedades.length){toast("Primero agrega una propiedad");break}formGenerarCuotas(id);break;
    case "con-edit":formCuota(byId("contribuciones",id));break;
    case "con-del":confirmar("¿Eliminar esta cuota de contribuciones?",()=>borrar("contribuciones",id));break;
    case "con-pay":{const q=byId("contribuciones",id);const nv=!q.pagada;await guardar("contribuciones",id,{...strip(q),pagada:nv,fechaPago:nv?todayISO():""});toast(nv?"Cuota marcada como pagada":"Cuota marcada como pendiente");break}
    case "doc-new":if(!S.propiedades.length){toast("Primero agrega una propiedad");break}closeModal();formDocumento(id?{propiedadId:id}:{propiedadId:F.prop});break;
    case "doc-edit":formDocumento(byId("documentos",id));break;
    case "doc-del":confirmar("¿Eliminar este documento? El archivo adjunto dejará de estar enlazado.",()=>borrar("documentos",id));break;
    case "ctr-new":if(!S.propiedades.length){toast("Primero agrega una propiedad");break}closeModal();formContrato(null,id);break;
    case "ctr-edit":formContrato(byId("contratos",id));break;
    case "ctr-del":confirmar("¿Eliminar este contrato? Los pagos registrados se conservan.",()=>borrar("contratos",id));break;
    case "pay-new":closeModal();formPago(null,id?{contratoId:id}:{});break;
    case "pay-edit":formPago(byId("pagos",id));break;
    case "pay-del":{const p=byId("pagos",id);confirmar(`¿Eliminar el pago ${esc(nro(p.numero))}? Su número de recibo no se reutilizará salvo que sea el último.`,()=>borrar("pagos",id));break}
    case "rec-ver":verRecibo(byId("pagos",id));break;
    case "rec-pdf":{const p=byId("pagos",id);if(!downloads)break;t.disabled=true;
      try{const blob=reciboPDF(p);await downloads.save({filename:`Recibo ${String(p.numero).padStart(6,"0")} - ${p.arrendatario} - ${p.periodo}.pdf`,data:blob});toast("Recibo descargado");}
      catch(e){if(!(e&&e.code==="declined")){const er=$("#frmErr");if(er){er.textContent=e.message||"No se pudo generar el PDF.";er.hidden=false}}}
      t.disabled=false;break}
    case "csv-pagos":{if(!downloads)break;const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
      const lines=[["Recibo","Fecha","Mes","Arrendatario","RUT","Propiedad","Dirección","Comuna","Monto","Medio","Observaciones"].map(q).join(";")].concat(fil(S.pagos).sort((a,b)=>a.numero-b.numero).map(p=>[p.numero,fdate(p.fecha),fperiod(p.periodo),p.arrendatario,p.rutArrendatario,p.propiedadNombre,p.direccion,p.comuna,p.monto,p.medio,p.obs].map(q).join(";")));
      try{await downloads.save({filename:"pagos-arriendo-"+todayISO()+".csv",data:"﻿"+lines.join("\r\n")});}catch(e){}break}
    case "gas-new":closeModal();formGasto(null,{propiedadId:id||F.prop});break;
    case "gas-edit":formGasto(byId("gastos",id));break;
    case "gas-ver":verGasto(id);break;
    case "gas-del":confirmar("¿Eliminar este gasto de mantención?",()=>borrar("gastos",id));break;
    case "it-add":$("#itBody").insertAdjacentHTML("beforeend",itemRow({clase:"Materiales",cant:1}));recalcItems();break;
    case "it-del":{const b=$("#itBody");if(b.children.length>1)t.closest("tr").remove();else b.innerHTML=itemRow({cant:1});recalcItems();break}
    case "rep-tab":F.rep=id;render();break;
    case "rep-pdf":case "rep-csv":{if(!downloads)break;const r=curReport();t.disabled=true;
      try{await downloads.save(a==="rep-pdf"?{filename:r.file+".pdf",data:reportPDF(r)}:{filename:r.file+".csv",data:reportCSV(r)});toast("Informe descargado")}
      catch(e){if(!(e&&e.code==="declined"))toast(e.message||"No se pudo generar el informe")}
      t.disabled=false;break}
    case "emisor-save":{const fd=new FormData($("#emForm"));const o={};fd.forEach((v,k)=>o[k]=String(v).trim());if(!db)throw new Error("Sin conexión");await db.doc("config/emisor").set(o);toast("Datos del emisor guardados");break}
    case "demo-clear":confirmar("¿Borrar todos los registros marcados como ejemplo?",async()=>{for(const c of COLS)for(const x of S[c].filter(x=>x.ejemplo))await borrar(c,x.id)});break;
  }}catch(e){toast(e.message||"Ocurrió un error")}
});
document.addEventListener("change",ev=>{
  if(ev.target.id==="fProp"){F.prop=ev.target.value;render()}
  if(ev.target.id==="fAnio"){F.anio=ev.target.value;render()}
  if(ev.target.id==="fCuantia"){F.cuantia=ev.target.value;render()}
  if(ev.target.id==="fMes"&&ev.target.value){F.mes=ev.target.value;render()}
  if(ev.target.id==="fDesde"&&ev.target.value){F.desde=ev.target.value;render()}
  if(ev.target.id==="fContr"){F.incContr=ev.target.checked;render()}
  if(ev.target.name==="g_cuantia"){const c=$("#g_cat"),cur=c.value,opts=ev.target.value==="mayor"?CAT_MAYOR:CAT_MENOR;c.innerHTML=opts.map(o=>`<option${o===cur?" selected":""}>${esc(o)}</option>`).join("")}
});
document.addEventListener("input",ev=>{if(ev.target.id==="fQ"){F.q=ev.target.value;render()}if(ev.target.closest&&ev.target.closest("#itBody"))recalcItems()});
F.mes=curPeriod();F.desde=curPeriod().slice(0,4)+"-01";
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&$("#modalRoot").innerHTML)closeModal()});
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(VIEWS.some(v=>v[0]===h)){view=h;render()}});

/* ---------- arranque ---------- */
render();
function loginHTML(){return `<div class="panel" style="max-width:380px;margin:60px auto;padding:24px;gap:12px"><h2 style="font-family:var(--f-display);margin:0">Ingresar</h2><form id="loginForm" class="grid" style="grid-template-columns:1fr"><div class="fld"><label for="lgE">Correo</label><input id="lgE" type="email" autocomplete="username" required></div><div class="fld"><label for="lgP">Contraseña</label><input id="lgP" type="password" autocomplete="current-password" required></div><div class="err" id="lgErr" hidden></div><button class="btn primary" type="submit">Entrar</button></form></div>`}
document.addEventListener("submit",async ev=>{
  if(ev.target.id!=="loginForm")return; ev.preventDefault();
  const err=$("#lgErr");
  try{await firebase.auth().signInWithEmailAndPassword($("#lgE").value.trim(),$("#lgP").value)}
  catch(e){err.textContent="Correo o contraseña incorrectos.";err.hidden=false}
});
function descargar({filename,data}){
  const blob=data instanceof Blob?data:new Blob([data],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function conectar(){
  const fs=firebase.firestore(),st=firebase.storage();
  db=fs;
  downloads={save:async o=>descargar(o)};
  assets={upload:async(file,{type})=>{
    const id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
    const ref=st.ref("archivos/"+id+"-"+file.name.replace(/[^\w.\-]+/g,"_"));
    await ref.put(file,{contentType:type});
    return {id,url:await ref.getDownloadURL()};
  }};
  dbState="ok";
  COLS.forEach(c=>{fs.collection(c).onSnapshot(snap=>{S[c]=snap.docs.map(d=>({id:d.id,...d.data()}));S.loaded[c]=true;render();},()=>{S.loaded[c]=true;render()})});
  fs.doc("config/emisor").onSnapshot(s=>{S.emisor=s.exists?s.data():{};render()},()=>{});
}
(function(){
  if(typeof firebase==="undefined"||/PEGAR/.test(FIREBASE_CONFIG.apiKey)){dbState="none";render();return}
  firebase.initializeApp(FIREBASE_CONFIG);
  let started=false;
  firebase.auth().onAuthStateChanged(u=>{
    if(u){if(!started){started=true;conectar()}}
    else{started=false;db=null;assets=null;dbState="login";render()}
  });
})();