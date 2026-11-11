/* Informes adicionales. Cada uno devuelve {file,title,subtitle,kpis,sections,empty}. Los totales usan finance.js. */
function repRentabilidad(){
  const y=F.anio,pf=x=>!F.prop||x.propiedadId===F.prop;
  const props=S.propiedades.filter(p=>!F.prop||p.id===F.prop).slice().sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));
  const rows=props.map(p=>{
    const I=sum(S.pagos.filter(x=>x.propiedadId===p.id&&(x.fecha||"").startsWith(y)),"monto");
    const G=sum(S.gastos.filter(g=>g.propiedadId===p.id&&cargoPropietario(g)&&(g.fecha||"").startsWith(y)),"monto");
    const C=sum(S.contribuciones.filter(q=>q.propiedadId===p.id&&q.pagada&&(q.fechaPago||"").startsWith(y)),"monto");
    return {p,I,G,C,N:I-G-C};
  });
  const T={I:sum(rows,"I"),G:sum(rows,"G"),C:sum(rows,"C"),N:sum(rows,"N")},av=sum(props,"avaluo");
  const pct=(n,d)=>d>0?(n/d*100).toLocaleString("es-CL",{maximumFractionDigits:2})+"%":"—";
  return {file:"rentabilidad-"+y,title:"Rentabilidad por propiedad",subtitle:`Año ${y} · ${scope()} · base caja (fecha de pago)`,
    kpis:[["Ingresos",clp(T.I)],["Egresos propietario",clp(T.G+T.C)],["Resultado neto",clp(T.N)],["Rentab. s/ avalúo",pct(T.N,av)]],
    sections:rows.length?[{h:"Resultado por propiedad",head:["Propiedad","Ingresos","Mantención","Contribuciones","Resultado","Avalúo fiscal","Rentab. s/ avalúo"],num:[1,2,3,4,5,6],
      rows:rows.map(r=>[propName(r.p.id),clp(r.I),clp(r.G),clp(r.C),clp(r.N),r.p.avaluo?clp(r.p.avaluo):"—",pct(r.N,Number(r.p.avaluo)||0)]),
      foot:["Total",clp(T.I),clp(T.G),clp(T.C),clp(T.N),av?clp(av):"—",pct(T.N,av)]}]:[],
    empty:"No hay propiedades registradas."};
}
function repPagosHist(){
  const y=F.anio,ps=S.pagos.filter(p=>(!F.prop||p.propiedadId===F.prop)&&(p.fecha||"").startsWith(y)).sort((a,b)=>(a.numero||0)-(b.numero||0));
  const porMedio={};ps.forEach(p=>{const m=p.medio||"Otro";porMedio[m]=(porMedio[m]||0)+(Number(p.monto)||0)});
  return {file:"historial-pagos-"+y,title:"Historial de pagos de arriendo",subtitle:`Año ${y} · ${scope()}`,
    kpis:[["Pagos registrados",String(ps.length)],["Total recibido",clp(sum(ps,"monto"))]].concat(Object.entries(porMedio).slice(0,2).map(([m,v])=>[m,clp(v)])),
    sections:ps.length?[{h:"Pagos del año",head:["Recibo","Fecha","Mes pagado","Arrendatario","Propiedad","Medio","Monto"],num:[6],
      rows:ps.map(p=>[nro(p.numero),fdate(p.fecha),fperiod(p.periodo),p.arrendatario||"",p.propiedadNombre||propName(p.propiedadId),p.medio||"—",clp(p.monto)]),
      foot:["Total","","","","","",clp(sum(ps,"monto"))]}]:[],
    empty:`No hay pagos registrados en ${y}.`};
}
function repMantAnual(){
  const gs=S.gastos.filter(g=>!F.prop||g.propiedadId===F.prop),anios=[...new Set(gs.map(g=>(g.fecha||"").slice(0,4)).filter(Boolean))].sort().reverse();
  const rows=anios.map(a=>{const g=gs.filter(x=>(x.fecha||"").startsWith(a)),pr=g.filter(cargoPropietario);return [a,g.length,clp(gTot(g.filter(x=>!esMayor(x)))),clp(gTot(g.filter(esMayor))),clp(gTot(g)),clp(gTot(pr)),clp(gTot(g)-gTot(pr))]});
  return {file:"mantenciones-anuales",title:"Mantenciones por año",subtitle:scope(),
    kpis:[["Años con gastos",String(anios.length)],["Total histórico",clp(gTot(gs))],["Cargo propietario",clp(gTot(gs.filter(cargoPropietario)))],["Cargo arrendatarios",clp(gTot(gs.filter(g=>!cargoPropietario(g))))]],
    sections:rows.length?[{h:"Resumen anual",head:["Año","N° gastos","Menor cuantía","Mayor cuantía","Total","Cargo propietario","Cargo arrendatario"],num:[1,2,3,4,5,6],rows,
      foot:["Total",gs.length,clp(gTot(gs.filter(g=>!esMayor(g)))),clp(gTot(gs.filter(esMayor))),clp(gTot(gs)),clp(gTot(gs.filter(cargoPropietario))),clp(gTot(gs.filter(g=>!cargoPropietario(g))))]}]:[],
    empty:"No hay gastos de mantención registrados."};
}
function repContribuciones(){
  const y=F.anio,cs=S.contribuciones.filter(q=>(!F.prop||q.propiedadId===F.prop)&&String(q.anio)===y);
  const ids=[...new Set(cs.map(q=>q.propiedadId))].sort((a,b)=>propName(a).localeCompare(propName(b)));
  const cel=(id,n)=>{const q=cs.find(x=>x.propiedadId===id&&Number(x.cuota)===n);return q?clp(q.monto)+" · "+(q.pagada?"Pagada":estadoCuota(q).t):"—"};
  const pag=sum(cs.filter(q=>q.pagada),"monto"),tot=sum(cs,"monto"),vencidas=cs.filter(q=>!q.pagada&&q.vencimiento&&daysTo(q.vencimiento)<0);
  return {file:"contribuciones-"+y,title:"Contribuciones de bienes raíces",subtitle:`Año ${y} · ${scope()}`,
    kpis:[["Total del año",clp(tot)],["Pagado",clp(pag)],["Por pagar",clp(tot-pag)],["Cuotas vencidas",String(vencidas.length)]],
    sections:ids.length?[{h:"Cuotas por propiedad",head:["Propiedad","1ª abril","2ª junio","3ª septiembre","4ª noviembre","Total","Pagado"],num:[5,6],
      rows:ids.map(id=>{const r=cs.filter(q=>q.propiedadId===id);return [propName(id),cel(id,1),cel(id,2),cel(id,3),cel(id,4),clp(sum(r,"monto")),clp(sum(r.filter(q=>q.pagada),"monto"))]}),
      foot:["Total","","","","",clp(tot),clp(pag)]}]:[],
    empty:`No hay cuotas de contribuciones registradas en ${y}.`};
}
