/* ---------- vistas ---------- */
const head=(t,p,tools)=>`<div class="head"><div><h1>${t}</h1>${p?`<p>${p}</p>`:""}</div><div class="toolbar">${tools||""}</div></div>`;
const propFilter=()=>`<select class="f" id="fProp" aria-label="Filtrar por propiedad">${propOptions("Todas las propiedades").map(([v,l])=>`<option value="${esc(v)}"${F.prop===v?" selected":""}>${esc(l)}</option>`).join("")}</select>`;
const emptyBox=(t,s,btn,icon)=>`<div class="empty">${ico(icon||"box")}<b>${t}</b><span>${s}</span>${btn||""}</div>`;
const fil=arr=>F.prop?arr.filter(x=>x.propiedadId===F.prop):arr;

function vResumen(){
  const per=curPeriod(),cb=cobranza(per),y=String(new Date().getFullYear());
  const nProp=S.propiedades.length,arrendadas=S.propiedades.filter(p=>contratoDe(p.id)).length,ocup=nProp?Math.round(arrendadas/nProp*100):0;
  const pend=S.contribuciones.filter(q=>!q.pagada),vencidas=pend.filter(q=>q.vencimiento&&daysTo(q.vencimiento)<0);
  const fm=flujoMes(per),ba=balanceAnio(y),gAnio=S.gastos.filter(g=>(g.fecha||"").startsWith(y));
  const ufTxt=(o)=>o.uf?" + "+uf(o.uf):"";
  const pct=cb.contratado.n?Math.round(cb.pagados.length/cb.contratado.n*100):0;
  const venc=vencimientos(),act=actividad(8),serie=serieMeses(per,12),haySerie=serie.some(d=>d.I||d.E);
  const hayEj=COLS.some(c=>S[c].some(x=>x.ejemplo));
  const tot3=cb.pagados.length+cb.atrasados.length+cb.pendientes.length||1;
  const sg=n=>n<0?"neg":"pos";
  return head("Resumen",`${fperiod(per).replace(/^./,c=>c.toUpperCase())} · ${nProp} ${nProp===1?"propiedad":"propiedades"} en cartera`,`<button class="btn" data-act="gas-new">${ico("gastos")}Registrar gasto</button><button class="btn primary" data-act="pay-new">${ico("plus")}Registrar pago</button>`)+
  (hayEj?`<div class="banner">La cartera contiene registros de ejemplo. Bórralos desde «Datos del emisor».</div>`:"")+
  `<div class="kpis k6">
    <div class="kpi k-info"><span class="l">Propiedades</span><span class="v">${nProp}</span><div class="bar"><i style="width:${ocup}%"></i></div><span class="s">${arrendadas} arrendadas · ${nProp-arrendadas} disponibles · ${ocup}% ocupación</span></div>
    <div class="kpi"><span class="l">Ingreso contratado del mes</span><span class="v">${clp(cb.contratado.clp)}</span><span class="s">${ufTxt(cb.contratado).replace(/^ \+ /,"+ ")}${cb.contratado.uf?" · ":""}${cb.contratado.n} contratos vigentes</span></div>
    <div class="kpi k-ok"><span class="l">Cobrado del mes</span><span class="v">${clp(cb.cobradoClp)}</span><div class="bar ok"><i style="width:${pct}%"></i></div><span class="s">${cb.pagados.length} de ${cb.contratado.n} arriendos · ${pct}%</span></div>
    <div class="kpi ${cb.atrasados.length?"k-bad":"k-warn"}"><span class="l">Pendiente de cobro</span><span class="v">${(cb.pendiente.clp+cb.atrasado.clp)===0&&(cb.pendiente.uf+cb.atrasado.uf)>0?uf(cb.pendiente.uf+cb.atrasado.uf):clp(cb.pendiente.clp+cb.atrasado.clp)}</span><span class="s">${cb.atrasados.length?`<span class="pill bad mini">${cb.atrasados.length} atrasado${cb.atrasados.length>1?"s":""}</span> `:""}${cb.pendientes.length} por vencer${(cb.pendiente.clp+cb.atrasado.clp)>0&&(cb.pendiente.uf+cb.atrasado.uf)?" · + "+uf(cb.pendiente.uf+cb.atrasado.uf):""}</span></div>
    <div class="kpi ${fm.neto<0?"k-bad":"k-ok"}"><span class="l">Flujo de caja del mes</span><span class="v ${sg(fm.neto)}">${clp(fm.neto)}</span><span class="s">Ingresos ${clp(fm.I)} · egresos ${clp(fm.E)}</span></div>
    <div class="kpi"><span class="l">Contribuciones pendientes</span><span class="v">${clp(sum(pend,"monto"))}</span><span class="s">${vencidas.length?`<span class="pill bad mini">${vencidas.length} vencida${vencidas.length>1?"s":""}</span> `:""}${pend.length?pend.length+" cuota"+(pend.length>1?"s":""):"Al día"}</span></div>
  </div>
  <div class="cols wide">
    <section class="panel"><header><h2>Ingresos y egresos · últimos 12 meses</h2><span class="sub">Balance ${y}: <b class="${sg(ba.neto)}">${clp(ba.neto)}</b></span></header>
    ${haySerie?`<div class="chart">${chartSVG(serie)}</div><div class="pbody sub" style="padding-top:0">Egresos = mantención a cargo del propietario + contribuciones pagadas. Mantención ${y}: ${clp(gTot(gAnio))} (${clp(ba.gastosArrendatario)} a cargo de arrendatarios, no descontado).</div>`:emptyBox("Aún no hay movimientos","El gráfico aparece cuando registres pagos, gastos o contribuciones pagadas.",`<button class="btn primary" data-act="pay-new">Registrar pago</button>`,"informes")}
    </section>
    <section class="panel"><header><h2>Cobranza de ${fperiod(per)}</h2></header>
    ${cb.rows.length?`<div class="pbody"><div class="stack" role="img" aria-label="Cobrado ${cb.pagados.length}, pendiente ${cb.pendientes.length}, atrasado ${cb.atrasados.length}"><i style="width:${cb.pagados.length/tot3*100}%;background:var(--ok)"></i><i style="width:${cb.pendientes.length/tot3*100}%;background:#D4A02A"></i><i style="width:${cb.atrasados.length/tot3*100}%;background:var(--bad)"></i></div><div class="sub">Pagados ${cb.pagados.length} · pendientes ${cb.pendientes.length} · atrasados ${cb.atrasados.length}</div></div>
    <div class="list">${cb.rows.slice().sort((a,b)=>({bad:0,warn:1,ok:2}[a.e.c]-{bad:0,warn:1,ok:2}[b.e.c])).map(({k,e})=>`<div class="li"><div><div class="t1">${esc(k.arrendatario)}${exTag(k)}</div><div class="sub">${esc(propName(k.propiedadId))} · ${money(k.canon,k.moneda)} · día ${esc(k.diaPago||5)}</div></div><div class="toolbar"><span class="pill ${e.c}">${e.t}</span>${e.p?`<button class="btn small" data-act="rec-ver" data-id="${e.p.id}">Recibo</button>`:`<button class="btn small" data-act="pay-new" data-id="${k.id}">Registrar</button>`}</div></div>`).join("")}</div>`:emptyBox("Sin contratos vigentes","Registra un contrato para controlar sus pagos mensuales.",`<button class="btn" data-act="nav" data-id="contratos">Ir a contratos</button>`,"contratos")}
    </section>
  </div>
  <div class="cols">
    <section class="panel"><header><h2>Próximos vencimientos</h2><button class="btn small ghost" data-act="nav" data-id="contribuciones">Contribuciones ${ico("chevron")}</button></header>
    ${venc.length?`<div class="list">${venc.slice(0,8).map(v=>`<div class="li"><div><div class="t1">${esc(v.t)}</div><div class="sub">${esc(v.tipo)} · ${esc(v.s)} · ${fdate(v.f)}</div></div><div class="toolbar"><span class="pill ${v.d<0?"bad":v.d<=30?"warn":""}">${v.d<0?"Vencido hace "+(-v.d)+" d":v.d===0?"Hoy":"En "+v.d+" d"}</span><button class="btn small" data-act="${v.act}" data-id="${v.id}">${v.lab}</button></div></div>`).join("")}</div>`:emptyBox("Todo al día","No hay contribuciones, contratos ni cobros por vencer.","","contribuciones")}
    </section>
    <section class="panel"><header><h2>Actividad reciente</h2><button class="btn small ghost" data-act="nav" data-id="pagos">Pagos ${ico("chevron")}</button></header>
    ${act.length?`<ul class="timeline">${act.map(a=>`<li><span class="tl-dot ${a.dir}">${ico(a.dir==="in"?"inflow":"outflow")}</span><div style="flex:1;min-width:0"><div class="t1">${esc(a.t)}</div><div class="sub">${fdate(a.f)} · ${esc(a.s)}</div></div><button class="btn small ghost mono" data-act="${a.act}" data-id="${a.id}" style="align-self:center">${a.dir==="in"?"+":"−"}${esc(a.m)}</button></li>`).join("")}</ul>`:emptyBox("Aún no hay actividad","Los pagos, gastos y contribuciones pagadas aparecerán aquí.","","pagos")}
    </section>
  </div>`;
}
function vPropiedades(){
  const q=F.q.toLowerCase();
  const rows=S.propiedades.filter(p=>!q||[p.nombre,p.direccion,p.comuna,p.rol,p.propietario].join(" ").toLowerCase().includes(q)).sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));
  return head("Propiedades","Ficha de cada inmueble con su rol, contrato vigente y documentos.",`<input class="f" id="fQ" type="search" placeholder="Buscar por nombre, comuna o rol" value="${esc(F.q)}" aria-label="Buscar propiedad"><button class="btn primary" data-act="prop-new">Nueva propiedad</button>`)+
  `<section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Propiedad</th><th>Rol SII</th><th>Propietario</th><th>Estado</th><th class="num">Renta</th><th class="num">Avalúo fiscal</th></tr></thead><tbody>${rows.map(p=>{const k=contratoDe(p.id);return `<tr class="click" data-act="prop-ver" data-id="${p.id}"><td><div class="t1">${esc(p.nombre)}${exTag(p)}</div><div class="sub">${esc(p.tipo||"")} · ${esc(p.direccion)}, ${esc(p.comuna)}</div></td><td class="mono">${esc(p.rol||"—")}</td><td>${esc(p.propietario||"—")}</td><td>${k?`<span class="pill ok">Arrendada</span><div class="sub">${esc(k.arrendatario)}</div>`:'<span class="pill">Disponible</span>'}</td><td class="num">${k?money(k.canon,k.moneda):"—"}</td><td class="num">${p.avaluo?clp(p.avaluo):"—"}</td></tr>`}).join("")}</tbody></table></div>`:emptyBox(S.propiedades.length?"Sin resultados":"Aún no hay propiedades",S.propiedades.length?"Prueba con otro término de búsqueda.":"Agrega tu primera propiedad con su dirección y rol de avalúo.",S.propiedades.length?"":`<button class="btn primary" data-act="prop-new">Nueva propiedad</button>`)}</section>`;
}
function verPropiedad(id){
  const p=byId("propiedades",id); if(!p)return;
  const k=contratoDe(id), cs=S.contribuciones.filter(q=>q.propiedadId===id).sort((a,b)=>(b.vencimiento||"").localeCompare(a.vencimiento||"")).slice(0,8);
  const ds=S.documentos.filter(d=>d.propiedadId===id), ks=S.contratos.filter(c=>c.propiedadId===id), ps=S.pagos.filter(x=>x.propiedadId===id).sort((a,b)=>(b.numero||0)-(a.numero||0)).slice(0,6);
  const body=`<dl class="dl">
    <div><dt>Dirección</dt><dd>${esc(p.direccion)}, ${esc(p.comuna)}</dd></div><div><dt>Tipo</dt><dd>${esc(p.tipo||"—")}</dd></div>
    <div><dt>Rol SII</dt><dd class="mono">${esc(p.rol||"—")}</dd></div><div><dt>Propietario</dt><dd>${esc(p.propietario||"—")}${p.rutPropietario?`<div class="sub">${esc(p.rutPropietario)}</div>`:""}</dd></div>
    <div><dt>Avalúo fiscal</dt><dd>${p.avaluo?clp(p.avaluo):"—"}</dd></div><div><dt>Superficie</dt><dd>${p.superficie?esc(p.superficie)+" m²":"—"}</dd></div>
    <div><dt>Construida</dt><dd>${p.supConstruida?esc(p.supConstruida)+" m²":"—"}</dd></div><div><dt>Distribución</dt><dd>${[p.dormitorios!=null&&p.dormitorios!==""?p.dormitorios+" dorm.":"",p.banos!=null&&p.banos!==""?p.banos+" baños":"",p.estacionamientos?p.estacionamientos+" estac.":"",p.anioConstruccion?"año "+p.anioConstruccion:""].filter(Boolean).map(esc).join(" · ")||"—"}</dd></div>
    <div><dt>Estado</dt><dd>${k?`<span class="pill ok">Arrendada a ${esc(k.arrendatario)}</span>`:'<span class="pill">Disponible</span>'}</dd></div>
  </dl>${p.notas?`<p class="sub" style="margin:0">${esc(p.notas)}</p>`:""}
  <div class="sec">Escrituras y documentos <button class="btn small" data-act="doc-new" data-id="${id}">Agregar</button></div>
  <div class="panel">${ds.length?`<div class="list">${ds.map(d=>`<div class="li"><div><div class="t1">${esc(d.tipo)}</div><div class="sub">${esc([fdate(d.fecha),d.notaria,d.fojas&&"fs. "+d.fojas+" N° "+(d.numero||"")+" "+(d.anioInsc||"")].filter(x=>x&&x!=="—").join(" · "))}</div></div>${fileLink(d)}</div>`).join("")}</div>`:emptyBox("Sin documentos","Ingresa la escritura y la inscripción en el CBR.")}</div>
  <div class="sec">Contratos <button class="btn small" data-act="ctr-new" data-id="${id}">Agregar</button></div>
  <div class="panel">${ks.length?`<div class="list">${ks.map(c=>{const e=estadoContrato(c);return `<div class="li"><div><div class="t1">${esc(c.arrendatario)}</div><div class="sub">${fdate(c.inicio)} a ${c.termino?fdate(c.termino):"indefinido"} · ${money(c.canon,c.moneda)}</div></div><div class="toolbar"><span class="pill ${e.c}">${e.t}</span>${fileLink(c)}</div></div>`}).join("")}</div>`:emptyBox("Sin contratos","Esta propiedad no tiene contratos registrados.")}</div>
  <div class="sec">Contribuciones <button class="btn small" data-act="con-gen" data-id="${id}">Generar cuotas</button></div>
  <div class="panel">${cs.length?`<div class="list">${cs.map(q=>{const e=estadoCuota(q);return `<div class="li"><div><div class="t1">Cuota ${q.cuota}/${q.anio}</div><div class="sub">Vence ${fdate(q.vencimiento)}</div></div><div class="toolbar"><span class="mono">${clp(q.monto)}</span><span class="pill ${e.c}">${e.t}</span></div></div>`}).join("")}</div>`:emptyBox("Sin cuotas","Genera las cuatro cuotas del año a partir del monto anual.")}</div>
  <div class="sec">Gastos de mantención <button class="btn small" data-act="gas-new" data-id="${id}">Registrar gasto</button></div>
  <div class="panel">${(()=>{const gs=S.gastos.filter(g=>g.propiedadId===id).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));return gs.length?`<div class="list">${gs.slice(0,6).map(g=>`<div class="li"><div><div class="t1">${esc(g.descripcion)}</div><div class="sub">${fdate(g.fecha)} · ${esc(g.categoria)}</div></div><div class="toolbar">${cuantiaPill(g)}<span class="mono">${clp(g.monto)}</span><button class="btn small" data-act="gas-ver" data-id="${g.id}">Ver</button></div></div>`).join("")}</div>`:emptyBox("Sin gastos","Registra reparaciones y mejoras de esta propiedad.")})()}</div>
  ${(()=>{const mv=actividad(10,id);return mv.length?`<div class="sec">Historial de movimientos</div><div class="panel"><ul class="timeline">${mv.map(m=>`<li><span class="tl-dot ${m.dir}">${ico(m.dir==="in"?"inflow":"outflow")}</span><div style="flex:1;min-width:0"><div class="t1">${esc(m.t)}</div><div class="sub">${fdate(m.f)} · ${esc(m.s)}</div></div><span class="mono" style="align-self:center">${m.dir==="in"?"+":"−"}${esc(m.m)}</span></li>`).join("")}</ul></div>`:""})()}
  ${ps.length?`<div class="sec">Últimos pagos</div><div class="panel"><div class="list">${ps.map(x=>`<div class="li"><div><div class="t1">${esc(nro(x.numero))}</div><div class="sub">${esc(fperiod(x.periodo))}</div></div><div class="toolbar"><span class="mono">${clp(x.monto)}</span><button class="btn small" data-act="rec-ver" data-id="${x.id}">Recibo</button></div></div>`).join("")}</div></div>`:""}`;
  openModal(p.nombre||"Propiedad",body,`<button class="btn danger" data-act="prop-del" data-id="${id}">Eliminar</button><span style="flex:1"></span><button class="btn" data-act="close">Cerrar</button><button class="btn primary" data-act="prop-edit" data-id="${id}">Editar ficha</button>`,true);
}
function vContribuciones(){
  const anios=[...new Set(S.contribuciones.map(q=>String(q.anio)).concat([String(new Date().getFullYear())]))].sort().reverse();
  const rows=fil(S.contribuciones).filter(q=>!F.anio||String(q.anio)===F.anio).sort((a,b)=>(a.vencimiento||"").localeCompare(b.vencimiento||"")||propName(a.propiedadId).localeCompare(propName(b.propiedadId)));
  const tot=rows.reduce((s,q)=>s+(Number(q.monto)||0),0), pag=rows.filter(q=>q.pagada).reduce((s,q)=>s+(Number(q.monto)||0),0);
  const base=fil(S.contribuciones).filter(q=>!q.pagada&&q.vencimiento),atras=base.filter(q=>daysTo(q.vencimiento)<0),prox=base.filter(q=>daysTo(q.vencimiento)>=0&&daysTo(q.vencimiento)<=30);
  const hist=[...new Set(fil(S.contribuciones).map(q=>String(q.anio)))].sort().reverse().map(a=>{const r=fil(S.contribuciones).filter(q=>String(q.anio)===a),t=sum(r,"monto"),p=sum(r.filter(q=>q.pagada),"monto");return [a,t,p,t-p,r.filter(q=>q.pagada).length+" / "+r.length]});
  return head("Contribuciones","Impuesto territorial en 4 cuotas: abril, junio, septiembre y noviembre.",`${propFilter()}<select class="f" id="fAnio" aria-label="Año">${anios.map(a=>`<option${F.anio===a?" selected":""}>${a}</option>`).join("")}</select><button class="btn" data-act="con-new">Agregar cuota</button><button class="btn primary" data-act="con-gen">Generar cuotas del año</button>`)+
  (atras.length?`<div class="banner bad"><b>${atras.length} cuota${atras.length>1?"s":""} vencida${atras.length>1?"s":""}</b> por ${clp(sum(atras,"monto"))}. La más antigua venció el ${fdate(atras.map(q=>q.vencimiento).sort()[0])}.</div>`:"")+
  (prox.length?`<div class="banner">${prox.length} cuota${prox.length>1?"s":""} vence${prox.length>1?"n":""} en los próximos 30 días (${clp(sum(prox,"monto"))}).</div>`:"")+
  `<div class="kpis"><div class="kpi"><span class="l">Total ${esc(F.anio)}</span><span class="v">${clp(tot)}</span></div><div class="kpi"><span class="l">Pagado</span><span class="v">${clp(pag)}</span><div class="bar"><i style="width:${tot?Math.round(pag/tot*100):0}%"></i></div></div><div class="kpi"><span class="l">Por pagar</span><span class="v">${clp(tot-pag)}</span></div></div>
  <section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Propiedad</th><th>Cuota</th><th>Vencimiento</th><th class="num">Monto</th><th>Estado</th><th>Pago</th><th></th></tr></thead><tbody>${rows.map(q=>{const e=estadoCuota(q),p=byId("propiedades",q.propiedadId);return `<tr><td><div class="t1">${esc(propName(q.propiedadId))}${exTag(q)}</div><div class="sub mono">Rol ${esc(p&&p.rol||"—")}</div></td><td>${esc(q.cuota)}ª / ${esc(q.anio)}</td><td>${fdate(q.vencimiento)}</td><td class="num">${clp(q.monto)}</td><td><span class="pill ${e.c}">${e.t}</span></td><td class="sub">${q.pagada?fdate(q.fechaPago)+(q.folio?" · "+esc(q.folio):""):"—"}${q.archivoId?`<div>${fileLink(q)}</div>`:""}</td><td class="act"><button class="btn small" data-act="con-pay" data-id="${q.id}">${q.pagada?"Desmarcar":"Marcar pagada"}</button><button class="btn small ghost" data-act="con-edit" data-id="${q.id}">Editar</button><button class="btn small ghost danger" data-act="con-del" data-id="${q.id}">Eliminar</button></td></tr>`}).join("")}</tbody></table></div>`:emptyBox("Sin cuotas para "+esc(F.anio),"Genera las 4 cuotas de una propiedad a partir del monto anual que informa el SII.",S.propiedades.length?`<button class="btn primary" data-act="con-gen">Generar cuotas</button>`:"")}</section>`+(hist.length>1?`<section class="panel"><header><h2>Historial anual</h2></header><div class="tw"><table><thead><tr><th>Año</th><th class="num">Total</th><th class="num">Pagado</th><th class="num">Por pagar</th><th>Cuotas pagadas</th></tr></thead><tbody>${hist.map(h=>`<tr><td class="t1">${h[0]}</td><td class="num">${clp(h[1])}</td><td class="num">${clp(h[2])}</td><td class="num">${h[3]>0?`<span class="neg">${clp(h[3])}</span>`:clp(h[3])}</td><td>${h[4]}</td></tr>`).join("")}</tbody></table></div></section>`:"");
}

