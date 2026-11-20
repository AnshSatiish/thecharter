// Section pages: New entries, Community, Events, Sponsors (lists kept in Supabase).
// ---------- section pages: New entries, Community, Events, Sponsors ----------
// New entries and Community are built from the projects in the library. Events and Sponsors are lists that
// administrators keep in Supabase (supabase/migrations/002_pages.sql); they start empty rather than with made-up entries.
const PAGES = {
  entries:   { title:"New entries", lede:"The newest work in the library, most recent first. Each project shows whether a curator has checked it yet." },
  community: { title:"Community",   lede:"The photographers and researchers whose work is in the library, and the institutions they work with." },
  events:    { title:"Events",      lede:"Exhibitions, talks, screenings and workshops connected to the work in the library." },
  sponsors:  { title:"Sponsors",    lede:"The Charter is free for students and researchers. These organisations help keep it running." },
};
const EVENT_KINDS = { exhibition:"Exhibition", talk:"Talk", workshop:"Workshop", screening:"Screening", fieldwork:"Fieldwork", other:"Event" };
const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/i.test(u || "") ? u : null;
let entryFilter="all";
const listings={ events:null, sponsors:null }, listingErr={};

function openSitePage(name){
  if (!PAGES[name]) return;
  rememberFocus("site");
  if (!lbEl.hidden) lbEl.hidden=true;
  story.hidden=true; adminEl.hidden=true; profileEl.hidden=true; drawer.classList.remove("open"); closeCard();
  curPage=name; sitePg.hidden=false; sitePg.scrollTop=0;
  renderSitePage(); syncHeader();
  sitePg.querySelector("h1")?.focus({preventScroll:true});
}
function closeSitePage(){
  if (sitePg.hidden) return;
  sitePg.hidden=true; curPage=null; syncHeader(); draw(); restoreFocus("site");
}
document.querySelectorAll(".nav [data-page]").forEach(b=>b.onclick=()=>{ openSitePage(b.dataset.page); setMenu(false); });
const menuBtn=document.getElementById("menuBtn"), navList=document.getElementById("navList");
function setMenu(open){ navList.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); }
menuBtn.onclick=e=>{ e.stopPropagation(); setMenu(!navList.classList.contains("open")); };
document.addEventListener("click", e=>{ if (navList.classList.contains("open") && !e.target.closest("#navList")) setMenu(false); });
navList.querySelectorAll("a,button").forEach(el=>el.addEventListener("click", ()=>setMenu(false)));

// each site page opens on a passport-cover band: teal, gold title, the same guilloche as the profile passport
function bandRosette(){
  const a=Array.from({length:40},(_,i)=>`<ellipse rx="300" ry="34" transform="rotate(${i*4.5})"/>`).join("");
  const b=Array.from({length:30},(_,i)=>`<ellipse rx="190" ry="20" transform="rotate(${i*6})"/>`).join("");
  return `<svg class="band-rosette" viewBox="0 0 600 600" aria-hidden="true">
    <g fill="none" stroke="#e3c98f" stroke-opacity=".16" stroke-width=".8" transform="translate(560 540)">${a}</g>
    <g fill="none" stroke="#e3c98f" stroke-opacity=".1" stroke-width=".7" transform="translate(560 540)">${b}</g></svg>`;
}
function pageShell(name, body, band=""){
  return `<div class="sp-band">${bandRosette()}<div class="sp-band-in"><nav class="crumbs" aria-label="You are here"><button type="button" class="home" data-sp-home>Map</button><span aria-hidden="true">/</span><span aria-current="page">${PAGES[name].title}</span></nav>
    <header class="sp-head"><h1 class="page-h" tabindex="-1">${PAGES[name].title}</h1><p class="lede2">${PAGES[name].lede}</p></header>${band}</div></div>
    <div class="sp-in">${body}</div>`;
}
const emptyBox = (title, text) => `<div class="sp-emptybox"><p class="t">${title}</p><p>${text}</p></div>`;
function renderSitePage(){
  const n=curPage; if (!n) return;
  sitePg.setAttribute("aria-label", PAGES[n].title);
  sitePg.innerHTML = n==="entries" ? entriesHTML() : n==="community" ? communityHTML() : n==="events" ? eventsHTML() : sponsorsHTML();
  if (n==="events" || n==="sponsors") loadListing(n);
}

