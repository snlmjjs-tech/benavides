/* ---------- modal y formularios ---------- */
let modalSave=null;
function openModal(title,body,footer,wide){
  $("#modalRoot").innerHTML=`<div class="scrim" data-act="scrim"><div class="modal${wide?" wide":""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="btn ghost" data-act="close" aria-label="Cerrar">✕</button></header><div class="body">${body}</div>${footer?`<footer>${footer}</footer>`:""}</div></div>`;
  const first=$("#modalRoot input,#modalRoot select,#modalRoot textarea"); if(first)first.focus();
}
function closeModal(){$("#modalRoot").innerHTML="";modalSave=null}
function fieldHTML(f,v){
  const id="f_"+f.k, req=f.req?" required":"";
  let input;
  if(f.type==="select")input=`<select id="${id}" name="${f.k}"${req}>${f.options.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}"${String(v??"")===String(val)?" selected":""}>${esc(lab)}</option>`}).join("")}</select>`;
  else if(f.type==="textarea")input=`<textarea id="${id}" name="${f.k}">${esc(v)}</textarea>`;
  else if(f.type==="file")input=`<input id="${id}" name="${f.k}" type="file" accept="application/pdf,image/*">`;
  else if(f.type==="checkbox")return `<div class="fld${f.full?" full":""}"><label style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--ink)"><input id="${id}" name="${f.k}" type="checkbox" style="width:auto"${v?" checked":""}> ${esc(f.label)}</label></div>`;
  else input=`<input id="${id}" name="${f.k}" type="${f.type||"text"}"${f.step?` step="${f.step}"`:""}${f.min!=null?` min="${f.min}"`:""} value="${esc(v)}"${req}${f.ph?` placeholder="${esc(f.ph)}"`:""}>`;
  return `<div class="fld${f.full?" full":""}"><label for="${id}">${esc(f.label)}${f.req?" *":""}</label>${input}${f.hint?`<span class="hint">${f.hint}</span>`:""}</div>`;
}
function openForm(title,fields,init,onSave,extraTop){
  init=init||{};
  const body=`${extraTop||""}<form id="frm" class="grid" novalidate>${fields.map(f=>fieldHTML(f,init[f.k]??f.def??"")).join("")}</form><div class="err" id="frmErr" hidden></div>`;
  openModal(title,body,`<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="save" id="saveBtn">Guardar</button>`);
  modalSave=async()=>{
    const frm=$("#frm"),out={},err=$("#frmErr");
    for(const f of fields){
      const el=frm.elements[f.k];
      if(f.type==="file"){out[f.k]=el.files[0]||null;continue}
      if(f.type==="checkbox"){out[f.k]=el.checked;continue}
      let v=el.value.trim();
      if(f.req&&!v){err.textContent="Completa el campo «"+f.label+"».";err.hidden=false;el.focus();return}
      if(f.type==="number")v=v===""?null:Number(v);
      out[f.k]=v;
    }
    const b=$("#saveBtn");b.disabled=true;b.textContent="Guardando…";
    try{await onSave(out);closeModal();}
    catch(e){err.textContent=e.message||"No se pudo guardar.";err.hidden=false;b.disabled=false;b.textContent="Guardar";}
  };
}
function confirmar(texto,accion){
  openModal("Confirmar",`<p style="margin:0">${texto}</p><div class="err" id="frmErr" hidden></div>`,`<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="save" id="saveBtn" style="background:var(--bad);border-color:var(--bad)">Eliminar</button>`);
  modalSave=async()=>{try{await accion();closeModal();toast("Eliminado");}catch(e){$("#frmErr").textContent="No se pudo eliminar.";$("#frmErr").hidden=false;}};
}
const propOptions=(blank)=>[...(blank?[["",blank]]:[]),...S.propiedades.slice().sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(p=>[p.id,(p.nombre||p.direccion)+(p.comuna?" · "+p.comuna:"")])];
function strip(o){const r={...o};delete r.id;delete r.archivo;return r}