function vDocumentos(){
  const rows=fil(S.documentos).sort((a,b)=>propName(a.propiedadId).localeCompare(propName(b.propiedadId))||(b.fecha||"").localeCompare(a.fecha||""));
  const REQ=["Escritura de compraventa","Inscripción de dominio (CBR)","Certificado de dominio vigente","Certificado de avalúo fiscal"];
  const props=(F.prop?S.propiedades.filter(p=>p.id===F.prop):S.propiedades).slice().sort((x,y)=>(x.nombre||"").localeCompare(y.nombre||""));
  const celda=(p,t)=>{const d=S.documentos.filter(x=>x.propiedadId===p.id&&x.tipo===t);return d.some(x=>x.archivoId)?`<span class="pill ok mini" title="Registrado con archivo">Completo</span>`:d.length?`<span class="pill warn mini" title="Registrado, falta adjuntar el archivo">Sin archivo</span>`:`<span class="pill bad mini" title="No registrado">Falta</span>`};
  const faltan=props.reduce((n,p)=>n+REQ.filter(t=>!S.documentos.some(x=>x.propiedadId===p.id&&x.tipo===t&&x.archivoId)).length,0);
  const matriz=props.length?`<section class="panel"><header><h2>Documentos requeridos por propiedad</h2><span class="sub">${faltan?`<b class="neg">${faltan} pendiente${faltan>1?"s":""}</b> de registrar o adjuntar`:'<b class="pos">Todo completo</b>'}</span></header><div class="tw"><table><thead><tr><th>Propiedad</th>${REQ.map(t=>`<th>${esc(t)}</th>`).join("")}</tr></thead><tbody>${props.map(p=>`<tr><td class="t1">${esc(p.nombre||p.direccion)}</td>${REQ.map(t=>`<td>${celda(p,t)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`:"";
  return head("Escrituras y documentos","Copia digital de escrituras, inscripciones y certificados, con sus datos de notaría y CBR.",`${propFilter()}<button class="btn primary" data-act="doc-new">${ico("plus")}Ingresar documento</button>`)+matriz+
  `<section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Documento</th><th>Propiedad</th><th>Fecha</th><th>Notaría / repertorio</th><th>Inscripción CBR</th><th>Archivo</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr><td class="t1">${esc(d.tipo)}${exTag(d)}</td><td>${esc(propName(d.propiedadId))}</td><td>${fdate(d.fecha)}</td><td>${esc(d.notaria||"—")}${d.repertorio?`<div class="sub">Rep. ${esc(d.repertorio)}</div>`:""}</td><td class="sub">${d.fojas||d.numero?`fs. ${esc(d.fojas||"—")} N° ${esc(d.numero||"—")} año ${esc(d.anioInsc||"—")}`:"—"}${d.conservador?`<div>${esc(d.conservador)}</div>`:""}</td><td>${fileLink(d)}</td><td class="act"><button class="btn small ghost" data-act="doc-edit" data-id="${d.id}">Editar</button><button class="btn small ghost danger" data-act="doc-del" data-id="${d.id}">Eliminar</button></td></tr>`).join("")}</tbody></table></div>`:emptyBox("Sin documentos","Sube la escritura en PDF o como imagen y registra notaría, repertorio y fojas.",S.propiedades.length?`<button class="btn primary" data-act="doc-new">Ingresar documento</button>`:"")}</section>`;
}
function vContratos(){
  const rows=fil(S.contratos).sort((a,b)=>estadoContrato(b).vig-estadoContrato(a).vig||(b.inicio||"").localeCompare(a.inicio||""));
  const venc=S.contratos.filter(k=>estadoContrato(k).vig&&k.termino&&daysTo(k.termino)<=60&&!S.contratos.some(x=>x.renuevaDe===k.id)),reaj=S.contratos.filter(k=>estadoContrato(k).vig&&k.proxReajuste&&daysTo(k.proxReajuste)>=0&&daysTo(k.proxReajuste)<=30);
  return head("Contratos de arriendo","Arrendatario, plazo, renta, reajuste y garantía de cada contrato.",`${propFilter()}<button class="btn primary" data-act="ctr-new">${ico("plus")}Nuevo contrato</button>`)+
  (venc.length?`<div class="banner">${ico("alert").replace("<svg","<svg style=\"width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;vertical-align:-3px;margin-right:6px\"")}${venc.length===1?"1 contrato vence":venc.length+" contratos vencen"} en los próximos 60 días: ${venc.map(k=>`<b>${esc(k.arrendatario)}</b> (${fdate(k.termino)})`).join(", ")}.</div>`:"")+
  (reaj.length?`<div class="banner info">Reajuste próximo: ${reaj.map(k=>`<b>${esc(k.arrendatario)}</b> el ${fdate(k.proxReajuste)}`).join(", ")}.</div>`:"")+
  `<section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Arrendatario</th><th>Propiedad</th><th>Plazo</th><th class="num">Renta</th><th>Reajuste</th><th>Estado</th><th>Contrato</th><th></th></tr></thead><tbody>${rows.map(k=>{const e=estadoContrato(k);return `<tr><td><div class="t1">${esc(k.arrendatario)}${exTag(k)}</div><div class="sub">${esc([k.rut,k.telefono].filter(Boolean).join(" · "))}</div></td><td>${esc(propName(k.propiedadId))}</td><td class="sub">${fdate(k.inicio)}<br>${k.termino?fdate(k.termino):"indefinido"}</td><td class="num">${money(k.canon,k.moneda)}<div class="sub">día ${esc(k.diaPago||5)}</div></td><td class="sub">${esc(k.reajuste||"—")}${k.proxReajuste?`<div>Próx. ${fdate(k.proxReajuste)}${daysTo(k.proxReajuste)<=30&&daysTo(k.proxReajuste)>=0?' <span class="pill warn mini">'+daysTo(k.proxReajuste)+' d</span>':""}</div>`:""}${k.garantia?`<div>Garantía ${clp(k.garantia)}</div>`:""}${k.renuevaDe?`<div>Renovación</div>`:""}</td><td><span class="pill ${e.c}">${e.t}</span></td><td>${fileLink(k)}</td><td class="act">${e.vig?`<button class="btn small" data-act="pay-new" data-id="${k.id}">Registrar pago</button>`:""}${k.termino&&(!e.vig||daysTo(k.termino)<=60)&&!S.contratos.some(x=>x.renuevaDe===k.id)?`<button class="btn small" data-act="ctr-renew" data-id="${k.id}">Renovar</button>`:""}<button class="btn small ghost" data-act="ctr-edit" data-id="${k.id}">Editar</button><button class="btn small ghost danger" data-act="ctr-del" data-id="${k.id}">Eliminar</button></td></tr>`}).join("")}</tbody></table></div>`:emptyBox("Sin contratos","Registra el contrato y adjunta la copia firmada.",S.propiedades.length?`<button class="btn primary" data-act="ctr-new">Nuevo contrato</button>`:"")}</section>`;
}
function vPagos(){
  const rows=fil(S.pagos).sort((a,b)=>(b.numero||0)-(a.numero||0));
  const total=rows.reduce((s,p)=>s+(Number(p.monto)||0),0);
  return head("Pagos y recibos","Cada pago registrado recibe un número correlativo y su recibo en PDF.",`${propFilter()}<button class="btn" data-act="csv-pagos"${downloads?"":" disabled"}>Exportar CSV</button><button class="btn primary" data-act="pay-new">Registrar pago</button>`)+
  `<section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Recibo</th><th>Arrendatario</th><th>Propiedad</th><th>Mes</th><th>Fecha pago</th><th class="num">Monto</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td class="mono">${esc(nro(p.numero))}${exTag(p)}</td><td class="t1">${esc(p.arrendatario)}</td><td>${esc(p.propiedadNombre||propName(p.propiedadId))}</td><td>${esc(fperiod(p.periodo))}</td><td>${fdate(p.fecha)}<div class="sub">${esc(p.medio||"")}</div></td><td class="num">${clp(p.monto)}</td><td class="act"><button class="btn small" data-act="rec-ver" data-id="${p.id}">Recibo</button><button class="btn small ghost" data-act="pay-edit" data-id="${p.id}">Editar</button><button class="btn small ghost danger" data-act="pay-del" data-id="${p.id}">Eliminar</button></td></tr>`).join("")}</tbody><tfoot><tr><td colspan="5" class="sub" style="padding:10px 14px">${rows.length} pagos</td><td class="num t1" style="padding:10px 14px">${clp(total)}</td><td></td></tr></tfoot></table></div>`:emptyBox("Aún no hay pagos","Registra el pago de un arriendo y el recibo se genera al instante.",S.contratos.length?`<button class="btn primary" data-act="pay-new">Registrar pago</button>`:"")}</section>`;
}
function vAjustes(){
  const e=S.emisor||{};
  const hayEj=COLS.some(c=>S[c].some(x=>x.ejemplo));
  const f=[["nombre","Nombre o razón social",true],["rut","RUT"],["direccion","Dirección",true],["telefono","Teléfono"],["email","Correo"],["firmante","Nombre que firma el recibo",true]];
  return head("Datos del emisor","Estos datos encabezan cada recibo de arriendo.")+
  `<section class="panel"><div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px"><form id="emForm" class="grid">${f.map(([k,l,full])=>`<div class="fld${full?" full":""}"><label for="em_${k}">${l}</label><input id="em_${k}" name="${k}" value="${esc(e[k])}"></div>`).join("")}</form><div class="toolbar"><button class="btn primary" data-act="emisor-save">Guardar datos</button></div></div></section>
  <section class="panel"><header><h2>Datos de ejemplo</h2></header><div style="padding:16px 20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><span class="sub">${hayEj?"Hay registros marcados como ejemplo en la cartera.":"No quedan registros de ejemplo."}</span><button class="btn danger" data-act="demo-clear"${hayEj?"":" disabled"}>Borrar datos de ejemplo</button></div></section>`;
}

