// Admin upload form: PDF, photos and narration, author, suggestions, publishing to the backend.
// ---------- admin upload ----------
const adminEl=document.getElementById("admin");
const SAMPLE = {
  photos:["assets/projects/thumbs/p17_0.jpg","assets/projects/thumbs/p17_1.jpg","assets/projects/thumbs/p17_2.jpg","assets/projects/thumbs/p17_3.jpg"],
  author:"Cinthia Karina Baños Paredes", aff:"National School of Anthropology and History (ENAH)", web:"https://cinthiabanosphotography.com",
  title:"Toxo'o o tsui' kiee'n: Day of the Dead in the Mazatec Highlands of Oaxaca",
  desc:"The Day of the Dead celebration in the Sierra Mazateca territory is known as ·Tsui' kiee'n· or ·The Festival of the Sun·. It is the most significant celebration in Mazatec culture, representing ·Naxinandá·, which in their cosmogony means \"community.\" People who migrated return to reunite with their living and deceased relatives; the souls of their ancestors are represented in the ·Toxo'o· by the ·Huehuentones or chaxo o'·, who are the men and women of the earth's navel.",
};
const $=id=>document.getElementById(id);
let adminState={sample:false};
$("adminOpen").onclick=()=>{ if (!adminEl.hidden || !isAdmin) return; rememberFocus("admin"); closePages(); drawer.classList.remove("open"); adminEl.hidden=false; syncHeader(); adminEl.scrollTop=0; syncHeader(); $("loadSample").focus(); };
$("adminClose").onclick=()=>{ adminEl.hidden=true; syncHeader(); draw(); restoreFocus("admin"); };

