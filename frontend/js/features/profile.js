// Profile: field passport, saved projects, visa stamps.
// ---------- profile: field passport ----------
// Built from the signed-in email; the holder edits the rest. Kept in this browser until profile endpoints exist.
const INSTITUTIONS = [
  {match:/centennialcollege\.ca$/, name:"Centennial College", based:"Toronto, Canada", country:"CAN"},
  {match:/utoronto\.ca$/, name:"University of Toronto", based:"Toronto, Canada", country:"CAN"},
  {match:/torontomu\.ca$/, name:"Toronto Metropolitan University", based:"Toronto, Canada", country:"CAN"},
  {match:/yorku\.ca$/, name:"York University", based:"Toronto, Canada", country:"CAN"},
  {match:/(senecapolytechnic|senecacollege)\.ca$/, name:"Seneca Polytechnic", based:"Toronto, Canada", country:"CAN"},
  {match:/humber\.ca$/, name:"Humber Polytechnic", based:"Toronto, Canada", country:"CAN"},
  {match:/georgebrown\.ca$/, name:"George Brown College", based:"Toronto, Canada", country:"CAN"},
  {match:/sydney\.edu\.au$/, name:"University of Sydney", based:"Sydney, Australia", country:"AUS"},
];
const KNOWN = [
  {match:/^(ansh|asatish|satish)/i, given:"Ansh", surname:"Satish", degree:"Software Engineering Technology (Artificial Intelligence)",
    field:"Artificial Intelligence",
    bio:"AI student at Centennial College, building The Charter: a 3D globe of verified photojournalism with search by meaning and AI summaries.",
    interests:["Artificial Intelligence","Photojournalism","Semantic search","Maps"]},
];
const CITIES = { toronto:[-79.3832,43.6532], montreal:[-73.5674,45.5019], vancouver:[-123.1207,49.2827], ottawa:[-75.6972,45.4215],
  sydney:[151.2093,-33.8688], london:[-0.1276,51.5072], paris:[2.3522,48.8566], "new york":[-74.006,40.7128], nairobi:[36.8219,-1.2921],
  "mexico city":[-99.1332,19.4326], delhi:[77.209,28.6139], mumbai:[72.8777,19.076], abidjan:[-4.0083,5.36] };
const ME = { home:CITIES.toronto };
const PROFILE_KEY = email => "charter.profile."+email.toLowerCase();
const homeFor = based => CITIES[(based || "").split(",")[0].trim().toLowerCase()];
const domainName = d => cap(d.replace(/^(my|mail|student|students|stu)\./,"").split(".")[0]);
function loadProfile(email){
  const [local, domain=""] = email.toLowerCase().split("@");
  const parts=local.split(/[._-]+/).filter(Boolean);
  const inst=INSTITUTIONS.find(i=>i.match.test(domain));
  const known=KNOWN.find(k=>k.match.test(local)) ?? {};
  let saved={}; try { saved=JSON.parse(localStorage.getItem(PROFILE_KEY(email))) ?? {}; } catch {}
  const since=saved.since ?? new Date().toISOString().slice(0,10);
  if (!saved.since) try { localStorage.setItem(PROFILE_KEY(email), JSON.stringify({...saved, since})); } catch {}
  for (const k of Object.keys(ME)) delete ME[k];
  Object.assign(ME, { given:cap(parts[0] ?? "Member"), surname:parts.slice(1).map(cap).join(" ") || "Member",
    university:inst?.name ?? domainName(domain), based:inst?.based ?? "", country:inst?.country ?? "XXX",
    degree:"", field:"", role:inst ? "Student" : "Member", bio:"", interests:[] }, known, saved, { email, since });
  const h=[...email.toLowerCase()].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%1000;
  ME.no=`TC${since.slice(2,4)}${since.slice(5,7)}${String(h).padStart(3,"0")}`;
  ME.home=homeFor(ME.based) ?? CITIES.toronto;
}
// Stamps: projects the holder saves (students and administrators) and projects an administrator uploads.
// Kept in this browser per email until profile endpoints exist.
const listKey = kind => `charter.${kind}.${(ME.email || "").toLowerCase()}`;
const readList = kind => { try { return JSON.parse(localStorage.getItem(listKey(kind))) ?? []; } catch { return []; } };
const writeList = (kind, list) => { try { localStorage.setItem(listKey(kind), JSON.stringify(list)); } catch {} };
const COUNTRY_CODES = { mongolia:["MNG","Asia"], bangladesh:["BGD","Asia"], india:["IND","Asia"], china:["CHN","Asia"], japan:["JPN","Asia"],
  canada:["CAN","North America"], "united states":["USA","North America"], usa:["USA","North America"], mexico:["MEX","North America"],
  brazil:["BRA","South America"], peru:["PER","South America"], colombia:["COL","South America"], kenya:["KEN","Africa"], nigeria:["NGA","Africa"],
  rwanda:["RWA","Africa"], ghana:["GHA","Africa"], "côte d'ivoire":["CIV","Africa"], france:["FRA","Europe"], "united kingdom":["GBR","Europe"],
  australia:["AUS","Oceania"] };
