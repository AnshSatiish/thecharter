// Admin sign-in and publishing to Supabase, used on the deployed site.
// ---------- Supabase: administrator sign-in and publishing (used when our backend is not running) ----------
let sbAdmin=false;
async function renderSbAuth(){
  const box=$("sbAuth");
  if (!sb || apiLive){ box.hidden=true; return; }
  box.hidden=false;
  const { data:{ session } } = await sb.auth.getSession();
  if (!session){
    sbAdmin=false;
    box.innerHTML=`<p><strong>Administrator sign-in.</strong> Publishing puts the project on the live map for everyone, so it needs an administrator account.</p>
      <form class="row" id="sbForm"><label class="fld" for="sbEmail">Email<input id="sbEmail" type="email" autocomplete="username" required></label>
      <label class="fld" for="sbPass">Password<input id="sbPass" type="password" autocomplete="current-password" required></label>
      <button class="btn primary" type="submit" id="sbGo">Sign in</button></form><p class="pubmsg" id="sbMsg" role="status"></p>`;
    $("sbForm").onsubmit=async e=>{ e.preventDefault(); $("sbGo").disabled=true; $("sbMsg").textContent="";
      const { error } = await sb.auth.signInWithPassword({ email:$("sbEmail").value.trim(), password:$("sbPass").value });
      $("sbGo").disabled=false;
      if (error) { $("sbMsg").textContent="That email and password did not work."; return; }
      renderSbAuth(); };
    return;
  }
  const { data } = await sb.from("admins").select("user_id").eq("user_id", session.user.id);
  sbAdmin=!!data?.length;
  box.innerHTML=`<p>${sbAdmin ? "Signed in as administrator" : "Signed in, but this account is not an administrator"}: <strong>${esc(session.user.email)}</strong></p>`;
}
$("adminOpen").addEventListener("click", renderSbAuth);

// Photographs are reduced to 2000 px on the long side before upload, to fit the free storage plan.
async function shrinkImage(file, max=2000, quality=0.85){
  const bmp=await createImageBitmap(file), k=Math.min(1, max/Math.max(bmp.width, bmp.height));
  const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k);
  c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  return new Promise(res=>c.toBlob(res,"image/jpeg",quality));
}
async function publishToSupabase(lat,lng){
  const btn=$("publish");
  if (!$("tEn").value.trim()) { $("pubMsg").textContent="Add a title in step 4 first."; return; }
  if (!sbAdmin) { $("pubMsg").textContent="Sign in with an administrator account at the top of this page first."; $("sbAuth").scrollIntoView({block:"center"}); return; }
  btn.disabled=true; btn.textContent="Saving…";
  try {
    const folder=crypto.randomUUID(), rows=[...document.querySelectorAll("#thumbs .shotrow")];
    const images=[], captions=[];
    for (const [i,row] of rows.entries()){
      let url=row._src;
      if (row._file){
        btn.textContent=`Uploading photo ${i+1} of ${rows.length}…`;
        const path=`${folder}/photo-${i+1}.jpg`;
        const { error } = await sb.storage.from(SB_BUCKET).upload(path, await shrinkImage(row._file), { contentType:"image/jpeg" });
        if (error) throw error;
        url=sb.storage.from(SB_BUCKET).getPublicUrl(path).data.publicUrl;
      }
      images.push(url); captions.push(row.querySelector("textarea").value.trim());
    }
    let doc={};
    if (pdfFile){
      if (pdfFile.size > 50*1048576) throw new Error("the PDF is larger than 50 MB");
      btn.textContent="Uploading the PDF…";
      const path=`${folder}/document.pdf`;
      const { error } = await sb.storage.from(SB_BUCKET).upload(path, pdfFile, { contentType:"application/pdf" });
      if (error) throw error;
      doc={ document_url:sb.storage.from(SB_BUCKET).getPublicUrl(path).data.publicUrl, document_name:pdfFile.name, document_size:pdfFile.size };
    }
    const summaryFromSugs=()=>{ const r=[...document.querySelectorAll(".sug")].find(x=>x.querySelector(".k").textContent==="Preview summary" && !x.classList.contains("rejected")); return r?.querySelector("textarea")?.value.trim(); };
    const row={
      title:$("tEn").value.trim(), description:$("dEn").value.trim(), category:$("catIn").value,
      location_name:$("locIn").value.trim() || fmtLL(lat,lng), lat, lng, date:$("dateIn").value || new Date().toISOString().slice(0,10),
      keywords:[...new Set([...chipsOf("Keywords"), ...[...document.querySelectorAll('#pdfKw button[aria-pressed="true"]')].map(b=>b.textContent)])],
      sdgs:pickedSdgs(), images, captions, summary:($("pdfSummary")?.value.trim()) || summaryFromSugs() || null,
      author_name:$("aName").value.trim() || "Unknown author", author_affiliation:$("aAff").value.trim() || null,
      author_website:$("aWeb").value.trim() || null, ...doc,
    };
    btn.textContent="Saving…";
    const { data, error } = await sb.from("projects").insert(row).select().single();
    if (error) throw error;
    await loadFromSupabase();
    addUploadStamp("u"+data.id);
    $("publishArea").innerHTML=`<div class="done"><h3>Published</h3>
      <p>The project is saved at ${fmtLL(lat,lng)} with ${images.length} photo${images.length===1?"":"s"}${doc.document_url ? " and the PDF" : ""}. Everyone visiting the site now sees it on the map, marked as curation pending until it is verified.</p>
      <div><button class="btn primary" type="button" id="toPin">See it on the map</button></div></div>`;
    $("toPin").onclick=()=>{ adminEl.hidden=true; syncHeader(); draftPin=null; const d=items.find(x=>x.p.id==="u"+data.id); if(d) select(d); else placePins(); };
  } catch(err) {
    btn.disabled=false; btn.textContent="Approve and publish";
    $("pubMsg").textContent=`It was not saved: ${err.message || err}.`;
  }
}

