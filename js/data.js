/* ---------- persistencia ---------- */
async function guardar(col,id,data){
  if(!db)throw new Error("Sin conexión con la base de datos. Inicia sesión.");
  try{ if(id) await db.collection(col).doc(id).set(data); else await db.collection(col).add(data); }
  catch(e){ throw new Error(e&&e.code==="permission-denied"?"No tienes permiso para modificar estos datos.":e&&e.code==="resource-exhausted"?"Se alcanzó el límite de uso de Firebase.":"No se pudo guardar. Intenta de nuevo."); }
}
async function borrar(col,id){
  if(!db)return;
  const el=document.querySelector(`#main [data-id="${id}"]`),row=el&&el.closest("tr,.li");
  if(row&&!matchMedia("(prefers-reduced-motion:reduce)").matches){row.classList.add("row-del");await new Promise(r=>setTimeout(r,230))}
  await db.collection(col).doc(id).delete();
}
const PERMITIDOS=["application/pdf","image/png","image/jpeg","image/webp","image/gif"];
async function subir(file){
  if(!assets)throw new Error("Inicia sesión para adjuntar archivos.");
  let type=file.type;
  if(!PERMITIDOS.includes(type)){const ext=(file.name.split(".").pop()||"").toLowerCase();type={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp"}[ext];}
  if(!type)throw new Error("Formato no admitido. Sube el documento en PDF o como imagen (JPG, PNG).");
  try{const r=await assets.upload(file,{type});return {archivoId:r.id,archivoUrl:r.url,archivoNombre:file.name,archivoTipo:type};}
  catch(e){throw new Error(e&&e.code==="storage/unauthorized"?"No tienes permiso para subir archivos.":e&&e.code==="storage/quota-exceeded"?"No queda espacio para archivos.":"No se pudo subir el archivo.");}
}

