/* Firebase simulado en memoria para pruebas. Nunca toca el proyecto real. */
(function(){
  const store={}; // col -> {id:data}
  const subs=[];  // {path,cb}
  let n=0;
  const col=c=>store[c]||(store[c]={});
  const snapCol=c=>({docs:Object.entries(col(c)).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d))}))});
  const notify=c=>subs.filter(s=>s.col===c).forEach(s=>setTimeout(()=>s.cb(s.doc?snapDoc(c,s.doc):snapCol(c)),0));
  const snapDoc=(c,id)=>({exists:!!col(c)[id],data:()=>JSON.parse(JSON.stringify(col(c)[id]||{}))});
  function docRef(c,id){return {id,
    set:async d=>{col(c)[id]=JSON.parse(JSON.stringify(d));window.__writes.push(["set",c,id]);notify(c)},
    delete:async()=>{delete col(c)[id];window.__writes.push(["delete",c,id]);notify(c)}}}
  function colRef(c){return {
    doc:id=>docRef(c,id||("auto"+(++n))),
    add:async d=>{const id="auto"+(++n);col(c)[id]=JSON.parse(JSON.stringify(d));window.__writes.push(["add",c,id]);notify(c);return {id}},
    onSnapshot:(ok)=>{const s={col:c,cb:ok};subs.push(s);setTimeout(()=>ok(snapCol(c)),0);return()=>{}}}}
  window.__writes=[];
  window.__seed=(c,id,d)=>{col(c)[id]=d};
  window.__store=store;
  const fs={collection:colRef,
    doc:path=>{const [c,id]=path.split("/");return {...docRef(c,id),onSnapshot:(ok)=>{const s={col:c,doc:id,cb:ok};subs.push(s);setTimeout(()=>ok(snapDoc(c,id)),0);return()=>{}}}}};
  window.firebase={
    initializeApp(){},
    auth:()=>({onAuthStateChanged:cb=>setTimeout(()=>cb(window.__loggedOut?null:{uid:"test"}),0),signInWithEmailAndPassword:async()=>{}}),
    firestore:()=>fs,
    storage:()=>({ref:p=>({put:async()=>{},getDownloadURL:async()=>"https://example.test/"+p})})
  };
})();
