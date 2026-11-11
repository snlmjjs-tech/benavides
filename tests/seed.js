/* Datos de prueba (solo para el Firebase simulado). */
(function(){
  const y=new Date().getFullYear(),pad=n=>String(n).padStart(2,"0");
  const d=new Date(),per=y+"-"+pad(d.getMonth()+1);
  window.__seed("propiedades","p1",{nombre:"Casa Los Aromos",tipo:"Casa",direccion:"Av. Central 123",comuna:"San Fernando",rol:"123-45",propietario:"Familia Benavides",avaluo:85000000});
  window.__seed("propiedades","p2",{nombre:"Local Centro",tipo:"Local comercial",direccion:"Calle Chacabuco 45",comuna:"Santa Cruz",rol:"77-8"});
  window.__seed("contratos","k1",{propiedadId:"p1",arrendatario:"Juan Pérez",rut:"12.345.678-9",inicio:(y-1)+"-01-01",termino:"",canon:450000,moneda:"CLP",diaPago:5,garantia:450000,reajuste:"IPC anual"});
  window.__seed("contratos","k2",{propiedadId:"p2",arrendatario:"Ana Soto",inicio:(y-1)+"-03-01",termino:y+"-12-31",canon:12.5,moneda:"UF",diaPago:10});
  window.__seed("pagos","g1",{contratoId:"k1",propiedadId:"p1",arrendatario:"Juan Pérez",rutArrendatario:"12.345.678-9",direccion:"Av. Central 123",comuna:"San Fernando",propiedadNombre:"Casa Los Aromos",periodo:per,fecha:per+"-03",monto:450000,medio:"Transferencia",concepto:"Arriendo mensual",numero:1});
  window.__seed("contribuciones","c1",{propiedadId:"p1",anio:y,cuota:1,monto:100000,vencimiento:y+"-04-30",pagada:true,fechaPago:y+"-04-20"});
  window.__seed("contribuciones","c2",{propiedadId:"p1",anio:y,cuota:4,monto:100000,vencimiento:y+"-11-30",pagada:false});
  window.__seed("gastos","x1",{propiedadId:"p1",fecha:y+"-02-10",cuantia:"menor",categoria:"Gasfitería",cargo:"Propietario",descripcion:"Filtración baño",proveedor:"Pedro",items:[{desc:"Cañería",clase:"Materiales",cant:2,unit:5000},{desc:"Maestro",clase:"Mano de obra",cant:1,unit:40000}],monto:50000});
  window.__seed("gastos","x2",{propiedadId:"p1",fecha:y+"-03-10",cuantia:"menor",categoria:"Pintura",cargo:"Arrendatario",descripcion:"Pintura dormitorio",items:[{desc:"Pintura",clase:"Materiales",cant:1,unit:30000}],monto:30000});
  window.__seed("documentos","d1",{propiedadId:"p1",tipo:"Escritura de compraventa",fecha:"2010-05-05",notaria:"Notaría X"});
  window.__store["config"]={emisor:{nombre:"Familia Benavides",rut:"76.000.000-0",direccion:"Calle 1",telefono:"+56 9 1111 1111",email:"a@b.cl",firmante:"S. Benavides"}};
})();