// One row per photo: the picture, and the narration the admin writes for it.
function addShot(src,file,caption=""){
  const row=document.createElement("div"); row.className="shotrow"; row._file=file || null; row._src=src;
  row.innerHTML=`<img src="${src}" alt="Photo to publish"><label class="fld">Narration for this photo<textarea placeholder="What is happening here? Who, where, when.">${esc(caption)}</textarea></label><button type="button" class="rm" aria-label="Remove this photo"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  $("thumbs").appendChild(row);
}
$("thumbs").addEventListener("click",e=>{ const b=e.target.closest(".rm"); if (b) b.closest(".shotrow").remove(); });
function readFiles(files){ for (const f of files){ if(!f.type.startsWith("image/")) continue;
  const r=new FileReader(); r.onload=()=>addShot(r.result,f); r.readAsDataURL(f); } }

let pdfFile=null;
function setPdf(f){
  if (!f) return;
  if (f.type!=="application/pdf" && !/\.pdf$/i.test(f.name)) { $("pdfInfo").textContent="That file is not a PDF."; return; }
  pdfFile=f; $("pdfInfo").innerHTML=`<strong>${esc(f.name)}</strong> · ${fmtSize(f.size)}`; $("publish").disabled=false;
  if (apiLive) showPdfSummaryChoice();
  else analysePdf(false);
}
function showPdfSummaryChoice(){
  $("pdfOut").innerHTML=`<form id="pdfSummaryChoice" class="pdfres">
    <fieldset><legend>How should the summary be prepared?</legend>
      <label><input type="radio" name="summaryChoice" value="ai" required> Draft one with AI (you can review and edit it)</label>
      <label><input type="radio" name="summaryChoice" value="manual" required> I’ll write it myself</label>
    </fieldset>
    <button class="btn" type="submit">Continue</button>
  </form>`;
  $("pdfSummaryChoice").onsubmit=e=>{
    e.preventDefault();
    const generateSummary=document.querySelector('input[name="summaryChoice"]:checked').value==="ai";
    analysePdf(generateSummary);
  };
}
async function analysePdf(generateSummary){
  const box=$("pdfOut");
  if (!apiLive && sb) { box.innerHTML=`<div class="pdfres"><p class="meta">The PDF is stored with the project when you publish. Reading its text and drafting an AI summary need the backend, so write the summary here.</p>
      <label class="fld" for="pdfSummary">Summary<textarea id="pdfSummary" style="min-height:96px;line-height:1.45"></textarea></label></div>`; return; }
  if (!apiLive) { box.innerHTML='<p class="placeholder-note" style="margin-top:12px">The backend is not running, so the PDF cannot be read or stored yet. Start it to get a summary and keywords.</p>'; return; }
  box.innerHTML=`<p class="meta" style="margin-top:12px">${generateSummary?"Reading the PDF and drafting a summary…":"Reading the PDF and extracting keywords…"}</p>`;
  try {
    const fd=new FormData(); fd.append("file",pdfFile); fd.append("generate_summary",String(generateSummary));
    const r=await fetch(`${API_BASE}/api/ai/extract-pdf`,{method:"POST",headers:{"X-Admin-Token":DEV_ADMIN_TOKEN},body:fd});
    const o=await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(typeof o.detail==="string" ? o.detail : r.status);
    const summaryLabel=o.fallback ? "Extractive fallback summary, review and edit before publishing"
      : o.summary_method?.startsWith("ai:") ? "AI draft summary, review and edit before publishing"
      : "Write a summary";
    box.innerHTML=`<div class="pdfres"><p class="meta">${o.pages} page${o.pages===1?"":"s"} · ${Number(o.characters).toLocaleString()} characters of text</p>
      ${o.has_text ? "" : '<p class="pubmsg" style="margin:0">This PDF has no selectable text (it looks scanned), so there is nothing to summarize or search.</p>'}
      <label class="fld" for="pdfSummary"><span id="pdfSumLabel">${summaryLabel}</span><textarea id="pdfSummary" style="min-height:96px;line-height:1.45">${esc(o.summary ?? "")}</textarea></label>
      <div class="fld">Keywords found in the document, click to remove<div class="tchips" id="pdfKw">${(o.keywords ?? []).map(k=>`<button type="button" aria-pressed="true">${esc(k)}</button>`).join("")}</div></div></div>`;
    $("pdfKw").onclick=e=>{ const b=e.target.closest("button"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed")!=="true"); };
  } catch(err) { box.innerHTML=`<p class="pubmsg">The PDF could not be read: ${esc(String(err.message))}</p>`; }
}
$("pdfFile").onchange=e=>setPdf(e.target.files[0]);
const pdfDrop=$("pdfDrop");
["dragenter","dragover"].forEach(ev=>pdfDrop.addEventListener(ev,e=>{ e.preventDefault(); pdfDrop.classList.add("over"); }));
["dragleave","drop"].forEach(ev=>pdfDrop.addEventListener(ev,e=>{ e.preventDefault(); pdfDrop.classList.remove("over"); }));
pdfDrop.addEventListener("drop",e=>setPdf(e.dataTransfer.files[0]));
$("files").onchange=e=>readFiles(e.target.files);
const drop=$("drop");
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add("over"); }));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop",e=>readFiles(e.dataTransfer.files));

$("loadSample").onclick=()=>{
  $("thumbs").innerHTML=""; const caps17=PROJECTS.find(p=>p.id==="17")?.caps ?? [];
  SAMPLE.photos.forEach((s,i)=>addShot(s,null,caps17[i] ?? ""));
  $("aName").value=SAMPLE.author; $("aAff").value=SAMPLE.aff; $("aWeb").value=SAMPLE.web;
  $("tEn").value=SAMPLE.title; $("dEn").value=SAMPLE.desc;
  // The example's own details, filled in as an administrator would type them.
  $("catIn").value="anthropology"; $("locIn").value="Sierra Mazateca, Oaxaca, Mexico";
  $("latIn").value="18.1333"; $("lngIn").value="-96.8333"; $("dateIn").value="2022-10-27"; syncDraftPin(); setSdgPick(["SDG10","SDG11","SDG16"]);
  adminState={sample:true}; resetSugs();
};
["tEn","dEn"].forEach(id=>$(id).addEventListener("input",()=>{ adminState.sample=false; }));
function resetSugs(){ $("sugs").innerHTML='<p class="placeholder-note">Suggestions are drawn from your description. You accept, edit or reject each one.</p>'; }

// Keywords and a short summary drafted from the description by the backend.
$("suggest").onclick=async()=>{
  const title=$("tEn").value.trim(), desc=$("dEn").value.trim();
  if (!title && !desc) { $("sugs").innerHTML='<p class="pubmsg" style="margin:0">Add a title or description in step 4 first.</p>'; return; }
  const b=$("suggest"); b.disabled=true; b.innerHTML='<span class="spin"></span>Reading';
  const done=()=>{ b.disabled=false; b.textContent="Suggest again"; };
  if (!apiLive) { $("sugs").innerHTML='<p class="placeholder-note">The backend is not running, so there is nothing to read your text yet.</p>'; done(); return; }
  try {
    const post=(path,body)=>fetch(API_BASE+path,{method:"POST",headers:{"Content-Type":"application/json","X-Admin-Token":DEV_ADMIN_TOKEN},body:JSON.stringify(body)}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
    const [kw,sm]=await Promise.all([post("/api/ai/keywords",{text:`${title}. ${desc}`,top_k:8}), post("/api/ai/summarize",{text:desc || title,max_sentences:2,method:"ai"})]);
    renderSugs([{k:"Keywords", type:"chips", v:kw.keywords ?? [], conf:"Extracted from your title and description", real:true},
                {k:"Preview summary", type:"text", v:sm.summary ?? "", conf: sm.fallback ? "Baseline summarizer: the most representative sentences of your description" : "AI draft from your description, edit before accepting", real:true}]);
  } catch(err) { $("sugs").innerHTML=`<p class="pubmsg" style="margin:0">Suggestions failed: ${esc(String(err.message))}</p>`; }
  done();
};
function renderSugs(list){
  $("sugs").innerHTML='<div class="sugs">'+list.map((s,i)=>{
    const v = s.type==="chips" ? `<div class="tchips">${s.v.map(x=>{ const m=s.k==="UN SDGs" && x.match(/SDG (\d+)/);
        return `<button type="button" aria-pressed="true" title="Click to remove"${m ? ` style="background:${SDGS[+m[1]][1]};color:#fff;border-color:transparent"` : ""}>${esc(x)}</button>`; }).join("")}</div>`
      : s.type==="text" ? `<textarea aria-label="${s.k}" style="color:var(--text);background:#fff;font:inherit;font-size:14px;border:1px solid var(--line);border-radius:6px;padding:8px;min-height:60px">${esc(s.v)}</textarea>`
      : `<strong>${esc(s.v)}</strong>`;
    return `<div class="sug" data-i="${i}"><span class="k">${s.k}</span><div class="v">${v}<span class="conf">${s.real ? "" : "Example score: "}${esc(s.conf)}</span></div>
      <div class="acts"><button type="button" class="ok">Accept</button><button type="button" class="no">Reject</button></div></div>`;}).join("")+'</div>';
}
$("sugs").addEventListener("click",e=>{
  const chip=e.target.closest(".tchips button"); if (chip){ chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed")!=="true"); return; }
  const row=e.target.closest(".sug"); if(!row) return;
  if (e.target.closest(".ok")) { row.classList.add("accepted"); row.classList.remove("rejected"); }
  if (e.target.closest(".no")) { row.classList.add("rejected"); row.classList.remove("accepted"); }
});
$("publish").onclick=async()=>{
  const lat=parseFloat($("latIn").value), lng=parseFloat($("lngIn").value);
  $("pubMsg").textContent="";
  if (!(Math.abs(lat)<=90 && Math.abs(lng)<=180)) { $("pubMsg").textContent="Add the coordinates first: type them in step 6 or use Pick on globe."; return; }
  if (apiLive) return publishToApi(lat,lng);
  if (sb) return publishToSupabase(lat,lng);
  const pending=[...document.querySelectorAll(".sug:not(.accepted):not(.rejected)")].length;
  $("publishArea").innerHTML=`<div class="done"><h3>Approved (mockup)</h3>
    <p>With the backend running, this saves the project with its photos, narration and PDF and sends it to a curator for the blue mark. Nothing was saved here.${pending?` ${pending} suggestion${pending>1?"s were":" was"} left unreviewed.`:""}</p>
    <div><button class="btn primary" type="button" id="toPin">${adminState.sample?"See it on the map":"Back to map"}</button></div></div>`;
  $("toPin").onclick=()=>{ adminEl.hidden=true; syncHeader();
    if (adminState.sample){ const d=items.find(x=>x.p.id==="17"); if(d) select(d); } };
};

const chipsOf = k => [...document.querySelectorAll(".sug")].filter(r=>r.querySelector(".k").textContent===k && !r.classList.contains("rejected"))
  .flatMap(r=>[...r.querySelectorAll('.tchips button[aria-pressed="true"]')].map(b=>b.textContent));
async function publishToApi(lat,lng){
  const btn=$("publish");
  if (!$("tEn").value.trim()) { $("pubMsg").textContent="Add a title in step 4 first."; return; }
  btn.disabled=true; btn.textContent="Saving…";
  const rows=[...document.querySelectorAll("#thumbs .shotrow")], pathRows=rows.filter(r=>!r._file), fileRows=rows.filter(r=>r._file);
  const summaryFromSugs=()=>{ const r=[...document.querySelectorAll(".sug")].find(x=>x.querySelector(".k").textContent==="Preview summary" && !x.classList.contains("rejected")); return r?.querySelector("textarea")?.value.trim(); };
  const body={
    title:$("tEn").value.trim(), description:$("dEn").value.trim() || $("pdfSummary")?.value.trim() || "",
    category:$("catIn").value, location_name:$("locIn").value.trim() || fmtLL(lat,lng), lat, lng,
    date:$("dateIn").value || new Date().toISOString().slice(0,10),
    keywords:[...new Set([...chipsOf("Keywords"), ...[...document.querySelectorAll('#pdfKw button[aria-pressed="true"]')].map(b=>b.textContent)])], sdgs:pickedSdgs(),
    images:pathRows.map(r=>r._src), captions:pathRows.map(r=>r.querySelector("textarea").value.trim()),
    summary:($("pdfSummary")?.value.trim()) || summaryFromSugs() || null,
    author_name:$("aName").value.trim() || "Unknown author", author_affiliation:$("aAff").value.trim() || "", author_website:$("aWeb").value.trim() || null,
  };
  try {
    const r=await fetch(`${API_BASE}/api/projects`,{method:"POST",headers:{"Content-Type":"application/json","X-Admin-Token":DEV_ADMIN_TOKEN},body:JSON.stringify(body)});
    const out=await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(typeof out.detail==="string" ? out.detail : JSON.stringify(out.detail ?? r.status));
    const auth={"X-Admin-Token":DEV_ADMIN_TOKEN}, problems=[];
    if (fileRows.length){
      const fd=new FormData(); fileRows.forEach(r=>{ fd.append("files",r._file); fd.append("captions",r.querySelector("textarea").value.trim()); });
      const r2=await fetch(`${API_BASE}/api/projects/${out.id}/images`,{method:"POST",headers:auth,body:fd});
      if (!r2.ok) problems.push("the photos");
    }
    if (pdfFile){
      const fd=new FormData(); fd.append("file",pdfFile); fd.append("title",body.title);
      fd.append("summary",$("pdfSummary")?.value.trim() ?? "");
      const r3=await fetch(`${API_BASE}/api/projects/${out.id}/documents`,{method:"POST",headers:auth,body:fd});
      if (!r3.ok) problems.push("the PDF");
    }
    await loadFromApi();
    const saved=[fileRows.length ? `${fileRows.length} photo${fileRows.length>1?"s":""} with narration` : "", pdfFile ? "the PDF" : ""].filter(Boolean).join(" and ");
    $("publishArea").innerHTML=`<div class="done"><h3>Saved as project #${out.id}</h3>
      <p>It's in the database at ${fmtLL(lat,lng)} and shows on the map as curation pending until a curator verifies it.${saved && !problems.length ? ` Stored ${saved}.` : ""}${problems.length ? ` The project was saved, but ${problems.join(" and ")} could not be uploaded.` : ""}</p>
      <div><button class="btn primary" type="button" id="toPin">See it on the map</button></div></div>`;
    $("toPin").onclick=()=>{ adminEl.hidden=true; syncHeader(); draftPin=null; const d=items.find(x=>x.p.id===String(out.id)); if(d) select(d); else placePins(); };
  } catch(err) {
    btn.disabled=false; btn.textContent="Approve and publish";
    $("pubMsg").textContent=`The API didn't save it: ${err.message}. Check the backend is running on ${API_BASE}.`;
  }
}