// --- New entries
function entryCard(p){
  const c=CATS[p.cat] ?? CATS.news;
  return `<article class="ecard">
    <button type="button" class="ecard-img" data-open="${esc(p.id)}" aria-label="Open ${esc(p.title)}"><img src="${esc(img(p))}" alt="" loading="lazy"><span class="cat-tag" style="background:${c.ink}">${esc(c.label)}</span></button>
    <div class="b"><div class="badges">${p.uploaded ? '<span class="badge up">Uploaded</span>' : ""}${p.verified ? '<span class="badge ok">Curated</span>' : '<span class="badge wait">Curation pending</span>'}</div>
      <h3><button type="button" data-open="${esc(p.id)}">${esc(p.title)}</button></h3>
      <p class="m">${esc(p.author)}${p.aff ? ` · ${esc(p.aff)}` : ""}</p>
      <p class="m">${esc(p.loc)} · ${p.date ? fmtDate(String(p.date).slice(0,10)) : p.year}</p>
      <div class="acts"><button type="button" class="btn" data-map="${esc(p.id)}">Show on map</button>${saveBtn(p,"btn save-btn")}</div></div></article>`;
}
function entriesHTML(){
  const all=[...PROJECTS].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const test={ all:()=>true, curated:p=>p.verified, pending:p=>!p.verified, uploaded:p=>p.uploaded };
  if (!test[entryFilter]) entryFilter="all";
  const chips=[["all","All"],["curated","Curated"],["pending","Curation pending"],["uploaded","Uploaded by administrators"]]
    .map(([k,l])=>[k,l,all.filter(test[k]).length]).filter(([k,,n])=>k==="all" || n>0);
  const list=all.filter(test[entryFilter]);
  const groups=new Map();
  for (const p of list){ const k=String(p.year || String(p.date).slice(0,4)); if (!groups.has(k)) groups.set(k,[]); groups.get(k).push(p); }
  return pageShell("entries", `<div class="chipbar" role="group" aria-label="Show">${chips.map(([k,l,n])=>`<button type="button" data-ef="${k}" aria-pressed="${entryFilter===k}">${l}<span>${n}</span></button>`).join("")}</div>
    ${list.length ? [...groups].map(([k,ps])=>`<section><h2 class="sp-h2">${k}</h2><div class="ent-grid">${ps.map(entryCard).join("")}</div></section>`).join("")
      : emptyBox("Nothing here yet", "No projects match this filter.")}`);
}

