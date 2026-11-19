// Filter panel: search box and mode, categories, SDGs, years, reset, typing hints.
// ---------- filter UI ----------
document.getElementById("examples").innerHTML = EXAMPLES.map(e=>`<button type="button">${e}</button>`).join("");
document.getElementById("examples").addEventListener("click", e => { const b=e.target.closest("button"); if(!b) return;
  const q=document.getElementById("q"); q.value=b.textContent; state.q=b.textContent; setSmode(true); refresh(); searchApi();
  document.getElementById("drawer").classList.add("open"); });
function setSmode(on){ state.semantic=on; document.getElementById("examples").hidden=!on;
  aiStat(); if (on && !apiLive && AI_OK) aiLoad();
  document.querySelectorAll(".smode button").forEach(b=>b.setAttribute("aria-pressed", (b.dataset.smode==="meaning")===on));
  document.querySelector(".smode").classList.toggle("meaning", on); document.getElementById("searchBox").classList.toggle("ai", on); typeHints(); }
document.querySelectorAll(".smode button").forEach(b=>b.onclick=()=>{ setSmode(b.dataset.smode==="meaning"); refresh(); searchApi(); });
// Start fetching the model as soon as someone points at "By meaning", so it is ready by the time they type.
document.querySelector('.smode [data-smode="meaning"]').addEventListener("pointerenter", ()=>{ if (!apiLive && AI_OK) aiLoad(); }, { once:true });
function renderQStatus(){
  const el=document.getElementById("qstatus");
  if (!state.q.trim()) { el.innerHTML = state.semantic ? "Describe a topic in your own words, for example one of these:" : "Searches titles, places, authors, keywords, photo narration and project documents."; return; }
  const byMeaning=Object.values(lastWhy).filter(w=>w.meaning).length, total=items.length, res=lastRes;
  if (!state.semantic) el.innerHTML = `${total} keyword match${total===1?"":"es"}`;
  else if (!apiLive && AI_OK && ai.state!=="failed" && !res) el.innerHTML = ai.state==="ready" ? "Searching by meaning…" : "Getting the AI model ready…";
  else if (res?.keywordOnly) el.innerHTML = `The language model is not ready, so these are keyword matches only (${total}).`;
  else if (res?.browser) el.innerHTML = `${total} result${total===1?"":"s"}, ${byMeaning} found by meaning · ranked in ${Math.round(ai.lastMs)} ms`;
  else if (apiLive && !res) el.innerHTML = "Searching by meaning…";
  else el.innerHTML = `${total} result${total===1?"":"s"}, ${byMeaning} found by meaning`;
}
const catsEl = document.getElementById("cats");
const sdgEl = document.getElementById("sdgs");
function buildFilters(){
  years = [...new Set(PROJECTS.map(p=>p.year))].sort();
  sdgList = [...new Set(PROJECTS.flatMap(p=>p.sdgs))].sort((a,b)=>+a.slice(3)-+b.slice(3));
  state.y0 = years[0]; state.y1 = years.at(-1);
  catsEl.innerHTML = Object.entries(CATS).map(([k,c]) => {
    const n = PROJECTS.filter(p=>p.cat===k).length;
    return `<button class="cat" type="button" data-cat="${k}" aria-pressed="${state.cats.has(k)}"><span class="dot" style="background:${c.ink}">${c.g}</span>${c.label}<span class="n">${n}</span></button>`;
  }).join("");
  sdgEl.innerHTML = sdgList.map(s=>{ const n=sdgNum(s), [name,c]=SDGS[n] ?? ["","#666"];
    return `<button class="sdgc" type="button" data-sdg="${s}" aria-pressed="${state.sdgs.has(s)}" style="background:${c}" title="SDG ${n}: ${name}" aria-label="SDG ${n}: ${name}">${n}</button>`; }).join("");
  syncSdgSel();
  for (const id of ["y0","y1"]) document.getElementById(id).innerHTML = years.map(y=>`<option ${y===state[id]?"selected":""}>${y}</option>`).join("");
}
buildFilters();
catsEl.addEventListener("click", e => { const b=e.target.closest(".cat"); if(!b) return;
  const k=b.dataset.cat; state.cats.has(k)?state.cats.delete(k):state.cats.add(k);
  b.setAttribute("aria-pressed", state.cats.has(k)); refresh(); });