// Places whose last comma part is not a country name.
const PLACE_CODES = [[/colombia-panama/i,"Colombia · Panama","COL"], [/rwanda\/drc/i,"Rwanda · DR Congo","RWA"], [/us-mexico border/i,"Mexico · US border","MEX"]];
const continentAt = (lat,lng) => lng<-30 ? (lat>12 ? "North America" : "South America") : lng<60 ? (lat>35 ? "Europe" : "Africa") : lat<-10 ? "Oceania" : "Asia";
function stampInfo(p){
  const place=PLACE_CODES.find(([re])=>re.test(p.loc || ""));
  const country=place?.[1] ?? ((p.loc || "").split(",").pop().trim() || "Field entry"), hit=COUNTRY_CODES[country.toLowerCase()];
  return { country, code:place?.[2] ?? hit?.[0] ?? country.replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase(), continent:hit?.[1] ?? continentAt(p.lat,p.lng) };
}
const isSaved = id => readList("saved").some(s=>s.id===id);
function toggleSaved(id){
  const list=readList("saved"), on=!list.some(s=>s.id===id);
  writeList("saved", on ? [...list, { id, on:new Date().toISOString().slice(0,10) }] : list.filter(s=>s.id!==id));
  return on;
}
function addUploadStamp(id){
  const list=readList("uploads");
  if (!list.some(s=>s.id===id)) writeList("uploads", [...list, { id, on:new Date().toISOString().slice(0,10) }]);
}
// One stamp per project; an upload wins over a save of the same project.
function stampEntries(){
  const rows=new Map();
  for (const s of readList("saved")) rows.set(s.id, {...s, how:"saved"});
  if (isAdmin) for (const s of readList("uploads")) rows.set(s.id, {...s, how:"uploaded"});
  return [...rows.values()].map(s=>{ const p=PROJECTS.find(x=>x.id===s.id); return p ? {...s, ...stampInfo(p), p} : null; })
    .filter(Boolean).sort((a,b)=>a.on.localeCompare(b.on));
}
// A Save button: on the map preview card and on the project page.
const saveLabel = on => on ? "Saved" : "Save";
function saveBtn(p, cls){
  const on=isSaved(p.id);
  return `<button type="button" class="${cls}" data-save="${esc(p.id)}" aria-pressed="${on}"><svg class="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-4-5 4z"/></svg><span>${saveLabel(on)}</span></button>`;
}
document.addEventListener("click", e=>{
  const b=e.target.closest("[data-save]"); if (!b) return;
  const on=toggleSaved(b.dataset.save);
  document.querySelectorAll(`[data-save="${CSS.escape(b.dataset.save)}"]`).forEach(x=>{ x.setAttribute("aria-pressed", on); x.querySelector("span").textContent=saveLabel(on); });
  if (routeLegs) showRoute(true);
});
const MONTHS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const pdate = iso => { const [y,m,d]=iso.split("-"); return `${d} ${MONTHS[+m-1]} ${y}`; };
// ICAO 9303 check digit (weights 7-3-1): the machine-readable zone is computed, not decorative.
const mrzCheck = s => String([...s].reduce((sum,c,i)=>sum+(c==="<"?0:/\d/.test(c)?+c:c.charCodeAt(0)-55)*[7,3,1][i%3],0)%10);
function mrzLines(p){
  const clean = s => s.toUpperCase().normalize("NFD").replace(/[^A-Z]/g,"<");
  const l1 = `P<TCH${clean(p.surname)}<<${clean(p.given)}`.padEnd(44,"<").slice(0,44);
  const issued=p.since.slice(2).replace(/-/g,""), expires=String(+p.since.slice(0,4)+5).slice(2)+p.since.slice(5).replace("-","");
  const doc=p.no.padEnd(9,"<");
  const l2=(`${doc}${mrzCheck(doc)}${p.country}${issued}${mrzCheck(issued)}<${expires}${mrzCheck(expires)}`+clean(p.degree.replace(/^Master in /,""))).padEnd(43,"<").slice(0,43);
  return [l1, l2+mrzCheck(l2)];
}
const savedEntries = stampEntries;
const INK = Object.fromEntries(Object.entries(CATS).map(([k,c])=>[k,c.ink]));
function stampSVG(e,i){
  const ink=INK[e.p.cat]||INK.news, id="s"+i, top=esc(e.country.toUpperCase().slice(0,20)), coord=fmtLL(e.p.lat,e.p.lng);
  const T=(x,y,size,txt,extra="")=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${ink}" stroke="none" font-family="'IBM Plex Mono',monospace" font-size="${size}" ${extra}>${txt}</text>`;
  const code=`<text x="100" y="80" text-anchor="middle" fill="${ink}" stroke="none" font-family="Newsreader,serif" font-weight="700" font-size="32">${e.code}</text>`;
  const shapes=[
    `<circle cx="100" cy="75" r="68" stroke-width="3.2"/><circle cx="100" cy="75" r="62" stroke-width="1.2"/>${T(100,42,9,top,'font-weight="600" letter-spacing="2"')}${code}${T(100,99,8.5,pdate(e.on))}${T(100,115,7,e.how==="uploaded" ? "UPLOADED · THE CHARTER" : "THE CHARTER · ENTRY")}`,
    `<rect x="14" y="16" width="172" height="118" rx="10" stroke-width="3.2"/><rect x="21" y="23" width="158" height="104" rx="6" stroke-width="1.2"/>${T(100,44,10,e.how==="uploaded" ? "UPLOADED" : "ENTRY · ADMITTED",'font-weight="600" letter-spacing="3"')}${code}<line x1="34" y1="92" x2="166" y2="92" stroke-width="1.2"/>${T(100,106,9,pdate(e.on))}${T(100,119,7.5,coord)}`,
    `<polygon points="62,10 138,10 186,50 186,100 138,140 62,140 14,100 14,50" stroke-width="3.2"/><polygon points="65,18 135,18 178,53 178,97 135,132 65,132 22,97 22,53" stroke-width="1.2"/>${T(100,42,9,top,'font-weight="600" letter-spacing="2"')}${code}${T(100,100,8.5,pdate(e.on))}${T(100,116,7,esc(CATS[e.p.cat].label.toUpperCase().slice(0,26)))}`,
    `<ellipse cx="100" cy="75" rx="88" ry="60" stroke-width="3.2"/><ellipse cx="100" cy="75" rx="81" ry="53" stroke-width="1.2"/>${T(100,46,9,top,'font-weight="600" letter-spacing="2"')}${code}${T(100,101,8.5,pdate(e.on))}${T(100,114,7,coord)}`,
  ];
  const tilt=(Math.abs([...e.p.id].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7))%26)-13;
  return `<button class="stamp" type="button" data-id="${e.p.id}" style="transform:rotate(${tilt}deg)" aria-label="${esc(e.p.title)}, ${e.how} ${pdate(e.on)}. Show on the globe.">
    <svg viewBox="0 0 200 150"><defs><filter id="ink-${id}" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${i*7+3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${i+3}" result="patch"/>
      <feColorMatrix in="patch" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="mask"/><feComposite in="d" in2="mask" operator="in"/></filter></defs>
      <g filter="url(#ink-${id})" fill="none" stroke="${ink}" opacity=".88">${shapes[i%4]}</g></svg></button>`;
}
function rosette(){
  const a=Array.from({length:36},(_,i)=>`<ellipse rx="170" ry="16" transform="rotate(${i*5})"/>`).join("");
  const b=Array.from({length:24},(_,i)=>`<ellipse rx="110" ry="9" transform="rotate(${i*7.5})"/>`).join("");
  return `<svg class="rosette" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="none" stroke="#b79a5b" stroke-opacity=".14" stroke-width=".7" transform="translate(470 470)">${a}</g>
    <g fill="none" stroke="#1f3b44" stroke-opacity=".06" stroke-width=".6" transform="translate(-40 -40)">${b}</g></svg>`;
}
const profileEl=$("profile");
function openProfile(){
  if (!profileEl.hidden) return;
  rememberFocus("profile"); story.hidden=true; adminEl.hidden=true; sitePg.hidden=true; curPage=null; syncHeader(); drawer.classList.remove("open");
  const es=savedEntries(), [m1,m2]=mrzLines(ME), full=`${ME.given} ${ME.surname}`;
  const stops=[ME.home, ...es.map(e=>[e.p.lng,e.p.lat])];
  const km=Math.round(stops.slice(1).reduce((s,to,i)=>s+d3.geoDistance(stops[i],to)*6371,0));
  const tile=p=>`<button class="feat-card" type="button" data-id="${p.id}">
        <img src="${img(p)}" alt="" loading="lazy"><div><b style="color:${INK[p.cat]||INK.news}">${esc(CATS[p.cat].label)}</b><strong>${esc(p.title)}</strong><small>${esc(p.loc)}${p.verified ? "" : " · curation pending"}</small></div></button>`;
  const savedN=es.filter(e=>e.how==="saved").length, uploads=es.filter(e=>e.how==="uploaded").map(e=>e.p);
  let shelf;
  if (isAdmin){
    shelf=`<section aria-labelledby="featH"><div class="feat-h"><h2 id="featH">Your uploads</h2><span>${uploads.length ? "Newest first, with curation status" : ""}</span></div>
      ${uploads.length ? `<div class="feat-row">${uploads.reverse().map(tile).join("")}</div>`
        : '<p class="pp-empty">Nothing uploaded yet. <button type="button" class="btn" id="ppUpload">Upload a project</button></p>'}</section>`;
  } else {
    // Suggestions: unsaved projects in the categories the student saves most, then the newest.
    const cats=es.reduce((m,e)=>m.set(e.p.cat,(m.get(e.p.cat) ?? 0)+1), new Map());
    const pool=PROJECTS.filter(p=>!es.some(e=>e.p.id===p.id));
    const picks=[...pool].sort((a,b)=>(cats.get(b.cat) ?? 0)-(cats.get(a.cat) ?? 0) || b.date.localeCompare(a.date)).slice(0,4);
    shelf=picks.length ? `<section aria-labelledby="featH"><div class="feat-h"><h2 id="featH">${es.length ? "Suggested for you" : "Start exploring"}</h2><span>${es.length ? "Close to what you save" : "Newest in the library"}</span></div>
      <div class="feat-row">${picks.map(tile).join("")}</div></section>` : "";
  }
  const stats = isAdmin
    ? [["Uploaded", uploads.length], ["Saved", savedN], ["Countries", new Set(es.map(e=>e.code)).size], ["Route length", `${km.toLocaleString()} km`]]
    : [["Saved projects", es.length], ["Countries", new Set(es.map(e=>e.code)).size], ["Continents", new Set(es.map(e=>e.continent)).size], ["Route length", `${km.toLocaleString()} km`]];
  const check='<svg width="15" height="15" viewBox="0 0 24 24" aria-label="Verified institutional email" style="vertical-align:-2px"><path fill="#1d8cf0" d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.8-1 3 1 3-2.7 1.8-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3L2.5 16l1-3-1-3 2.7-1.8 1-3 3.2.2z"/><path d="m7.8 12.2 2.8 2.8 5.6-5.8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  profileEl.innerHTML=`<div class="pp-in">
    <nav class="crumbs" aria-label="You are here"><button type="button" class="home" id="ppClose">Map</button><span aria-hidden="true">/</span><span aria-current="page">My profile</span>
      <span class="end"><button type="button" class="btn" id="ppEdit" aria-expanded="false" aria-controls="ppForm">Edit details</button><button type="button" class="btn" id="ppOut">Sign out</button></span></nav>
    <form class="ppedit" id="ppForm" hidden>
      <div class="meta-row">
        <label class="fld" for="pfGiven">Given names<input id="pfGiven" type="text" value="${esc(ME.given)}" required></label>
        <label class="fld" for="pfSurname">Surname<input id="pfSurname" type="text" value="${esc(ME.surname)}" required></label>
        <label class="fld" for="pfUni">Institution<input id="pfUni" type="text" value="${esc(ME.university)}"></label>
        <label class="fld" for="pfDegree">Programme<input id="pfDegree" type="text" value="${esc(ME.degree)}"></label>
        <label class="fld" for="pfField">Field of study<input id="pfField" type="text" value="${esc(ME.field)}"></label>
        <label class="fld" for="pfBased">Based in (city, country)<input id="pfBased" type="text" value="${esc(ME.based)}" placeholder="Toronto, Canada"></label>
      </div>
      <label class="fld" for="pfBio">About you<textarea id="pfBio">${esc(ME.bio)}</textarea></label>
      <label class="fld" for="pfTags">Interests, separated by commas<input id="pfTags" type="text" value="${esc(ME.interests.join(", "))}"></label>
      <div class="pp-actions"><button type="button" class="btn" id="pfCancel">Cancel</button><button type="submit" class="btn primary">Save details</button></div>
    </form>
    <section class="cover" aria-label="Field passport"><div class="spread">
      <div class="pg data">${rosette()}
        <div class="pp-top"><div><div class="pp-brand">THE CHARTER</div><div class="pp-sub">FIELD PASSPORT · PASSEPORT DE TERRAIN</div></div>
          <div class="pp-no mono">TYPE <b>P</b> · CODE <b>TCH</b><br>No. <b>${ME.no}</b></div></div>
        <div class="pp-id"><div class="photo">${initials(full)}<span class="seal">${check}</span></div>
          <dl class="kv"><div><dt>Surname / Nom</dt><dd>${ME.surname.toUpperCase()}</dd></div>
            <div><dt>Given names / Prénoms</dt><dd>${ME.given.toUpperCase()}</dd></div>
            <div><dt>Programme</dt><dd>${esc(ME.degree || "Not set")}</dd></div><div><dt>Institution</dt><dd>${esc(ME.university || "Not set")}</dd></div></dl></div>
        <dl class="kv kv2"><div><dt>Field of study</dt><dd>${esc(ME.field || "Not set")}</dd></div><div><dt>Based in</dt><dd>${esc(ME.based || "Not set")}</dd></div>
          <div><dt>Member since</dt><dd class="mono">${pdate(ME.since)}</dd></div><div><dt>Status</dt><dd>${esc(ME.role)} ${check}</dd></div></dl>
        ${ME.bio ? `<p class="bio">${esc(ME.bio)}</p>` : ""}
        ${ME.interests.length ? `<div class="tags">${ME.interests.map(x=>`<span>${esc(x)}</span>`).join("")}</div>` : ""}
        <div class="sig"><div><p class="pp-sub">HOLDER'S SIGNATURE</p><p class="hand">${esc(full)}</p></div><p class="mono" style="font-size:11px;color:var(--label)">${esc(ME.email)}</p></div>
        <div class="mrz mono" aria-label="Machine readable zone"><p>${esc(m1)}</p><p>${esc(m2)}</p></div>
      </div>
      <div class="pg entries">
        <div class="ent-h"><h2>Entries</h2><span class="pp-sub">${isAdmin ? "VISAS · UPLOADED AND SAVED" : "VISAS · SAVED PROJECTS"} · PAGE 07</span></div>
        <p style="margin:4px 0 0;font-size:13px;color:#6f675f">${isAdmin ? "Each project you upload or save gets a stamp." : "Each project you save gets a stamp."} Click one to see it on the globe.</p>
        <div class="stamps">${es.map(stampSVG).join("")}<div class="stamp-next"><div class="mono">${es.length ? "NEXT ENTRY" : "FIRST ENTRY"}<br>${isAdmin ? "upload or save<br>a project" : "save a project<br>from the map"}</div></div></div>
      </div>
    </div></section>
    ${shelf}
    <dl class="pp-stats">${stats.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    <div class="pp-actions">${es.length ? '<button class="btn primary" type="button" id="showRoute">Show my route on the globe</button>' : ""}</div>
  </div>`;
  profileEl.hidden=false; profileEl.scrollTop=0; closeCard(); syncHeader();
  $("ppClose").onclick=closeProfile; $("ppClose").focus();
  $("ppOut").onclick=signOut;
  const form=$("ppForm"), toggle=open=>{ form.hidden=!open; $("ppEdit").setAttribute("aria-expanded",open); if (open) $("pfGiven").focus(); };
  $("ppEdit").onclick=()=>toggle(form.hidden);
  $("pfCancel").onclick=()=>toggle(false);
  form.onsubmit=e=>{
    e.preventDefault();
    const v=id=>$(id).value.trim();
    const edits={ given:v("pfGiven") || ME.given, surname:v("pfSurname") || ME.surname, university:v("pfUni"), degree:v("pfDegree"),
      field:v("pfField"), based:v("pfBased"), bio:v("pfBio"), interests:v("pfTags").split(",").map(s=>s.trim()).filter(Boolean), since:ME.since };
    try { localStorage.setItem(PROFILE_KEY(ME.email), JSON.stringify(edits)); } catch {}
    applyUser(ME.email); if (routeLegs) showRoute(true);
    closeProfile(); openProfile();
  };
  if ($("showRoute")) $("showRoute").onclick=()=>{ closeProfile(); showRoute(true); };
  if ($("ppUpload")) $("ppUpload").onclick=()=>{ closeProfile(); $("adminOpen").click(); };
  profileEl.querySelectorAll(".feat-row").forEach(row=>row.onclick=e=>{ const b=e.target.closest(".feat-card"); if(!b) return;
    closeProfile(); const p=PROJECTS.find(x=>x.id===b.dataset.id); if(p) openStory(p); });
  profileEl.querySelector(".stamps").onclick=e=>{ const b=e.target.closest(".stamp"); if(!b) return;
    closeProfile(); const d=items.find(x=>x.p.id===b.dataset.id); if(d) select(d); };
}
function closeProfile(){ profileEl.hidden=true; syncHeader(); draw(); restoreFocus("profile"); }
$("userBtn").onclick=openProfile;

