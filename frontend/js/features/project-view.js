// Full project page, photo viewer (lightbox) and nearby projects.
// ---------- story view ----------
const story=document.getElementById("story");
// Remember what had focus when an overlay opens, and give it back when the overlay closes.
const focusBefore={};
function rememberFocus(k){ focusBefore[k]=document.activeElement; }
function restoreFocus(k){ const el=focusBefore[k]; focusBefore[k]=null; if (el && el.isConnected && el.offsetParent!==null) el.focus(); }
function openStory(p){
  rememberFocus("story"); adminEl.hidden=true; syncHeader(); profileEl.hidden=true;
  const c=CATS[p.cat];
  const pics=Array.from({length:p.imgs},(_,i)=>`<figure><button class="shot" type="button" data-i="${i}" aria-label="View photograph ${i+1} full screen"><img src="${img(p,i)}" alt="Photograph ${i+1} from ${esc(p.title)}" loading="lazy"></button>${p.caps?.[i] ? `<figcaption>${esc(p.caps[i])}</figcaption>` : ""}</figure>`).join("");
  story.innerHTML=`<nav class="crumbs" aria-label="You are here"><button type="button" class="home" id="storyClose">Map</button><span aria-hidden="true">/</span><span aria-current="page">Project</span><span class="end">${saveBtn(p,"btn save-btn")}</span></nav>
    <div class="hero" style="background-image:url('${imgFull(p)}')"></div>
    <article class="story-in">
      <h2>${esc(p.title)}</h2>
      <div class="story-who"><span class="av" style="background:${c.ink}">${esc(initials(p.author))}</span>
        <div class="who-t"><span class="name">${esc(p.author)} ${p.verified?CHECK:""}</span>
        <span class="aff"><b>${esc(affCode(p.aff))}</b>${esc(p.prof)} · ${esc(p.aff)}</span></div></div>
      <dl class="facts">
        <div><dt>Location</dt><dd>${esc(p.loc)}</dd></div>
        <div><dt>Date</dt><dd>${fmtDate(p.date)}</dd></div>
        <div><dt>Category</dt><dd>${esc(c.label)}</dd></div>
        <div><dt>Status</dt><dd>${p.verified?"Curated and checked":"Curation pending"}</dd></div>
      </dl>
      <p class="lede">${esc(p.desc)}</p>
      <div class="grid">${pics}</div>
      ${p.summary ? `<h5>Summary</h5><p class="sum">${esc(p.summary)}</p>` : ""}
      ${p.docs?.length ? `<h5>Project document</h5><div class="docs">${p.docs.map(d=>`<a href="${esc(/^https?:/.test(d.url) || !d.url.startsWith("/") ? d.url : API_BASE+d.url)}" target="_blank" rel="noopener">${esc(d.title || d.filename)} <svg class="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5"/></svg><span>PDF${d.pages ? ` · ${d.pages} page${d.pages===1?"":"s"}` : ""}${d.size_bytes ? ` · ${fmtSize(d.size_bytes)}` : ""}</span></a>`).join("")}</div>` : ""}
      ${p.sdgs.length ? `<h5>UN Sustainable Development Goals</h5><div class="kws">${p.sdgs.map(sdgTile).join("")}</div>` : ""}
      <h5>Keywords</h5><div class="kws">${p.kw.map(k=>`<span>${esc(k)}</span>`).join("")}</div>
      <h5>Nearby projects · within 2,000 km</h5><div class="nearby" id="nearby"><p style="color:#9d9387;font-size:13px;margin:0">Loading…</p></div>
      ${p.web?`<h5>Author</h5><p class="links"><a href="${esc(p.web)}" target="_blank" rel="noopener">Photographer website <svg class="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5"/></svg></a></p>`:""}
      <p style="color:#8d8377;font-size:12px;margin-top:32px">Photographs remain the property of their author. Mockup, sample data.</p>
    </article>`;
  story.hidden=false; story.scrollTop=0; syncHeader();
  document.getElementById("storyClose").onclick=closeStory;
  document.getElementById("storyClose").focus();
  story.querySelectorAll(".shot").forEach(b=>b.onclick=()=>openLb(p,+b.dataset.i));
  story.querySelector(".hero").onclick=()=>openLb(p,0);
  loadNearby(p);
}
// Full-screen photo viewer: arrows or swipe-free buttons to move, Esc to close.
const lbEl=document.getElementById("lb"); let lbState={p:null,i:0};
function openLb(p,i){ rememberFocus("lb"); lbState={p,i}; lbEl.hidden=false; showLb(); document.getElementById("lbClose").focus(); }
function showLb(){ const {p,i}=lbState, n=p.imgs;
  const im=document.getElementById("lbImg"); im.classList.add("loading"); im.onload=im.onerror=()=>im.classList.remove("loading"); im.src=imgFull(p,i); im.alt=`Photograph ${i+1} from ${p.title}`;
  document.getElementById("lbCount").textContent=`${i+1} / ${n} · ${p.author}`;
  document.getElementById("lbCap").textContent=p.caps?.[i] ?? "";
  document.getElementById("lbPrev").disabled=i===0; document.getElementById("lbNext").disabled=i===n-1; }