function syncSdgSel(){ sdgEl.classList.toggle("has-sel", state.sdgs.size>0);
  document.getElementById("sdgSel").textContent = state.sdgs.size ? "Showing: "+[...state.sdgs].sort((a,b)=>sdgNum(a)-sdgNum(b)).map(s=>SDGS[sdgNum(s)]?.[0]).join(", ") : "Select a goal to filter by it."; }
sdgEl.addEventListener("click", e => { const b=e.target.closest(".sdgc"); if(!b) return;
  const s=b.dataset.sdg; state.sdgs.has(s)?state.sdgs.delete(s):state.sdgs.add(s);
  b.setAttribute("aria-pressed", state.sdgs.has(s)); syncSdgSel(); refresh(); });
for (const id of ["y0","y1"]) {
  const sel=document.getElementById(id);
  sel.addEventListener("change", ()=>{ state[id]=+sel.value;
    if (state.y0>state.y1){ const o=id==="y0" ? "y1" : "y0"; state[o]=state[id]; document.getElementById(o).value=state[id]; }
    refresh(); });
}
document.getElementById("q").addEventListener("input", e=>{ state.q=e.target.value; refresh(); searchApi(); searchPulse(); });
// The search box: a sweep while results are worked out, "/" to jump to it, and example queries typed into the placeholder.
let pulseT;
function searchPulse(){
  const box=document.getElementById("searchBox"); box.classList.toggle("has-q", !!document.getElementById("q").value);
  if (!document.getElementById("q").value) { box.classList.remove("busy"); return; }
  box.classList.add("busy"); clearTimeout(pulseT); pulseT=setTimeout(()=>box.classList.remove("busy"), state.semantic ? 700 : 420);
}
addEventListener("keydown", e=>{
  if (e.key!=="/" || e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains("locked")) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
  if (!story.hidden || !adminEl.hidden || !profileEl.hidden) return;
  e.preventDefault(); if (panel.classList.contains("closed")) document.getElementById("panelOpen")?.click(); document.getElementById("q").focus();
});
const HINTS = { keywords:["Oaxaca","Darién Gap","Nairobi protests","Santiago Ramírez","fishing"], meaning:EXAMPLES };
let hintRun=0;
async function typeHints(){
  const q=document.getElementById("q"), run=++hintRun, base=state.semantic ? "Describe a topic or story" : "Search keywords, places, authors";
  q.placeholder=base;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  await wait(2600);
  for (let i=0; run===hintRun; i++){
    const list=state.semantic ? HINTS.meaning : HINTS.keywords, word=list[i % list.length], pre="Try “";
    if (q.value || document.hidden) { await wait(1500); continue; }
    for (let k=1; k<=word.length && run===hintRun; k++){ q.placeholder=pre+word.slice(0,k)+"”"; await wait(45+Math.random()*40); }
    await wait(1700);
    for (let k=word.length; k>=0 && run===hintRun; k--){ q.placeholder=pre+word.slice(0,k)+(k ? "”" : ""); await wait(22); }
    await wait(350);
  }
}
typeHints();
document.getElementById("reset").addEventListener("click", ()=>{
  state.q=""; document.getElementById("q").value="";
  state.cats=new Set(Object.keys(CATS)); state.sdgs.clear(); state.y0=years[0]; state.y1=years.at(-1);
  document.querySelectorAll(".cat").forEach(b=>b.setAttribute("aria-pressed","true"));
  document.querySelectorAll(".sdgc").forEach(b=>b.setAttribute("aria-pressed","false")); syncSdgSel(); apiSearch=null;
  document.getElementById("y0").value=state.y0; document.getElementById("y1").value=state.y1; refresh();
});

const panel=document.getElementById("panel"), panelOpen=document.getElementById("panelOpen");
function setPanel(open){ panel.classList.toggle("closed",!open); panelOpen.hidden=open; draw(); }
document.getElementById("panelClose").onclick=()=>setPanel(false);
panelOpen.onclick=()=>setPanel(true);

