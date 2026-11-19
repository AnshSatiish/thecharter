// Admin: pick a location on the globe, SDG picker, location check.
let picking=false, draftPin=null;
function startPick(){ picking=true; adminEl.hidden=true; syncHeader(); closeCard(); state.auto=false; $("pickbar").hidden=false; canvas.classList.add("picking");
  if (draftPin) flyTo(draftPin); }
function endPick(){ picking=false; $("pickbar").hidden=true; canvas.classList.remove("picking"); adminEl.hidden=false; syncHeader(); $("latIn").focus(); }
$("pickBtn").onclick=startPick;
// SDG picker: all 17 goals in their official colours
const sdgPick=$("sdgPick");
sdgPick.innerHTML=Object.entries(SDGS).map(([n,[name,c]])=>`<button class="sdgc" type="button" data-n="${n}" aria-pressed="false" style="background:${c}" title="SDG ${n}: ${name}" aria-label="SDG ${n}: ${name}">${n}</button>`).join("");
const pickedSdgs=()=>[...sdgPick.querySelectorAll('[aria-pressed="true"]')].map(b=>"SDG"+b.dataset.n);
function syncSdgPick(){ const p=pickedSdgs(); sdgPick.classList.toggle("has-sel",p.length>0);
  $("sdgPickSel").textContent=p.length ? p.map(s=>SDGS[sdgNum(s)][0]).join(", ") : "None selected."; }
sdgPick.onclick=e=>{ const b=e.target.closest(".sdgc"); if(!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed")!=="true"); syncSdgPick(); };
function setSdgPick(list){ sdgPick.querySelectorAll(".sdgc").forEach(b=>b.setAttribute("aria-pressed", list.includes("SDG"+b.dataset.n))); syncSdgPick(); }
syncSdgPick();
$("pickCancel").onclick=endPick;
function syncDraftPin(){ const lat=parseFloat($("latIn").value), lng=parseFloat($("lngIn").value);
  draftPin = Math.abs(lat)<=90 && Math.abs(lng)<=180 ? [lng,lat] : null; placePins(); checkLocation(); }
["latIn","lngIn"].forEach(id=>$(id).addEventListener("input",syncDraftPin));
// Advisory check: the backend compares the coordinates with the country named in the place (it catches swapped numbers).
// Without the backend the page still says which country the point is in.
let locTimer=null;
function checkLocation(){
  clearTimeout(locTimer);
  const el=$("locCheck"), lat=parseFloat($("latIn").value), lng=parseFloat($("lngIn").value), place=$("locIn").value.trim();
  if (!(Math.abs(lat)<=90 && Math.abs(lng)<=180)) { el.hidden=true; return; }
  locTimer=setTimeout(async()=>{
    let status="unknown", message;
    try {
      if (!apiLive) throw new Error("offline");
      const r=await fetch(`${API_BASE}/api/geo/check?lat=${lat}&lng=${lng}&place=${encodeURIComponent(place)}`);
      if (!r.ok) throw new Error(r.status);
      ({status, message} = await r.json());
    } catch {
      const c=countryAt([lng,lat]); message = c ? `These coordinates are in ${c}.` : "These coordinates are over open water.";
    }
    el.className="loccheck "+status; el.textContent=message; el.hidden=false;
  }, 350);
}
$("locIn").addEventListener("input",checkLocation);
function placeDraft(){
  let g=svg.select("g.draft");
  if (!draftPin || !isVisible(draftPin)) { g.remove(); return; }
  if (g.empty()){
    g=svg.append("g").attr("class","draft").attr("pointer-events","none");
    g.append("circle").attr("r",14).attr("fill","none").attr("stroke","#fff").attr("stroke-width",2).attr("stroke-dasharray","3 3");
    g.append("circle").attr("r",4).attr("fill","#fff");
  }
  const p=projection(draftPin); g.attr("transform",`translate(${p[0]},${p[1]})`);
}

// A project row from Supabase, in the shape the page uses.
const fromSupabase = r => ({ id:"u"+r.id, title:r.title, author:r.author_name || "Unknown author", prof:r.author_profession ?? "",
  aff:r.author_affiliation ?? "", cat:CATS[r.category] ? r.category : "news", loc:r.location_name, lat:r.lat, lng:r.lng,
  date:r.date, year:+String(r.date).slice(0,4), desc:r.description ?? "", kw:r.keywords ?? [], sdgs:r.sdgs ?? [],
  images:r.images ?? [], imgs:(r.images ?? []).length, web:r.author_website, verified:!!r.verified, caps:r.captions ?? [],
  summary:r.summary ?? "", uploaded:true,
  docs: r.document_url ? [{title:r.document_name || "Project document", url:r.document_url, size_bytes:r.document_size}] : [] });