// --- Community
function communityHTML(){
  const people=new Map();
  for (const p of PROJECTS){
    const k=(p.author || "Unknown author").trim().toLowerCase();
    if (!people.has(k)) people.set(k,{ name:p.author || "Unknown author", prof:p.prof, aff:p.aff, web:p.web, projects:[] });
    people.get(k).projects.push(p);
  }
  const ppl=[...people.values()].sort((a,b)=>b.projects.length-a.projects.length || a.name.localeCompare(b.name));
  const inst=new Map();
  for (const person of ppl){ const a=(person.aff || "Independent").trim(); if (!inst.has(a)) inst.set(a,{ name:a, people:0, projects:0 }); const i=inst.get(a); i.people++; i.projects+=person.projects.length; }
  const insts=[...inst.values()].sort((a,b)=>b.projects-a.projects || a.name.localeCompare(b.name));
  const top=Math.max(1, ...insts.map(i=>i.projects));
  const countries=new Set(PROJECTS.map(p=>stampInfo(p).country));
  const card=person=>{
    const web=safeUrl(person.web);
    return `<article class="pcard"><div class="ph"><span class="av" style="background:${INK[person.projects[0].cat] || INK.news}">${esc(initials(person.name))}</span>
      <div><h3>${esc(person.name)}</h3><p class="m">${esc(person.prof || "Contributor")}</p><p class="m">${esc(person.aff || "Independent")}</p></div></div>
      <ul class="plist">${person.projects.map(x=>`<li><button type="button" data-open="${esc(x.id)}">${esc(x.title)}</button><span>${esc(stampInfo(x).country)} · ${x.year}${x.verified ? "" : " · curation pending"}</span></li>`).join("")}</ul>
      <div class="acts"><button type="button" class="btn" data-map="${esc(person.projects[0].id)}">Show on map</button>${web ? `<a class="btn" href="${esc(web)}" target="_blank" rel="noopener">Website</a>` : ""}</div></article>`;
  };
  const stats=`<dl class="sp-stats"><div><dt>Contributors</dt><dd>${ppl.length}</dd></div><div><dt>Institutions</dt><dd>${insts.length}</dd></div>
      <div><dt>Countries</dt><dd>${countries.size}</dd></div><div><dt>Projects</dt><dd>${PROJECTS.length}</dd></div></dl>`;
  return pageShell("community", `<section><h2 class="sp-h2">Photographers and researchers</h2><div class="ppl-grid">${ppl.map(card).join("")}</div></section>
    <section><h2 class="sp-h2">Institutions</h2><ol class="insts">${insts.map(i=>`<li><span>${esc(i.name)}</span><small>${i.people} ${i.people===1?"person":"people"} · ${i.projects} project${i.projects===1?"":"s"}</small><span class="bar"><i style="width:${Math.round(i.projects/top*100)}%"></i></span></li>`).join("")}</ol></section>`, stats);
}

