// Search by meaning in the browser (bge-small-en-v1.5 via transformers.js) when the backend is down.
// ---------- search by meaning in the browser ----------
// Without the backend (the deployed site), "By meaning" runs the embedding model the backend uses,
// bge-small-en-v1.5, inside the visitor's browser with Transformers.js: no server and no key. The model
// (34 MB) downloads once and the browser keeps it. Every project is cut into passages of whole sentences,
// the passages and the query are embedded, and each project scores the cosine similarity of its best passage.
var AI_OK = typeof WebAssembly === "object";
const AI_MODEL = "Xenova/bge-small-en-v1.5", AI_LABEL = "bge-small-en-v1.5";
const AI_QUERY = "Represent this sentence for searching relevant passages: ";   // bge's instruction for queries
const AI_MIN = 0.55, AI_REL = 0.9;   // a passage counts if it scores at least 0.55 and within 90% of the best one (set on the sample projects: off-topic queries peak near 0.50)
var ai = { state:"idle", extractor:null, index:null, key:"", promise:null, progress:0, mb:0, total:34, passages:0, lastMs:0 };
function aiStat(){
  const box=document.getElementById("aiStat");
  box.hidden = !(state.semantic && !apiLive && AI_OK);
  box.className="aistat "+ai.state;
  const msg = {
    idle: `Model ${AI_LABEL}. It loads when you search (${ai.total} MB, once).`,
    loading: `Downloading the model… ${ai.mb.toFixed(0)} of ${ai.total.toFixed(0)} MB`,
    indexing: `Reading ${PROJECTS.length} projects into vectors…`,
    ready: `${AI_LABEL} ready · ${ai.passages} passages from ${PROJECTS.length} projects${ai.lastMs ? ` · last search ${Math.round(ai.lastMs)} ms` : ""}`,
    failed: "The AI model could not run in this browser, so these are keyword matches only.",
  }[ai.state];
  document.getElementById("aiMsg").innerHTML=`<span class="dot"></span><span>${esc(msg)}</span>`;
  document.getElementById("aiBar").style.width = ai.state==="loading" ? Math.round(ai.progress*100)+"%" : "";
}
function aiSentences(text){
  return String(text||"").replace(/\s+/g," ").split(/(?<=[.!?…])\s+(?=["“‘(A-Z0-9])/).map(s=>s.trim()).filter(Boolean);
}
function aiChunks(text, max=40){
  const out=[]; let cur=[], n=0;
  for (const s of aiSentences(text)){
    const w=s.split(" ").length;
    if (cur.length && n+w>max){ out.push(cur.join(" ")); const last=cur.at(-1); cur = last.split(" ").length+w<=max ? [last] : []; n=cur.join(" ").split(" ").filter(Boolean).length; }
    cur.push(s); n+=w;
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}
function aiPassages(p){
  const head=[p.title, p.loc, (p.kw||[]).join(", ")].filter(Boolean).join(". ");
  const all=[head, ...[p.desc, p.summary, ...(p.caps||[])].flatMap(b=>aiChunks(b))];
  return [...new Set(all.filter(s=>s && s.trim()))];
}
async function aiEmbed(texts){ return (await ai.extractor(texts, { pooling:"cls", normalize:true })).tolist(); }
function aiLoad(){
  if (ai.promise) return ai.promise;
  ai.promise=(async()=>{
    ai.state="loading"; aiStat();
    const { pipeline, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");
    env.allowLocalModels=false;
    const files={};
    ai.extractor = await pipeline("feature-extraction", AI_MODEL, { dtype:"q8", progress_callback:e=>{
      if (e.status==="progress" && e.total){ files[e.file]=[e.loaded, e.total];
        const sum=Object.values(files).reduce((a,[l,t])=>[a[0]+l, a[1]+t],[0,0]);
        ai.progress=sum[0]/sum[1]; ai.mb=sum[0]/1048576; ai.total=Math.max(ai.total, sum[1]/1048576); aiStat(); } } });
    ai.state="indexing"; aiStat();
    await aiIndex();
    ai.state="ready"; aiStat();
  })().catch(err=>{ console.warn("AI search unavailable:", err); ai.state="failed"; aiStat(); refresh(); });
  return ai.promise;
}
async function aiIndex(){
  const key=PROJECTS.map(p=>p.id+":"+p.title).join("|");
  if (ai.index && ai.key===key) return;
  const rows=PROJECTS.flatMap(p=>aiPassages(p).map((text,i)=>({ id:p.id, text, head:i===0 })));
  const vectors=[];
  for (let i=0; i<rows.length; i+=16) vectors.push(...await aiEmbed(rows.slice(i, i+16).map(r=>r.text)));
  rows.forEach((r,i)=>r.v=vectors[i]);
  ai.index=rows; ai.key=key; ai.passages=rows.length;
}
async function browserSearch(q){
  if (ai.state!=="ready"){ aiLoad().then(()=>{ if (ai.state==="ready" && state.q.trim()===q && state.semantic) browserSearch(q); }); return; }
  await aiIndex();
  const t0=performance.now();
  const [qv]=await aiEmbed([AI_QUERY+q]);
  const best=new Map();
  for (const r of ai.index){
    let s=0; for (let k=0; k<qv.length; k++) s+=qv[k]*r.v[k];
    const b=best.get(r.id) ?? { s:-1, body:-1 };
    if (s>b.s) b.s=s;
    if (!r.head && s>b.body){ b.body=s; b.text=r.text; }
    if (b.text===undefined) b.text=r.text;
    best.set(r.id, b);
  }
  const ranked=[...best].sort((a,b)=>b[1].s-a[1].s);
  const floor=Math.max(AI_MIN, (ranked[0]?.[1].s ?? 0)*AI_REL);
  ai.lastMs=performance.now()-t0;
  if (state.q.trim()!==q || !state.semantic) return;
  // Hybrid, as on the backend: the ranking by meaning and the projects containing every word typed are merged by
  // reciprocal rank fusion. A project scores 1/(60 + its place) in each list, so one high in both lists comes first.
  const fused=new Map();
  ranked.filter(([,b])=>b.s>=floor).forEach(([id,b],i)=>fused.set(id, { score:1/(RRF_K+i+1), matched_by:["semantic"], similarity:b.s, passage:b.text }));
  keywordRank(q, true).forEach((h,i)=>{
    const f=fused.get(h.id) ?? { score:0, matched_by:[], similarity:0 };
    f.score+=1/(RRF_K+i+1); f.matched_by.push("keyword"); fused.set(h.id, f);
  });
  const hits=new Map([...fused].sort((a,b)=>b[1].score-a[1].score || b[1].similarity-a[1].similarity).map(([id,f],i)=>[id, { ...f, rank:i }]));
  apiSearch={ q, semantic:true, model:AI_LABEL, keywordOnly:false, hits, browser:true };
  refresh(); aiStat();
}

