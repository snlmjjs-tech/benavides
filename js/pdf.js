/* ---------- recibo ---------- */
function reciboTexto(p){
  const e=S.emisor||{};
  return {
    em:e.nombre||"Emisor sin configurar", emRut:e.rut||"", emDir:e.direccion||"", emCont:[e.telefono,e.email].filter(Boolean).join(" · "), firmante:e.firmante||e.nombre||"",
    cuerpo:`Recibí de ${p.arrendatario||"—"}${p.rutArrendatario?", RUT "+p.rutArrendatario:""}, la suma de ${clp(p.monto)} (${numLetras(p.monto)} pesos), por concepto de ${(p.concepto||"arriendo mensual").toLowerCase()} de la propiedad ubicada en ${p.direccion||"—"}${p.comuna?", comuna de "+p.comuna:""}, correspondiente al mes de ${fperiod(p.periodo)}.`
  };
}
function verRecibo(p){
  const t=reciboTexto(p);
  const body=`<div class="recibo">
    <div class="top"><div class="em"><img src="${LOGO}" alt=""><div><b>${esc(t.em)}</b><div class="sub">${esc([t.emRut&&"RUT "+t.emRut,t.emDir].filter(Boolean).join(" · "))}</div><div class="sub">${esc(t.emCont)}</div></div></div>
    <div class="nro"><small>Recibo de arriendo</small><b>${esc(nro(p.numero))}</b></div></div>
    <div><div class="sub">Fecha de pago ${esc(fdate(p.fecha))} · ${esc(p.medio||"")}</div><div class="monto">${esc(clp(p.monto))}</div></div>
    <p>${esc(t.cuerpo)}</p>
    ${p.obs?`<p class="sub">Observaciones: ${esc(p.obs)}</p>`:""}
    <div class="firma"><div>${esc(t.firmante)}<br><span class="sub">Recibí conforme</span></div></div>
  </div>${S.emisor&&S.emisor.nombre?"":'<div class="banner">Completa los datos del emisor en «Datos del emisor» para que aparezcan en el recibo.</div>'}<div class="err" id="frmErr" hidden></div>`;
  openModal("Recibo "+nro(p.numero),body,`<button class="btn" data-act="close">Cerrar</button><button class="btn primary" data-act="rec-pdf" data-id="${esc(p.id)}"${downloads?"":" disabled title='La descarga no está disponible en esta vista'"}>Descargar PDF</button>`,true);
}
function reciboPDF(p){
  const J=window.jspdf&&window.jspdf.jsPDF; if(!J)throw new Error("No se pudo cargar el generador de PDF.");
  const t=reciboTexto(p), doc=new J({orientation:"landscape",unit:"mm",format:"a5"}), W=210;
  const A=[15,30,61],G=[184,144,58];
  doc.setDrawColor(...G);doc.setLineWidth(0.6);doc.rect(8,8,W-16,132);
  try{doc.addImage(LOGO,"PNG",14,12,24,24)}catch(_){}
  doc.setFont("times","bold");doc.setFontSize(15);doc.setTextColor(...A);doc.text(t.em,42,20);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(93,106,112);
  let y=25;[t.emRut&&"RUT "+t.emRut,t.emDir,t.emCont].filter(Boolean).forEach(l=>{doc.text(l,42,y);y+=4.5});
  doc.setDrawColor(...G);doc.setLineWidth(0.8);doc.roundedRect(W-70,13,55,20,2,2);
  doc.setTextColor(...A);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text("RECIBO DE ARRIENDO",W-42.5,19.5,{align:"center"});
  doc.setFontSize(14);doc.text(nro(p.numero),W-42.5,28,{align:"center"});
  doc.setDrawColor(...G);doc.setLineWidth(0.3);doc.line(15,42,W-15,42);
  doc.setTextColor(93,106,112);doc.setFont("helvetica","normal");doc.setFontSize(9);
  doc.text("Fecha de pago: "+fdate(p.fecha)+"    Medio: "+(p.medio||"—"),15,49);
  doc.setTextColor(28,38,48);doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text(clp(p.monto),15,59);
  doc.setFont("helvetica","normal");doc.setFontSize(10.5);
  const lines=doc.splitTextToSize(t.cuerpo,W-30);doc.text(lines,15,69,{lineHeightFactor:1.5});
  let yy=69+lines.length*5.6+3;
  if(p.obs){doc.setFontSize(9);doc.setTextColor(93,106,112);const ol=doc.splitTextToSize("Observaciones: "+p.obs,W-30);doc.text(ol,15,yy);}
  doc.setDrawColor(28,38,48);doc.setLineWidth(0.3);doc.line(W-85,122,W-20,122);
  doc.setTextColor(28,38,48);doc.setFontSize(9.5);doc.text(t.firmante,W-52.5,127,{align:"center"});
  doc.setTextColor(93,106,112);doc.setFontSize(8.5);doc.text("Recibí conforme",W-52.5,131.5,{align:"center"});
  return doc.output("blob");
}