// --- Events and Sponsors: lists kept in Supabase
async function loadListing(kind){
  if (!sb){ listingErr[kind]="offline"; listings[kind]=[]; return paintListing(kind); }
  const q = kind==="events" ? sb.from("events").select("*").order("starts_on",{ ascending:true })
                            : sb.from("sponsors").select("*").order("sort",{ ascending:true }).order("name",{ ascending:true });
  const { data, error } = await q;
  if (error){ listingErr[kind] = /does not exist|schema cache|relation/i.test(error.message || "") ? "missing" : (error.message || "error"); listings[kind]=[]; }
  else { listingErr[kind]=null; listings[kind]=data; }
  paintListing(kind);
}
function paintListing(kind){
  if (curPage!==kind) return;
  const box=sitePg.querySelector("#spList"); if (!box) return;
  box.innerHTML = kind==="events" ? eventsListHTML() : sponsorsListHTML();
  const note=sitePg.querySelector("#spSetup");
  if (note) note.hidden = !(isAdmin && listingErr[kind]==="missing");
}
const setupNote = kind => `<p class="sp-note" id="spSetup" hidden>The ${kind} list is not set up in Supabase yet. Run <code>supabase/migrations/002_pages.sql</code> once in the Supabase SQL editor, then reload this page.</p>`;
function eventsHTML(){
  const form = isAdmin ? `<div class="sp-toolbar"><span></span><button type="button" class="btn primary" data-toggle-form>Add an event</button></div>
    <form class="sp-form" id="spForm" data-kind="events" hidden>
      <label class="fld">Title<input name="title" required maxlength="300"></label>
      <div class="row2"><label class="fld">Type<select name="kind">${Object.entries(EVENT_KINDS).map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select></label>
        <label class="fld">Starts<input name="starts_on" type="date" required></label><label class="fld">Ends (optional)<input name="ends_on" type="date"></label></div>
      <div class="row2"><label class="fld">Place<input name="location_name" placeholder="Venue, city"></label><label class="fld">Link (optional)<input name="url" type="url" placeholder="https://"></label></div>
      <label class="fld chk"><input name="online" type="checkbox"> Takes place online</label>
      <label class="fld">Description<textarea name="description" rows="3"></textarea></label>
      <p class="msg" role="alert"></p><div class="pp-actions"><button type="button" class="btn" data-toggle-form>Cancel</button><button type="submit" class="btn primary">Publish event</button></div></form>` : "";
  return pageShell("events", `${setupNote("events")}${form}<div id="spList"><p class="m">Loading…</p></div>`);
}
function eventsListHTML(){
  const rows=listings.events || [];
  const today=new Date().toISOString().slice(0,10);
  const up=rows.filter(e=>(e.ends_on || e.starts_on)>=today), past=rows.filter(e=>(e.ends_on || e.starts_on)<today).reverse();
  const when=e=>fmtDate(e.starts_on)+(e.ends_on && e.ends_on!==e.starts_on ? " to "+fmtDate(e.ends_on) : "");
  const card=e=>{
    const d=new Date(e.starts_on+"T00:00:00Z"), link=safeUrl(e.url);
    return `<article class="evcard"><div class="evdate" aria-hidden="true"><b>${d.getUTCDate()}</b><span>${d.toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"})}</span><small>${d.getUTCFullYear()}</small></div>
      <div class="evb"><span class="badge kind">${esc(EVENT_KINDS[e.kind] || "Event")}</span><h3>${esc(e.title)}</h3>
        <p class="m">${when(e)} · ${e.online ? "Online" : esc(e.location_name || "Place to be announced")}</p>${e.description ? `<p>${esc(e.description)}</p>` : ""}
        <div class="acts">${link ? `<a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Details</a>` : ""}${isAdmin ? `<button type="button" class="btn danger" data-del="events:${e.id}">Remove</button>` : ""}</div></div></article>`;
  };
  return `<section><h2 class="sp-h2">Upcoming</h2>${up.length ? `<div class="evlist">${up.map(card).join("")}</div>`
      : emptyBox("No upcoming events yet", isAdmin ? "Add the first one with “Add an event”." : "Exhibitions, talks and workshops will be listed here as they are announced.")}</section>
    ${past.length ? `<section><h2 class="sp-h2">Past events</h2><div class="evlist past">${past.map(card).join("")}</div></section>` : ""}`;
}
function sponsorsHTML(){
  const form = isAdmin ? `<div class="sp-toolbar"><span></span><button type="button" class="btn primary" data-toggle-form>Add a sponsor</button></div>
    <form class="sp-form" id="spForm" data-kind="sponsors" hidden>
      <div class="row2"><label class="fld">Name<input name="name" required maxlength="200"></label>
        <label class="fld">Level<select name="tier"><option value="partner">Partner</option><option value="supporter" selected>Supporter</option></select></label></div>
      <div class="row2"><label class="fld">Website<input name="url" type="url" placeholder="https://"></label><label class="fld">Logo (PNG, JPEG or WebP)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label></div>
      <label class="fld">One or two lines about them<textarea name="blurb" rows="2"></textarea></label>
      <p class="msg" role="alert"></p><div class="pp-actions"><button type="button" class="btn" data-toggle-form>Cancel</button><button type="submit" class="btn primary">Add sponsor</button></div></form>` : "";
  return pageShell("sponsors", `${setupNote("sponsors")}${form}<div id="spList"><p class="m">Loading…</p></div>`);
}
function sponsorsListHTML(){
  const rows=listings.sponsors || [];
  if (!rows.length) return emptyBox("No sponsors yet", isAdmin ? "Add the first one with “Add a sponsor”." : "Organisations that support The Charter will be listed here.");
  const card=s=>{
    const link=safeUrl(s.url), logo=safeUrl(s.logo_url);
    return `<article class="scard"><div class="logo">${logo ? `<img src="${esc(logo)}" alt="${esc(s.name)} logo">` : `<span class="mono-logo" aria-hidden="true">${esc(initials(s.name))}</span>`}</div>
      <h3>${esc(s.name)}</h3>${s.blurb ? `<p>${esc(s.blurb)}</p>` : ""}
      <div class="acts">${link ? `<a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Website</a>` : ""}${isAdmin ? `<button type="button" class="btn danger" data-del="sponsors:${s.id}">Remove</button>` : ""}</div></article>`;
  };
  const partners=rows.filter(s=>s.tier==="partner"), supporters=rows.filter(s=>s.tier!=="partner");
  return `${partners.length ? `<section><h2 class="sp-h2">Partners</h2><div class="spon-grid partners">${partners.map(card).join("")}</div></section>` : ""}
    ${supporters.length ? `<section><h2 class="sp-h2">Supporters</h2><div class="spon-grid">${supporters.map(card).join("")}</div></section>` : ""}`;
}