/* ---------- formularios por entidad ---------- */
function formPropiedad(p){
  openForm(p?"Editar propiedad":"Nueva propiedad",[
    {k:"nombre",label:"Nombre o alias",req:true,ph:"Casa Los Aromos"},
    {k:"tipo",label:"Tipo",type:"select",options:["Casa","Departamento","Local comercial","Oficina","Parcela / predio agrícola","Terreno","Bodega / estacionamiento","Otro"]},
    {k:"direccion",label:"Dirección",req:true,full:true},
    {k:"comuna",label:"Comuna",req:true},
    {k:"rol",label:"Rol de avalúo (SII)",ph:"123-45"},
    {k:"propietario",label:"Propietario"},
    {k:"rutPropietario",label:"RUT propietario",ph:"12.345.678-9"},
    {k:"avaluo",label:"Avalúo fiscal ($)",type:"number",min:0},
    {k:"superficie",label:"Superficie (m²)",type:"number",min:0,step:"any"},
    {k:"notas",label:"Notas",type:"textarea",full:true}
  ],p,async v=>{await guardar("propiedades",p&&p.id,{...strip(p||{}),...v});toast(p?"Propiedad actualizada":"Propiedad agregada")});
}
function formCuota(q,preset){
  const y=new Date().getFullYear();
  openForm(q?"Editar cuota de contribuciones":"Nueva cuota de contribuciones",[
    {k:"propiedadId",label:"Propiedad",type:"select",options:propOptions(),req:true,full:true},
    {k:"anio",label:"Año",type:"number",req:true,def:y},
    {k:"cuota",label:"Cuota",type:"select",options:[["1","1ª — abril"],["2","2ª — junio"],["3","3ª — septiembre"],["4","4ª — noviembre"]]},
    {k:"monto",label:"Monto ($)",type:"number",req:true,min:0},
    {k:"vencimiento",label:"Vencimiento",type:"date",req:true},
    {k:"pagada",label:"Pagada",type:"checkbox"},
    {k:"fechaPago",label:"Fecha de pago",type:"date"},
    {k:"folio",label:"Folio / comprobante TGR"}
  ],q||preset,async v=>{v.anio=Number(v.anio);v.cuota=Number(v.cuota);if(v.pagada&&!v.fechaPago)v.fechaPago=todayISO();await guardar("contribuciones",q&&q.id,{...strip(q||{}),...v});toast("Cuota guardada")});
}
function formGenerarCuotas(propId){
  const y=new Date().getFullYear();
  openForm("Generar las 4 cuotas del año",[
    {k:"propiedadId",label:"Propiedad",type:"select",options:propOptions(),req:true,full:true},
    {k:"anio",label:"Año",type:"number",req:true,def:y},
    {k:"montoAnual",label:"Monto anual ($)",type:"number",req:true,min:0,hint:"Se divide en 4 cuotas iguales con vencimiento el último día de abril, junio, septiembre y noviembre."}
  ],{propiedadId:propId||F.prop||""},async v=>{
    const anio=Number(v.anio),total=Math.round(Number(v.montoAnual)||0),base=Math.floor(total/4);
    const ya=S.contribuciones.filter(c=>c.propiedadId===v.propiedadId&&Number(c.anio)===anio);
    if(ya.length)throw new Error("Esa propiedad ya tiene cuotas registradas para "+anio+". Edítalas desde la tabla.");
    for(let i=0;i<4;i++){
      await guardar("contribuciones",null,{propiedadId:v.propiedadId,anio,cuota:i+1,monto:i===3?total-base*3:base,vencimiento:`${anio}-${CUOTAS[i][0]}-${CUOTAS[i][1]}`,pagada:false,fechaPago:"",folio:""});
    }
    F.anio=String(anio);toast("4 cuotas generadas");
  });
}
function formDocumento(d){
  openForm(d?"Editar documento":"Ingresar escritura o documento",[
    {k:"propiedadId",label:"Propiedad",type:"select",options:propOptions(),req:true,full:true},
    {k:"tipo",label:"Tipo de documento",type:"select",options:["Escritura de compraventa","Inscripción de dominio (CBR)","Certificado de dominio vigente","Certificado de hipotecas y gravámenes","Certificado de avalúo fiscal","Posesión efectiva","Plano / subdivisión","Otro"]},
    {k:"fecha",label:"Fecha de la escritura",type:"date"},
    {k:"notaria",label:"Notaría",full:true,ph:"Notaría de San Fernando de …"},
    {k:"repertorio",label:"N° de repertorio"},
    {k:"conservador",label:"Conservador de Bienes Raíces",ph:"CBR de San Fernando"},
    {k:"fojas",label:"Fojas"},
    {k:"numero",label:"Número de inscripción"},
    {k:"anioInsc",label:"Año de inscripción",type:"number"},
    {k:"archivo",label:d&&d.archivoId?"Reemplazar archivo (opcional)":"Archivo digital (PDF o imagen)",type:"file",full:true,hint:d&&d.archivoId?"Archivo actual: "+esc(d.archivoNombre):"Hasta 20 MB."},
    {k:"notas",label:"Notas",type:"textarea",full:true}
  ],d,async v=>{const f=v.archivo;const up=f?await subir(f):{};await guardar("documentos",d&&d.id,{...strip(d||{}),...strip(v),...up});toast("Documento guardado")});
}
function formContrato(k,propId){
  openForm(k?"Editar contrato":"Nuevo contrato de arriendo",[
    {k:"propiedadId",label:"Propiedad",type:"select",options:propOptions(),req:true,full:true},
    {k:"arrendatario",label:"Arrendatario",req:true},
    {k:"rut",label:"RUT arrendatario",ph:"12.345.678-9"},
    {k:"telefono",label:"Teléfono"},
    {k:"email",label:"Correo",type:"email"},
    {k:"inicio",label:"Inicio",type:"date",req:true},
    {k:"termino",label:"Término",type:"date",hint:"Déjalo vacío si es indefinido."},
    {k:"canon",label:"Renta mensual",type:"number",req:true,min:0,step:"any"},
    {k:"moneda",label:"Moneda",type:"select",options:[["CLP","Pesos (CLP)"],["UF","UF"]]},
    {k:"diaPago",label:"Día de pago",type:"number",min:1,def:5},
    {k:"garantia",label:"Garantía ($)",type:"number",min:0},
    {k:"reajuste",label:"Reajuste",type:"select",options:["Sin reajuste","IPC semestral","IPC anual","En UF"]},
    {k:"archivo",label:k&&k.archivoId?"Reemplazar contrato firmado (opcional)":"Contrato firmado (PDF o imagen)",type:"file",full:true,hint:k&&k.archivoId?"Archivo actual: "+esc(k.archivoNombre):"Hasta 20 MB."},
    {k:"notas",label:"Notas",type:"textarea",full:true}
  ],k||{propiedadId:propId||F.prop||""},async v=>{const f=v.archivo;const up=f?await subir(f):{};v.diaPago=Number(v.diaPago)||5;await guardar("contratos",k&&k.id,{...strip(k||{}),...strip(v),...up});toast("Contrato guardado")});
}
function formPago(p,preset){
  if(!S.contratos.length){toast("Primero registra un contrato de arriendo");return}
  const opts=S.contratos.slice().sort((a,b)=>estadoContrato(b).vig-estadoContrato(a).vig).map(k=>[k.id,k.arrendatario+" — "+propName(k.propiedadId)+(estadoContrato(k).vig?"":" (terminado)")]);
  const init=p||{fecha:todayISO(),periodo:curPeriod(),medio:"Transferencia",...preset};
  if(!p&&init.contratoId&&init.monto==null){const k=byId("contratos",init.contratoId);if(k&&k.moneda!=="UF")init.monto=k.canon}
  openForm(p?"Editar pago "+nro(p.numero):"Registrar pago de arriendo",[
    {k:"contratoId",label:"Contrato",type:"select",options:opts,req:true,full:true},
    {k:"periodo",label:"Mes que se paga",type:"month",req:true},
    {k:"fecha",label:"Fecha de pago",type:"date",req:true},
    {k:"monto",label:"Monto recibido ($)",type:"number",req:true,min:0,hint:"Si la renta está en UF, ingresa el equivalente en pesos del día de pago."},
    {k:"medio",label:"Medio de pago",type:"select",options:["Transferencia","Depósito","Efectivo","Cheque","Otro"]},
    {k:"concepto",label:"Concepto",def:"Arriendo mensual",full:true},
    {k:"obs",label:"Observaciones",type:"textarea",full:true}
  ],init,async v=>{
    const k=byId("contratos",v.contratoId),pr=k&&byId("propiedades",k.propiedadId);
    if(!p&&pagoDelPeriodo(v.contratoId,v.periodo))throw new Error("Ya existe un pago registrado para "+fperiod(v.periodo)+" en este contrato.");
    const snap={propiedadId:k?k.propiedadId:"",arrendatario:k?k.arrendatario:"",rutArrendatario:k?k.rut||"":"",direccion:pr?pr.direccion:"",comuna:pr?pr.comuna:"",propiedadNombre:pr?pr.nombre:""};
    const data={...strip(p||{}),...v,...snap,numero:p?p.numero:nextNro()};
    if(p){await guardar("pagos",p.id,data);toast("Pago actualizado")}
    else{const ref=db.collection("pagos").doc();await ref.set(data).catch(()=>{throw new Error("No se pudo guardar el pago.")});toast("Pago registrado · recibo "+nro(data.numero));setTimeout(()=>verRecibo({...data,id:ref.id}),50)}
  });
}