/* ---------- gastos de mantención ---------- */
const CAT_MENOR=["Gasfitería","Electricidad","Pintura","Cerrajería","Vidrios y ventanas","Jardinería y aseo","Artefactos (calefont, cocina, termo)","Reparaciones menores","Otro"];
const CAT_MAYOR=["Techumbre","Estructura / obra gruesa","Remodelación","Ampliación","Red eléctrica completa","Red sanitaria / alcantarillado","Pisos y pavimentos","Cierre perimetral","Otro"];
const CUANTIA={menor:"Menor cuantía",mayor:"Mayor cuantía"};
const CLASES=["Materiales","Mano de obra","Flete / traslado","Otro"];
const esMayor=g=>g.cuantia==="mayor";
const gTot=a=>a.reduce((s,g)=>s+(Number(g.monto)||0),0);
const cuantiaPill=g=>`<span class="pill ${esMayor(g)?"mayor":""}">${esMayor(g)?"Mayor":"Menor"}</span>`;
const selHTML=(id,opts,val,cls)=>`<select${id?` id="${id}"`:""}${cls?` class="${cls}"`:""}>${opts.map(o=>{const [a,b]=Array.isArray(o)?o:[o,o];return `<option value="${esc(a)}"${String(val??"")===String(a)?" selected":""}>${esc(b)}</option>`}).join("")}</select>`;
function itemRow(it){
  it=it||{};
  const sub=(Number(it.cant)||0)*(Number(it.unit)||0);
  return `<tr><td><input class="it-desc" aria-label="Ítem" value="${esc(it.desc)}" placeholder="Material o trabajo"></td><td>${selHTML("",CLASES,it.clase||"Materiales","it-clase")}</td><td><input class="it-cant" aria-label="Cantidad" type="number" min="0" step="any" value="${esc(it.cant??1)}"></td><td><input class="it-unit" aria-label="Valor unitario" type="number" min="0" step="any" value="${esc(it.unit)}"></td><td class="num it-sub">${clp(sub)}</td><td><button type="button" class="btn small ghost danger" data-act="it-del" aria-label="Quitar ítem">✕</button></td></tr>`;
}
function readItems(){
  return [...document.querySelectorAll("#itBody tr")].map(tr=>({desc:tr.querySelector(".it-desc").value.trim(),clase:tr.querySelector(".it-clase").value,cant:Number(tr.querySelector(".it-cant").value)||0,unit:Number(tr.querySelector(".it-unit").value)||0})).filter(i=>i.desc||i.unit);
}
function recalcItems(){
  let t=0;document.querySelectorAll("#itBody tr").forEach(tr=>{const s=(Number(tr.querySelector(".it-cant").value)||0)*(Number(tr.querySelector(".it-unit").value)||0);t+=s;tr.querySelector(".it-sub").textContent=clp(s)});
  const el=$("#itTot");if(el)el.textContent=clp(t);
}
function formGasto(g,preset){
  if(!S.propiedades.length){toast("Primero agrega una propiedad");return}
  const v=g||{fecha:todayISO(),cuantia:"menor",cargo:"Propietario",tipoDoc:"Boleta",medio:"Transferencia",...preset};
  const items=v.items&&v.items.length?v.items:[{desc:"",clase:"Materiales",cant:1,unit:""},{desc:"",clase:"Mano de obra",cant:1,unit:""}];
  const body=`<form id="gfrm" class="grid" novalidate>
   <div class="fld full"><label for="g_prop">Propiedad *</label>${selHTML("g_prop",propOptions(),v.propiedadId)}</div>
   <div class="fld"><label for="g_fecha">Fecha *</label><input id="g_fecha" type="date" value="${esc(v.fecha)}"></div>
   <div class="fld"><span class="lbl">Cuantía *</span><div class="seg" role="radiogroup" aria-label="Cuantía">${["menor","mayor"].map(c=>`<label><input type="radio" id="g_c_${c}" name="g_cuantia" value="${c}"${(v.cuantia||"menor")===c?" checked":""}><span>${CUANTIA[c]}</span></label>`).join("")}</div></div>
   <div class="fld"><label for="g_cat">Tipo de gasto *</label>${selHTML("g_cat",v.cuantia==="mayor"?CAT_MAYOR:CAT_MENOR,v.categoria)}</div>
   <div class="fld"><label for="g_cargo">Cargo a</label>${selHTML("g_cargo",["Propietario","Arrendatario"],v.cargo||"Propietario")}<span class="hint">Lo que paga el arrendatario no se descuenta de los ingresos.</span></div>
   <div class="fld full"><label for="g_desc">Descripción del trabajo *</label><input id="g_desc" value="${esc(v.descripcion)}" placeholder="Reparación de filtración en baño principal"></div>
   <div class="fld"><label for="g_resp">Responsable del gasto</label><input id="g_resp" value="${esc(v.responsable)}" placeholder="Quién autorizó o pagó"></div>
   <div class="fld"><label for="g_prov">Proveedor o maestro</label><input id="g_prov" value="${esc(v.proveedor)}"></div>
   <div class="fld"><label for="g_rutp">RUT proveedor</label><input id="g_rutp" value="${esc(v.rutProveedor)}" placeholder="12.345.678-9"></div>
   <div class="fld"><label for="g_tdoc">Documento</label>${selHTML("g_tdoc",["Boleta","Factura","Boleta de honorarios","Recibo simple","Sin documento"],v.tipoDoc)}</div>
   <div class="fld"><label for="g_ndoc">N° de documento</label><input id="g_ndoc" value="${esc(v.nDoc)}"></div>
   <div class="fld"><label for="g_medio">Medio de pago</label>${selHTML("g_medio",["Transferencia","Efectivo","Tarjeta","Cheque","Otro"],v.medio)}</div>
   <div class="fld"><label for="g_file">${v.archivoId?"Reemplazar comprobante":"Comprobante (PDF o imagen)"}</label><input id="g_file" type="file" accept="application/pdf,image/*">${v.archivoId?`<span class="hint">Actual: ${esc(v.archivoNombre)}</span>`:""}</div>
  </form>
  <div class="sec">Detalle del gasto</div>
  <div class="tw items"><table><thead><tr><th>Ítem</th><th>Clase</th><th class="num">Cant.</th><th class="num">Valor unit.</th><th class="num">Subtotal</th><th></th></tr></thead><tbody id="itBody">${items.map(itemRow).join("")}</tbody>
  <tfoot><tr><td colspan="4"><button type="button" class="btn small" data-act="it-add">Agregar ítem</button></td><td class="num t1" id="itTot"></td><td></td></tr></tfoot></table></div>
  <div class="fld"><label for="g_notas">Notas</label><textarea id="g_notas">${esc(v.notas)}</textarea></div>
  <div class="err" id="frmErr" hidden></div>`;
  openModal(g?"Editar gasto de mantención":"Registrar gasto de mantención",body,`<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="save" id="saveBtn">Guardar gasto</button>`,true);
  recalcItems();
  modalSave=async()=>{
    const err=$("#frmErr"),val=id=>($("#"+id).value||"").trim();
    const its=readItems(),monto=its.reduce((s,i)=>s+i.cant*i.unit,0);
    const fail=m=>{err.textContent=m;err.hidden=false};
    if(!val("g_prop"))return fail("Elige la propiedad.");
    if(!val("g_fecha"))return fail("Indica la fecha del gasto.");
    if(!val("g_desc"))return fail("Describe el trabajo realizado.");
    if(!its.length||monto<=0)return fail("Agrega al menos un ítem con valor.");
    const b=$("#saveBtn");b.disabled=true;b.textContent="Guardando…";
    try{
      const f=$("#g_file").files[0],up=f?await subir(f):{};
      const data={...strip(g||{}),propiedadId:val("g_prop"),fecha:val("g_fecha"),cuantia:document.querySelector('input[name="g_cuantia"]:checked').value,categoria:val("g_cat"),cargo:val("g_cargo"),descripcion:val("g_desc"),proveedor:val("g_prov"),responsable:val("g_resp"),rutProveedor:val("g_rutp"),tipoDoc:val("g_tdoc"),nDoc:val("g_ndoc"),medio:val("g_medio"),items:its,monto:Math.round(monto),notas:val("g_notas"),...up};
      await guardar("gastos",g&&g.id,data);closeModal();toast(g?"Gasto actualizado":"Gasto registrado · "+clp(monto));
    }catch(e){fail(e.message||"No se pudo guardar.");b.disabled=false;b.textContent="Guardar gasto";}
  };
}
function verGasto(id){
  const g=byId("gastos",id);if(!g)return;
  const its=g.items||[];
  const body=`<dl class="dl">
    <div><dt>Propiedad</dt><dd>${esc(propName(g.propiedadId))}</dd></div><div><dt>Fecha</dt><dd>${fdate(g.fecha)}</dd></div>
    <div><dt>Cuantía</dt><dd>${cuantiaPill(g)}</dd></div><div><dt>Tipo</dt><dd>${esc(g.categoria)}</dd></div>
    <div><dt>Proveedor</dt><dd>${esc(g.proveedor||"—")}${g.rutProveedor?`<div class="sub">${esc(g.rutProveedor)}</div>`:""}</dd></div>
    <div><dt>Documento</dt><dd>${esc([g.tipoDoc,g.nDoc].filter(Boolean).join(" N° ")||"—")}</dd></div>
    <div><dt>Cargo a</dt><dd>${esc(g.cargo||"Propietario")}</dd></div><div><dt>Responsable</dt><dd>${esc(g.responsable||"—")}</dd></div><div><dt>Medio de pago</dt><dd>${esc(g.medio||"—")}</dd></div><div><dt>Comprobante</dt><dd>${fileLink(g)}</dd></div>
  </dl><p style="margin:0" class="t1">${esc(g.descripcion)}</p>
  <div class="panel"><div class="tw"><table><thead><tr><th>Ítem</th><th>Clase</th><th class="num">Cant.</th><th class="num">Valor unit.</th><th class="num">Subtotal</th></tr></thead><tbody>${its.map(i=>`<tr><td>${esc(i.desc)}</td><td>${esc(i.clase)}</td><td class="num">${esc(i.cant)}</td><td class="num">${clp(i.unit)}</td><td class="num">${clp(i.cant*i.unit)}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="4" class="t1" style="padding:10px 14px">Total</td><td class="num t1" style="padding:10px 14px">${clp(g.monto)}</td></tr></tfoot></table></div></div>
  ${g.notas?`<p class="sub" style="margin:0">${esc(g.notas)}</p>`:""}`;
  openModal("Gasto de mantención",body,`<button class="btn danger" data-act="gas-del" data-id="${id}">Eliminar</button><span style="flex:1"></span><button class="btn" data-act="close">Cerrar</button><button class="btn primary" data-act="gas-edit" data-id="${id}">Editar</button>`,true);
}
const aniosDe=(...arrs)=>[...new Set(arrs.flat().filter(Boolean).map(s=>String(s).slice(0,4)).concat([String(new Date().getFullYear())]))].sort().reverse();
const anioSel=()=>{const a=aniosDe(S.gastos.map(g=>g.fecha),S.pagos.map(p=>p.fecha),S.contribuciones.map(q=>q.anio));return `<select class="f" id="fAnio" aria-label="Año">${a.map(x=>`<option${F.anio===x?" selected":""}>${x}</option>`).join("")}</select>`};
function vGastos(){
  const base=fil(S.gastos).filter(g=>(g.fecha||"").slice(0,4)===F.anio);
  const rows=base.filter(g=>!F.cuantia||(F.cuantia==="mayor")===esMayor(g)).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
  const men=base.filter(g=>!esMayor(g)),may=base.filter(esMayor),arr=base.filter(g=>g.cargo==="Arrendatario");
  return head("Gastos de mantención","Reparaciones y mejoras de cada propiedad, con su detalle de materiales y mano de obra.",`${propFilter()}${anioSel()}${selHTML("fCuantia",[["","Toda cuantía"],["menor","Menor cuantía"],["mayor","Mayor cuantía"]],F.cuantia,"f")}<button class="btn" data-act="nav" data-id="informes">Informes</button><button class="btn primary" data-act="gas-new">Registrar gasto</button>`)+
  `<div class="kpis"><div class="kpi"><span class="l">Total ${esc(F.anio)}</span><span class="v">${clp(gTot(base))}</span><span class="s">${base.length} gastos</span></div>
  <div class="kpi"><span class="l">Menor cuantía</span><span class="v">${clp(gTot(men))}</span><span class="s">${men.length} gastos</span></div>
  <div class="kpi"><span class="l">Mayor cuantía</span><span class="v">${clp(gTot(may))}</span><span class="s">${may.length} gastos</span></div>
  <div class="kpi"><span class="l">A cargo de arrendatarios</span><span class="v">${clp(gTot(arr))}</span><span class="s">No se descuentan de los ingresos</span></div></div>
  <section class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Fecha</th><th>Propiedad</th><th>Tipo</th><th>Descripción</th><th>Documento</th><th class="num">Monto</th><th></th></tr></thead><tbody>${rows.map(g=>`<tr class="click" data-act="gas-ver" data-id="${g.id}"><td>${fdate(g.fecha)}</td><td>${esc(propName(g.propiedadId))}${exTag(g)}</td><td>${cuantiaPill(g)}<div class="sub">${esc(g.categoria)}</div></td><td><div class="t1">${esc(g.descripcion)}</div><div class="sub">${esc([g.proveedor,(g.items||[]).length+" ítems",g.cargo==="Arrendatario"?"cargo arrendatario":""].filter(Boolean).join(" · "))}</div></td><td class="sub">${esc([g.tipoDoc,g.nDoc].filter(Boolean).join(" N° ")||"—")}</td><td class="num t1">${clp(g.monto)}</td><td class="act"><button class="btn small ghost" data-act="gas-edit" data-id="${g.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`:emptyBox("Sin gastos en "+esc(F.anio),"Registra cada reparación con sus ítems de materiales y mano de obra, y adjunta la boleta o factura.",S.propiedades.length?`<button class="btn primary" data-act="gas-new">Registrar gasto</button>`:"")}</section>`;
}

/* ---------- informes ---------- */
const mesCorto=p=>MESES[+p.slice(5,7)-1].slice(0,3)+" "+p.slice(2,4);
function mesesEntre(a,b){const r=[];let [y,m]=a.split("-").map(Number);const [by,bm]=b.split("-").map(Number);while(y<by||(y===by&&m<=bm)){r.push(y+"-"+pad(m));if(++m>12){m=1;y++}}return r}
const scope=()=>F.prop?propName(F.prop):"Todas las propiedades";
function repGastos(){
  const y=F.anio,gs=S.gastos.filter(g=>(g.fecha||"").slice(0,4)===y&&(!F.prop||g.propiedadId===F.prop));
  const ids=[...new Set(gs.map(g=>g.propiedadId))].sort((a,b)=>propName(a).localeCompare(propName(b)));
  const men=a=>a.filter(g=>!esMayor(g)),may=a=>a.filter(esMayor);
  const sections=[{h:"Resumen por propiedad",head:["Propiedad","Menor cuantía","Mayor cuantía","Total","N° gastos"],num:[1,2,3,4],
    rows:ids.map(id=>{const a=gs.filter(g=>g.propiedadId===id);return [propName(id),clp(gTot(men(a))),clp(gTot(may(a))),clp(gTot(a)),a.length]}),
    foot:["Total",clp(gTot(men(gs))),clp(gTot(may(gs))),clp(gTot(gs)),gs.length]}];
  ids.forEach(id=>{
    const a=gs.filter(g=>g.propiedadId===id),grp={};
    a.forEach(g=>{const k=(esMayor(g)?"2":"1")+"|"+(g.categoria||"Otro");(grp[k]=grp[k]||[]).push(g)});
    const ks=Object.keys(grp).sort();
    sections.push({h:propName(id)+" · gastos por tipo",head:["Cuantía","Tipo de gasto","N° gastos","Total"],num:[2,3],
      rows:ks.map(k=>{const [c,cat]=k.split("|");return [c==="2"?"Mayor cuantía":"Menor cuantía",cat,grp[k].length,clp(gTot(grp[k]))]}),
      foot:["","Total propiedad",a.length,clp(gTot(a))]});
    sections.push({h:propName(id)+" · detalle",head:["Fecha","Cuantía / tipo","Descripción","Proveedor","Documento","Cargo","Monto"],num:[6],
      rows:a.slice().sort((p,q)=>(p.fecha||"").localeCompare(q.fecha||"")).map(g=>[fdate(g.fecha),(esMayor(g)?"Mayor":"Menor")+" · "+(g.categoria||""),g.descripcion||"",g.proveedor||"—",[g.tipoDoc,g.nDoc].filter(Boolean).join(" N° ")||"—",g.cargo||"Propietario",clp(g.monto)])});
  });
  return {file:"gastos-por-tipo-"+y,title:"Gastos de mantención por tipo",subtitle:`Año ${y} · ${scope()}`,
    kpis:[["Total",clp(gTot(gs))],["Menor cuantía",clp(gTot(men(gs)))],["Mayor cuantía",clp(gTot(may(gs)))],["Cargo arrendatarios",clp(gTot(gs.filter(g=>g.cargo==="Arrendatario")))]],
    sections:gs.length?sections:[],empty:`No hay gastos de mantención registrados en ${y}.`};
}
function repImpagos(){
  const mes=F.mes,desde=F.desde&&F.desde<=mes?F.desde:mes;
  let totC=0,totU=0,nMes=0;const out=[];
  S.contratos.filter(k=>!F.prop||k.propiedadId===F.prop).forEach(k=>{
    const ini=(k.inicio||"0000-01").slice(0,7),fin=(k.termino||"9999-12").slice(0,7);
    const ms=mesesEntre(desde,mes).filter(p=>p>=ini&&p<=fin&&estadoArriendo(k,p).c==="bad");
    if(!ms.length)return;
    const deuda=ms.length*(Number(k.canon)||0);
    if(k.moneda==="UF")totU+=deuda;else totC+=deuda;
    const esMes=ms.includes(mes);if(esMes)nMes++;
    const venc=mes+"-"+pad(Math.min(Number(k.diaPago)||5,28));
    out.push({k,ms,deuda,esMes,dias:esMes?Math.max(0,-daysTo(venc)):null});
  });
  out.sort((a,b)=>b.esMes-a.esMes||b.ms.length-a.ms.length);
  const tot=[totC?clp(totC):"",totU?uf(totU):""].filter(Boolean).join(" + ")||clp(0);
  return {file:"arriendos-impagos-"+mes,title:"Arriendos impagos",subtitle:`${fperiod(mes).replace(/^./,c=>c.toUpperCase())} · deuda contada desde ${fperiod(desde)} · ${scope()}`,
    kpis:[["Impagos del mes",String(nMes)],["Contratos con deuda",String(out.length)],["Deuda acumulada",tot]],
    sections:out.length?[{h:"Detalle por arrendatario",head:["Arrendatario","Propiedad","Contacto","Renta",fperiod(mes),"Días de atraso","Meses adeudados","Deuda"],num:[3,5,7],
      rows:out.map(r=>[r.k.arrendatario+(r.k.rut?" · "+r.k.rut:""),propName(r.k.propiedadId),[r.k.telefono,r.k.email].filter(Boolean).join(" · ")||"—",money(r.k.canon,r.k.moneda),r.esMes?"Impago":"Pagado",r.dias==null?"—":String(r.dias),r.ms.length+" ("+r.ms.map(mesCorto).join(", ")+")",money(r.deuda,r.k.moneda)]),
      foot:["Total","","","","","",out.reduce((s,r)=>s+r.ms.length,0)+" meses",tot]}]:[],
    empty:`No hay arriendos impagos entre ${fperiod(desde)} y ${fperiod(mes)}.`};
}
function repAnual(){
  const y=F.anio,pf=x=>!F.prop||x.propiedadId===F.prop,inc=F.incContr;
  const ing=S.pagos.filter(p=>pf(p)&&(p.fecha||"").slice(0,4)===y);
  const gas=S.gastos.filter(g=>pf(g)&&g.cargo!=="Arrendatario"&&(g.fecha||"").slice(0,4)===y);
  const con=inc?S.contribuciones.filter(q=>pf(q)&&q.pagada&&(q.fechaPago||"").slice(0,4)===y):[];
  const sm=(a,f)=>a.reduce((s,x)=>s+(Number(x[f])||0),0);
  const head1=["Mes","Ingresos por arriendo","Mantención menor","Mantención mayor"].concat(inc?["Contribuciones"]:[],["Total egresos","Resultado"]);
  const meses=[],chart=[];let T=[0,0,0,0];
  for(let i=1;i<=12;i++){
    const per=y+"-"+pad(i),f=a=>a.filter(x=>(x.fecha||"").startsWith(per));
    const I=sm(f(ing),"monto"),g=f(gas),Gm=gTot(g.filter(x=>!esMayor(x))),GM=gTot(g.filter(esMayor)),C=sm(con.filter(q=>(q.fechaPago||"").startsWith(per)),"monto"),E=Gm+GM+C;
    T=[T[0]+I,T[1]+Gm,T[2]+GM,T[3]+C];chart.push({m:MESES[i-1].slice(0,3),I,E});
    meses.push([MESES[i-1].replace(/^./,c=>c.toUpperCase()),clp(I),clp(Gm),clp(GM)].concat(inc?[clp(C)]:[],[clp(E),clp(I-E)]));
  }
  const TE=T[1]+T[2]+T[3];
  const ids=[...new Set([...ing,...gas,...con].map(x=>x.propiedadId))].filter(Boolean).sort((a,b)=>propName(a).localeCompare(propName(b)));
  const porProp=ids.map(id=>{const I=sm(ing.filter(x=>x.propiedadId===id),"monto"),G=gTot(gas.filter(x=>x.propiedadId===id)),C=sm(con.filter(x=>x.propiedadId===id),"monto");return [propName(id),clp(I),clp(G)].concat(inc?[clp(C)]:[],[clp(I-G-C),I?Math.round((G+C)/I*100)+"%":"—"])});
  const n=head1.length;
  return {file:"ingresos-egresos-"+y,title:"Ingresos versus egresos de mantención",subtitle:`Año ${y} · ${scope()} · ingresos según fecha de pago${inc?" · incluye contribuciones":""}`,
    kpis:[["Ingresos por arriendo",clp(T[0])],["Egresos de mantención",clp(T[1]+T[2])]].concat(inc?[["Contribuciones",clp(T[3])]]:[],[["Resultado",clp(T[0]-TE)]]),
    chart,
    sections:[{h:"Resultado mensual",head:head1,num:[...Array(n-1).keys()].map(i=>i+1),rows:meses,foot:["Total "+y,clp(T[0]),clp(T[1]),clp(T[2])].concat(inc?[clp(T[3])]:[],[clp(TE),clp(T[0]-TE)])},
      {h:"Resultado por propiedad",head:["Propiedad","Ingresos","Mantención"].concat(inc?["Contribuciones"]:[],["Resultado","Egresos / ingresos"]),num:inc?[1,2,3,4,5]:[1,2,3,4],rows:porProp,
       foot:["Total",clp(T[0]),clp(T[1]+T[2])].concat(inc?[clp(T[3])]:[],[clp(T[0]-TE),T[0]?Math.round(TE/T[0]*100)+"%":"—"])}],
    empty:""};
}
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
function chartSVG(data){
  const W=720,H=230,L=64,B=26,T=14,max=niceMax(Math.max(1,...data.map(d=>Math.max(d.I,d.E)))),ph=H-B-T,gw=(W-L-8)/12;
  const yv=v=>T+ph-(v/max)*ph,fmt=v=>v>=1e6?(v/1e6).toLocaleString("es-CL",{maximumFractionDigits:1})+" M":v>=1e3?Math.round(v/1e3)+" mil":String(v);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos y egresos por mes">`;
  for(let i=0;i<=4;i++){const v=max*i/4,yy=yv(v);s+=`<line x1="${L}" x2="${W-8}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${yy+4}" text-anchor="end" font-size="11" fill="var(--muted)">$${fmt(v)}</text>`}
  data.forEach((d,i)=>{const x=L+i*gw+gw*.18,bw=gw*.3;
    s+=`<rect class="bar-r" x="${x}" y="${yv(d.I)}" width="${bw}" height="${Math.max(0,T+ph-yv(d.I))}" rx="2" fill="var(--c-in)"><title>${d.m}: ingresos ${clp(d.I)}</title></rect><rect class="bar-r" x="${x+bw+2}" y="${yv(d.E)}" width="${bw}" height="${Math.max(0,T+ph-yv(d.E))}" rx="2" fill="var(--c-out)"><title>${d.m}: egresos ${clp(d.E)}</title></rect><text x="${L+i*gw+gw/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${d.m}</text>`});
  return s+`</svg><div class="legend"><span><i style="background:var(--c-in)"></i>Ingresos</span><span><i style="background:var(--c-out)"></i>Egresos</span></div>`;
}
const PILLS={Impago:"bad",Pagado:"ok"};
function cellHTML(c){const v=String(c);if(PILLS[v])return `<span class="pill ${PILLS[v]}">${v}</span>`;return v.startsWith("-$")?`<span class="neg">${esc(v)}</span>`:esc(v)}
function reportHTML(r){
  const e=S.emisor||{};
  return `<article class="sheet"><header class="sheet-head"><img src="${LOGO}" alt=""><div><h2>${esc(r.title)}</h2><div class="sub">${esc(r.subtitle)}</div></div><div class="sheet-meta sub">${esc(e.nombre||"")}<br>Emitido ${fdate(todayISO())}</div></header>
  <div class="sheet-kpis">${r.kpis.map(([l,v])=>`<div><span class="l">${esc(l)}</span><span class="v">${cellHTML(v)}</span></div>`).join("")}</div>
  ${r.chart?`<div class="chart">${chartSVG(r.chart)}</div>`:""}
  ${r.sections.length?r.sections.map(s=>`<section class="rsec"><h3>${esc(s.h)}</h3><div class="tw"><table><thead><tr>${s.head.map((h,i)=>`<th${(s.num||[]).includes(i)?' class="num"':""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.rows.map(r=>`<tr>${r.map((c,i)=>`<td${(s.num||[]).includes(i)?' class="num"':""}>${cellHTML(c)}</td>`).join("")}</tr>`).join("")}</tbody>${s.foot?`<tfoot><tr>${s.foot.map((c,i)=>`<td${(s.num||[]).includes(i)?' class="num"':""}>${cellHTML(c)}</td>`).join("")}</tr></tfoot>`:""}</table></div></section>`).join(""):emptyBox("Sin datos para este informe",esc(r.empty))}
  </article>`;
}
function reportPDF(r){
  const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error("No se pudo cargar el generador de PDF.");
  const doc=new J({orientation:"landscape",unit:"mm",format:"letter"});
  if(typeof doc.autoTable!=="function")throw new Error("No se pudo cargar el generador de tablas PDF.");
  const W=doc.internal.pageSize.getWidth(),A=[15,30,61],G=[184,144,58],e=S.emisor||{};
  doc.setFillColor(16,29,58);doc.rect(0,0,W,31,"F");doc.setFillColor(200,164,93);doc.rect(0,31,W,.9,"F");
  try{doc.addImage(LOGO,"PNG",14,5,21,21)}catch(_){}
  doc.setFont("times","bold");doc.setFontSize(18);doc.setTextColor(232,214,165);doc.text(r.title,40,14.5);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(190,198,216);doc.text(r.subtitle,40,21);
  doc.text([e.nombre||"Familia Benavides",[e.rut&&"RUT "+e.rut,"Emitido "+fdate(todayISO())].filter(Boolean).join(" · ")],W-14,13,{align:"right"});
  let x=14;doc.setFontSize(8);r.kpis.forEach(([l,v])=>{doc.setTextColor(94,101,119);doc.text(l.toUpperCase(),x,40);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(...A);doc.text(String(v),x,46);doc.setFont("helvetica","normal");doc.setFontSize(8);x+=(W-28)/r.kpis.length});
  let y=56;
  if(!r.sections.length){doc.setFontSize(11);doc.setTextColor(94,101,119);doc.text(r.empty,14,y)}
  r.sections.forEach(s=>{
    if(y>175){doc.addPage();y=18}
    doc.setFont("times","bold");doc.setFontSize(12.5);doc.setTextColor(...A);doc.text(s.h,14,y);
    doc.autoTable({startY:y+2.5,head:[s.head],body:s.rows.map(r=>r.map(String)),foot:s.foot?[s.foot.map(String)]:undefined,showFoot:"lastPage",theme:"grid",
      styles:{font:"helvetica",fontSize:8.3,cellPadding:1.8,lineColor:[226,220,205],lineWidth:.2,textColor:[18,29,53],overflow:"linebreak"},
      headStyles:{fillColor:A,textColor:[243,226,176],fontStyle:"bold"},footStyles:{fillColor:[244,234,210],textColor:A,fontStyle:"bold"},
      columnStyles:Object.fromEntries((s.num||[]).map(i=>[i,{halign:"right"}])),margin:{left:14,right:14,top:16}});
    y=doc.lastAutoTable.finalY+10;
  });
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(94,101,119);doc.text(`${r.title} · página ${i} de ${n}`,W-14,doc.internal.pageSize.getHeight()-8,{align:"right"});doc.text("Familia Benavides · Control de propiedades",14,doc.internal.pageSize.getHeight()-8)}
  return doc.output("blob");
}
function reportCSV(r){
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',L=[[r.title],[r.subtitle],[]];
  r.kpis.forEach(k=>L.push(k));L.push([]);
  r.sections.forEach(s=>{L.push([s.h]);L.push(s.head);s.rows.forEach(x=>L.push(x));if(s.foot)L.push(s.foot);L.push([])});
  return "﻿"+L.map(r=>r.map(q).join(";")).join("\r\n");
}
const REPS=[["gastos","Gastos por tipo",repGastos],["anual","Ingresos vs egresos",repAnual],["rentab","Rentabilidad",repRentabilidad],["impagos","Arriendos impagos",repImpagos],["pagos","Historial de pagos",repPagosHist],["mant","Mantenciones anuales",repMantAnual],["contr","Contribuciones",repContribuciones]];
const curReport=()=>(REPS.find(x=>x[0]===F.rep)||REPS[0])[2]();
function vInformes(){
  const r=curReport();
  const filtros=F.rep==="impagos"
    ?`${propFilter()}<label class="flab" for="fMes">Mes</label><input class="f" type="month" id="fMes" value="${esc(F.mes)}"><label class="flab" for="fDesde">Deuda desde</label><input class="f" type="month" id="fDesde" value="${esc(F.desde)}">`
    :`${propFilter()}${F.rep==="mant"?"":anioSel()}${F.rep==="anual"?`<label class="flab chk"><input type="checkbox" id="fContr"${F.incContr?" checked":""}> Incluir contribuciones</label>`:""}`;
  return head("Informes","Informes financieros con filtros por año, mes y propiedad. Descarga en PDF o en Excel (CSV).",`<button class="btn" data-act="rep-csv"${downloads?"":" disabled"}>Excel / CSV</button><button class="btn primary" data-act="rep-pdf"${downloads?"":" disabled"}>Descargar PDF</button>`)+
  `<div class="tabs" role="tablist">${REPS.map(([k,l])=>`<button role="tab" data-act="rep-tab" data-id="${k}" aria-selected="${F.rep===k}">${l}</button>`).join("")}</div>
  <div class="toolbar">${filtros}</div>${reportHTML(r)}`;
}

function render(){
  nav();
  const m=$("#main");
  document.body.classList.toggle("logged-out",dbState==="login");
  if(dbState==="login"){m.innerHTML=loginHTML();return}
  if(dbState!=="none"&&!COLS.every(c=>S.loaded[c])){m.innerHTML=`<div class="sk-row"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div><div class="sk sk-panel"></div>`;return}
  const fn={resumen:vResumen,propiedades:vPropiedades,contribuciones:vContribuciones,documentos:vDocumentos,contratos:vContratos,pagos:vPagos,gastos:vGastos,informes:vInformes,ajustes:vAjustes}[view]||vResumen;
  const fq=document.activeElement&&document.activeElement.id==="fQ";
  m.innerHTML=(dbState==="none"?`<div class="banner">No hay conexión con Firebase. Revisa FIREBASE_CONFIG en index.html y recarga la página.</div>`:"")+fn();
  if(fq){const i=$("#fQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)}
  enhanceTables();renderUser();
}

