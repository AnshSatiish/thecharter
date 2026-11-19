// Results drawer, and refresh(): recompute what is visible and redraw.
// ---------- results drawer ----------
function renderList(){
  document.getElementById("count").textContent=items.length;
  document.getElementById("drawerTitle").textContent = state.researchers ? `Researchers (${items.length})` : `Projects (${items.length})`;
  const list=document.getElementById("list");
  if (!items.length){ list.innerHTML = !state.q.trim() ? '<p class="empty">Nothing matches these filters. Clear a filter to see more.</p>'
      : !state.semantic ? '<p class="empty">No keyword matches. Try another word, or switch to “By meaning”.</p>'
      : apiLive && !currentSearch() ? '<p class="empty">Searching…</p>'
      : '<p class="empty">Nothing in the library is close to that. Try describing the topic another way.</p>'; return; }
  list.innerHTML=items.map((d,i)=>{ const p=d.p;
    const th = d.kind==="project" ? `<span class="th" style="background-image:url('${img(p)}')"></span>`
      : `<span class="th" style="background:${d.journalist?"#F68B1F":"#111"}">${esc(initials(p.author))}</span>`;
    return `<button class="item" type="button" data-i="${i}">${th}<span><h4>${esc(d.kind==="project"?p.title:p.author)}</h4>
      <p>${esc(d.kind==="project"?p.author+" · "+p.year:(d.journalist?"Journalist":"Academic")+" · "+p.aff)}</p><p>${esc(p.loc)}</p>${d.why?`<p class="why">${esc(d.why.label)}${d.why.sim!=null?`<span class="simbar" aria-hidden="true"><i style="width:${Math.round(Math.max(0,Math.min(1,d.why.sim))*100)}%"></i></span>`:""}</p>${d.why.passage?`<p class="whyq">${esc(d.why.passage)}</p>`:""}`:""}</span></button>`;}).join("");
}
document.getElementById("list").addEventListener("click",e=>{ const b=e.target.closest(".item"); if(!b) return;
  if (innerWidth<760) drawer.classList.remove("open"); select(items[+b.dataset.i]); });

function refresh(){
  items=visibleItems();
  if (card._d && !items.some(d=>d.id===card._d.id)) closeCard();
  renderPins(); renderList(); renderQStatus(); draw();
}

