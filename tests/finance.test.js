const {open}=require("./harness"),fs=require("fs"),path=require("path");
const seed=fs.readFileSync(path.join(__dirname,"seed.js"),"utf8");
let fails=0;const eq=(a,b,m)=>{const ok=JSON.stringify(a)===JSON.stringify(b);console.log((ok?"  ✓ ":"  ✗ ")+m+(ok?"":`  → esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`));if(!ok)fails++};
(async()=>{
  const t=await open({seed});const p=t.page;await p.waitForSelector(".kpis");
  const r=await p.evaluate(()=>{const y=String(new Date().getFullYear()),per=curPeriod(),cb=cobranza(per);
    return {y,cb:{contratadoClp:cb.contratado.clp,contratadoUf:cb.contratado.uf,n:cb.contratado.n,cobrado:cb.cobradoClp,pagados:cb.pagados.length,resto:cb.atrasados.length+cb.pendientes.length,restoUf:cb.atrasado.uf+cb.pendiente.uf},
      feb:flujoMes(y+"-02"),mar:flujoMes(y+"-03"),abr:flujoMes(y+"-04"),mesAct:flujoMes(per),ba:balanceAnio(y),
      venc:vencimientos().map(v=>v.tipo),act:actividad(20).length,
      serie:serieMeses(per,12).length,add:[addMonths("2026-11",3),addMonths("2026-01",-2),addMonths("2026-12",1)],
      suma:sum([{a:"1000"},{a:500},{}],"a")}});
  console.log("Cobranza del mes");
  eq(r.cb.contratadoClp,450000,"contratado CLP = 450.000");eq(r.cb.contratadoUf,12.5,"contratado UF = 12,5 (no se mezcla con CLP)");eq(r.cb.n,2,"2 contratos vigentes");
  eq(r.cb.cobrado,450000,"cobrado = pagos registrados del período");eq(r.cb.pagados,1,"1 arriendo pagado");eq(r.cb.resto,1,"1 arriendo sin pagar (pendiente o atrasado)");eq(r.cb.restoUf,12.5,"pendiente en UF = 12,5");
  console.log("Flujo de caja");
  eq([r.feb.I,r.feb.G,r.feb.C,r.feb.neto],[0,50000,0,-50000],"febrero: gasto propietario resta");
  eq([r.mar.G,r.mar.neto],[0,0],"marzo: gasto a cargo del arrendatario NO resta");
  eq([r.abr.C,r.abr.neto],[100000,-100000],"abril: contribución pagada resta");
  eq(r.mesAct.I,450000,"mes actual: ingresos = 450.000");
  console.log("Balance anual");
  eq([r.ba.I,r.ba.G,r.ba.C,r.ba.E,r.ba.neto,r.ba.gastosArrendatario],[450000,50000,100000,150000,300000,30000],"ingresos 450.000 − egresos 150.000 = 300.000; arrendatario 30.000 aparte");
  console.log("Otros");
  eq(r.venc.includes("Contribución")&&r.venc.includes("Contrato"),true,"vencimientos incluyen contribución y contrato por vencer");
  eq(r.act,4,"actividad: 1 pago + 2 gastos + 1 contribución pagada = 4 ítems");
  eq(r.serie,12,"serie de 12 meses");eq(r.add,["2027-02","2025-11","2027-01"],"addMonths cruza años");eq(r.suma,1500,"sum() tolera strings y vacíos");
  eq(t.errors,[],"sin errores de consola");
  await t.close();console.log(fails?"\nFALLAS: "+fails:"\nTODO OK");process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