function stepLb(d){ const n=lbState.p.imgs, i=lbState.i+d; if (i<0 || i>=n) return; lbState.i=i; showLb(); }
function closeLb(){ lbEl.hidden=true; restoreFocus("lb"); }
document.getElementById("lbClose").onclick=closeLb;
document.getElementById("lbPrev").onclick=()=>stepLb(-1);
document.getElementById("lbNext").onclick=()=>stepLb(1);
lbEl.addEventListener("click",e=>{ if (e.target===lbEl || e.target.tagName==="FIGURE") closeLb(); });
addEventListener("keydown",e=>{ if (lbEl.hidden) return; if (e.key==="ArrowLeft") stepLb(-1); if (e.key==="ArrowRight") stepLb(1); });
// Live: PostGIS ST_DWithin via GET /api/projects/near. Offline: the same great-circle distance computed here.
async function loadNearby(p){
  const el=document.getElementById("nearby"); let rows;
  try {
    if (!apiLive) throw new Error("offline");
    const r=await fetch(`${API_BASE}/api/projects/near?lat=${p.lat}&lng=${p.lng}&km=2000`);
    if (!r.ok) throw new Error(r.status);
    rows=(await r.json()).map(x=>({p:fromApi(x), km:x.distance_km}));
  } catch {
    rows=PROJECTS.map(x=>({p:x, km:d3.geoDistance([p.lng,p.lat],[x.lng,x.lat])*6371})).filter(x=>x.km<=2000).sort((a,b)=>a.km-b.km);
  }
  rows=rows.filter(x=>x.p.id!==p.id);
  if (!document.getElementById("nearby")) return;
  el.innerHTML = rows.length ? rows.map(x=>`<button type="button" data-id="${x.p.id}">${esc(x.p.title)}<span>${Math.round(x.km).toLocaleString()} km</span></button>`).join("")
    : '<p style="color:#9d9387;font-size:13px;margin:0">No other projects within 2,000 km yet.</p>';
  el.onclick=e=>{ const b=e.target.closest("button"); if(!b) return; const d=items.find(i=>i.p.id===b.dataset.id);
    closeStory(); if (d) select(d); };
}
function closeStory(){ story.hidden=true; syncHeader(); draw(); restoreFocus("story"); }
addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(document.body.classList.contains("locked")) return; if(!lbEl.hidden) closeLb(); else if(picking) endPick(); else if(!profileEl.hidden) closeProfile(); else if(!adminEl.hidden) $("adminClose").click(); else if(!story.hidden) closeStory(); else if(!sitePg.hidden) closeSitePage(); else if(drawer.classList.contains("open")) drawer.classList.remove("open"); else closeCard(); }});