sitePg.addEventListener("click", async e=>{
  if (e.target.closest("[data-sp-home]")) return closeSitePage();
  const open=e.target.closest("[data-open]");
  if (open){ const p=PROJECTS.find(x=>x.id===open.dataset.open); if (p) openStory(p); return; }
  const map=e.target.closest("[data-map]");
  if (map){ const id=map.dataset.map, p=PROJECTS.find(x=>x.id===id); closeSitePage(); const d=items.find(x=>x.p.id===id); if (d) select(d); else if (p) flyTo([p.lng,p.lat]); return; }
  const ef=e.target.closest("[data-ef]");
  if (ef){ entryFilter=ef.dataset.ef; renderSitePage(); return; }
  if (e.target.closest("[data-toggle-form]")){ const f=sitePg.querySelector("#spForm"); f.hidden=!f.hidden; if (!f.hidden) f.querySelector("input")?.focus(); return; }
  const del=e.target.closest("[data-del]");
  if (del){
    const [kind,id]=del.dataset.del.split(":");
    if (!confirm(kind==="events" ? "Remove this event from the site?" : "Remove this sponsor from the site?")) return;
    del.disabled=true;
    const { error } = await sb.from(kind).delete().eq("id", +id);
    if (error){ del.disabled=false; alert(`It was not removed: ${error.message}`); return; }
    loadListing(kind);
  }
});
sitePg.addEventListener("submit", async e=>{
  const f=e.target.closest("#spForm"); if (!f) return;
  e.preventDefault();
  const kind=f.dataset.kind, v=n=>(f.elements[n]?.value || "").trim(), msg=f.querySelector(".msg"), btn=f.querySelector('[type="submit"]');
  if (!sb || !isAdmin){ msg.textContent="Sign in as an administrator first."; return; }
  if (v("url") && !safeUrl(v("url"))){ msg.textContent="The link must start with https://"; return; }
  btn.disabled=true; msg.textContent="";
  try {
    let row;
    if (kind==="events"){
      if (v("ends_on") && v("ends_on")<v("starts_on")) throw new Error("the end date is before the start date");
      row={ title:v("title"), kind:v("kind"), starts_on:v("starts_on"), ends_on:v("ends_on") || null, location_name:v("location_name") || null,
            online:f.elements.online.checked, url:v("url") || null, description:v("description") || null };
    } else {
      let logo_url=null; const file=f.elements.logo.files[0];
      if (file){
        if (file.size>2*1024*1024) throw new Error("the logo is larger than 2 MB");
        const path=`sponsors/${Date.now()}-${file.name.replace(/[^\w.-]+/g,"_")}`;
        const up=await sb.storage.from(SB_BUCKET).upload(path, file, { contentType:file.type, upsert:false });
        if (up.error) throw up.error;
        logo_url=sb.storage.from(SB_BUCKET).getPublicUrl(path).data.publicUrl;
      }
      row={ name:v("name"), tier:v("tier"), url:v("url") || null, blurb:v("blurb") || null, logo_url };
    }
    const { error } = await sb.from(kind).insert(row);
    if (error) throw error;
    f.reset(); f.hidden=true; loadListing(kind);
  } catch(err){ msg.textContent=`It was not saved: ${err.message || err}.`; }
  btn.disabled=false;
});

