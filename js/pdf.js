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
  const t=reciboTexto(p), doc=new J({orientation:"landscape",unit:"mm",format:"a5"}), W=210, H=148;
  const NAVY=[16,29,58],GOLD=[200,164,93],GOLD2=[232,214,165],INK=[23,36,59],MUTED=[113,128,150],PAPER=[255,253,248];
  doc.setFillColor(...PAPER);doc.rect(0,0,W,H,"F");
  /* banda de encabezado */
  doc.setFillColor(...NAVY);doc.rect(0,0,W,38,"F");
  doc.setFillColor(...GOLD);doc.rect(0,38,W,1.2,"F");
  try{doc.addImage(LOGO,"PNG",12,6,26,26)}catch(_){}
  doc.setFont("times","bold");doc.setFontSize(16);doc.setTextColor(...GOLD2);doc.text(t.em,43,15);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(190,198,216);
  let y=20.5;[t.emRut&&"RUT "+t.emRut,t.emDir,t.emCont].filter(Boolean).forEach(l=>{doc.text(l,43,y);y+=4.4});
  /* número */
  doc.setDrawColor(...GOLD);doc.setLineWidth(.7);doc.roundedRect(W-62,8,50,22,2,2);
  doc.setTextColor(...GOLD2);doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.text("RECIBO DE ARRIENDO",W-37,14.5,{align:"center"});
  doc.setFont("courier","bold");doc.setFontSize(15);doc.setTextColor(255,255,255);doc.text(nro(p.numero),W-37,23.5,{align:"center"});
  /* monto destacado */
  doc.setFillColor(247,245,239);doc.roundedRect(12,46,W-24,20,2,2,"F");
  doc.setDrawColor(...GOLD2);doc.setLineWidth(.3);doc.roundedRect(12,46,W-24,20,2,2);
  doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(...MUTED);doc.text("MONTO RECIBIDO",17,53);
  doc.setFontSize(21);doc.setTextColor(...NAVY);doc.text(clp(p.monto),17,62.5);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(...MUTED);
  doc.text("Fecha de pago",W-17,53,{align:"right"});doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(...INK);doc.text(fdate(p.fecha),W-17,60,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(...MUTED);doc.text(p.medio||"",W-17,64.5,{align:"right"});
  /* texto legal */
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(...INK);
  const lines=doc.splitTextToSize(t.cuerpo,W-24);doc.text(lines,12,76,{lineHeightFactor:1.55});
  let yy=76+lines.length*5.3+2;
  /* detalle del pago */
  if(typeof doc.autoTable==="function"){
    doc.autoTable({startY:yy,margin:{left:12,right:12},theme:"plain",
      head:[["Concepto","Período","Propiedad","Monto"]],
      body:[[p.concepto||"Arriendo mensual",fperiod(p.periodo),(p.propiedadNombre||p.direccion||"—"),clp(p.monto)]],
      styles:{font:"helvetica",fontSize:8.5,cellPadding:{top:1.6,bottom:1.6,left:2,right:2},textColor:INK,lineColor:GOLD2,lineWidth:{bottom:.25}},
      headStyles:{textColor:MUTED,fontStyle:"bold",fontSize:7.5},columnStyles:{3:{halign:"right",fontStyle:"bold"}}});
    yy=doc.lastAutoTable.finalY+2;
  }
  if(p.obs){doc.setFontSize(8);doc.setTextColor(...MUTED);doc.text(doc.splitTextToSize("Observaciones: "+p.obs,W-24),12,Math.min(yy+3,112))}
  /* firma */
  doc.setDrawColor(...INK);doc.setLineWidth(.3);doc.line(W-86,123,W-16,123);
  doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(...INK);doc.text(t.firmante||"",W-51,127.5,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...MUTED);doc.text("Recibí conforme",W-51,131.5,{align:"center"});
  /* pie */
  doc.setFillColor(...GOLD);doc.rect(0,H-9,W,.6,"F");
  doc.setFontSize(7);doc.setTextColor(...MUTED);doc.text("Familia Benavides · Control de propiedades",12,H-4.5);doc.text("Recibo "+nro(p.numero)+" · emitido "+fdate(todayISO()),W-12,H-4.5,{align:"right"});
  return doc.output("blob");
}

