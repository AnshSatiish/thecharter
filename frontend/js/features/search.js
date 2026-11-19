// Keyword ranking in the page, and calls to the backend's search (keyword / hybrid).
// ---------- keyword ranking in the page ----------
// Without the backend, keywords are ranked here by the backend's rules: capitals and accents are ignored
// ("darien" finds "Darién"), filler words are dropped, every word typed must start a word in the project
// (otherwise any word may), and where a word is found sets its score: title 1, tags 0.6, text 0.3.
const KW_STOP = new Set("a an and are as at be by for from has have in into is it its of on or that the their this to was were with".split(" "));
const KW_W = { title:1, tags:0.6, body:0.3 };
const RRF_K = 60;   // reciprocal rank fusion: rank 1 scores 1/61, rank 2 scores 1/62, and so on
const fold = s => String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function kwTerms(q){ const t=fold(q).match(/[\p{L}\p{N}]+/gu) ?? []; const c=t.filter(w=>!KW_STOP.has(w)); return c.length ? c : t; }
let kwCache = { key:"", fields:new Map() };
function kwFields(p){
  const key = PROJECTS.length+":"+(PROJECTS.at(-1)?.id ?? "");
  if (kwCache.key!==key) kwCache = { key, fields:new Map() };
  let f = kwCache.fields.get(p.id);
  if (!f) { f = { title:fold(p.title), tags:fold([...(p.kw ?? []), p.loc, p.author, p.aff].join(" | ")),
    body:fold([p.desc, p.summary, ...(p.caps ?? [])].join(" | ")) }; kwCache.fields.set(p.id, f); }
  return f;
}
// Projects with every word, best score first (ties keep the library's order); if none, projects with any word unless strict.
function keywordRank(q, strict=false){
  const terms=kwTerms(q); if (!terms.length) return [];
  const pats=terms.map(t=>new RegExp(`(?<![\\p{L}\\p{N}])${reEsc(t)}`, "u"));
  const scored=[];
  for (const p of PROJECTS){
    const f=kwFields(p);
    const per=pats.map(re=>Math.max(0, ...Object.keys(KW_W).filter(k=>re.test(f[k])).map(k=>KW_W[k])));
    const matched=per.filter(Boolean).length;
    if (matched) scored.push({ id:p.id, matched, score:per.reduce((a,b)=>a+b, 0)/terms.length });
  }
  const all=scored.filter(s=>s.matched===terms.length);
  return (all.length ? all : strict ? [] : scored).sort((a,b)=>b.score-a.score);
}
let kwLocal = null;
function localKeywordSearch(q, whole){
  if (kwLocal && kwLocal.q===q && kwLocal.whole===whole && kwLocal.key===kwCache.key) return kwLocal;
  const hits=new Map(keywordRank(q).map((h,i)=>[h.id, { rank:i, matched_by:["keyword"], score:h.score }]));
  return kwLocal={ q, whole, key:kwCache.key, semantic:false, keywordOnly:!whole, hits, browser:true };
}

function visibleItems(){
  const q = state.q.trim().toLowerCase();
  const aiDown = !AI_OK || ai.state==="failed";
  // No backend: "Keywords" is ranked in the page, and so is "By meaning" when the model cannot run in this browser.
  const res = currentSearch() ?? (q && !apiLive && (!state.semantic || aiDown) ? localKeywordSearch(state.q.trim(), !state.semantic) : null);
  const why = {};
  const list = PROJECTS.filter(p => {
    if (!(state.cats.has(p.cat) && p.year>=state.y0 && p.year<=state.y1 &&
      (!state.sdgs.size || p.sdgs.some(s=>state.sdgs.has(s))))) return false;
    if (!q) return true;
    const inPage = [p.title,p.author,p.loc,p.aff,p.desc,p.summary,...p.kw,...(p.caps ?? [])].join(" ").toLowerCase().includes(q);
    const h = res?.hits.get(p.id);
    if (h) {
      if (h.matched_by.includes("semantic") && h.passage) why[p.id] = { meaning:true,
        label:`Related by meaning${h.matched_by.includes("keyword") ? " and keywords" : ""} · similarity ${h.similarity.toFixed(2)}`, sim:h.similarity,
        passage:(h.passage_document ? `From “${h.passage_document}”: ` : "") + h.passage };
      else if (!inPage && p.docs?.length) why[p.id] = {label:"Found in the project document"};
      return true;
    }
    if (res?.semantic || res?.whole) return false;   // the ranking is the whole answer
    if (inPage) return true;
    return false;
  });
  // Best match first when the backend ranked them; anything matched only in the page follows.
  if (res) { const rank = p => res.hits.get(p.id)?.rank ?? 1e9; list.sort((a,b)=>rank(a)-rank(b)); }
  lastWhy = why; lastRes = res;
  if (!state.researchers) return list.map(p=>({kind:"project", id:"p"+p.id, p, lng:p.lng, lat:p.lat, why:why[p.id]}));
  // researcher mode: same filters, show the people behind the work
  return list.map(p=>({kind:"person", id:"r"+p.id, p, lng:p.lng+0.8, lat:p.lat+0.6,
    journalist:/journalist|photographer|reporter/i.test(p.prof)}));
}

let lastWhy = {}, lastRes = null;   // what the last visibleItems() used, so the status line describes the same search
let apiSearch = null, qTimer = null;
// The backend's answer, if it is for what is in the search box right now.
const currentSearch = () => apiSearch && apiSearch.q===state.q.trim() && apiSearch.semantic===state.semantic ? apiSearch : null;
// "Keywords" asks for full-text matches (these also cover the text of uploaded PDFs, which the page does not hold).
// "By meaning" asks for hybrid results: the sentence model's ranking merged with the keyword matches.
function searchApi(){
  clearTimeout(qTimer);
  const q=state.q.trim(), semantic=state.semantic;
  if (!q) { apiSearch=null; return; }
  if (!apiLive) { if (semantic && AI_OK) qTimer=setTimeout(()=>browserSearch(q), 200); return; }
  qTimer=setTimeout(async()=>{
    try { const r=await fetch(`${API_BASE}/api/projects/search?q=${encodeURIComponent(q)}&mode=${semantic?"hybrid":"keyword"}&limit=50`,
        { signal:AbortSignal.timeout(8000) });
      if (!r.ok) return searchHere(q, semantic);   // 503 busy, or any other failure
      const body=await r.json(); if (state.q.trim()!==q || state.semantic!==semantic) return;
      apiSearch={ q, semantic, model:body.model, keywordOnly: semantic && body.mode_used==="keyword",
        hits:new Map(body.results.map((h,i)=>[String(h.project.id), {rank:i, matched_by:h.matched_by, similarity:h.similarity,
          passage:h.passage, passage_document:h.passage_document}])) };
      refresh(); } catch { searchHere(q, semantic); }   // unreachable or too slow
  }, 250);
}
// The backend did not answer: search in this page instead, by meaning in the browser if the model can run here.
function searchHere(q, semantic){
  if (state.q.trim()!==q || state.semantic!==semantic) return;
  if (semantic && AI_OK && ai.state!=="failed") return browserSearch(q);
  apiSearch={ ...localKeywordSearch(q, !semantic), semantic, keywordOnly:semantic };
  refresh();
}
