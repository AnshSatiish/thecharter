// Animation loop and start-up. Loaded last: every other file has defined its names by now.
// ---------- loop ----------
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let prev=performance.now();
function loop(now){
  const dt=now-prev; prev=now;
  const covered = !story.hidden || !adminEl.hidden || !profileEl.hidden || !sitePg.hidden || !lbEl.hidden || document.hidden;
  if (covered) { /* the globe is not visible */ }
  else if (state.auto && !reduce && !picking && state.proj==="globe"){ state.rot[0]+=dt*0.004; lastMove=now; draw(); }
  else if (geoHi && hiAllowed && !drawnHi && state.k>=HI_ZOOM && now-lastMove>240) draw();   // view settled: sharpen once
  requestAnimationFrame(loop);
}

// ---------- boot ----------
fetch("data/countries-110m.json").then(r=>r.json()).then(world=>{
  geoLo=toGeo(world); draw();
  if (hiAllowed) setTimeout(()=>fetch("data/countries-50m.json").then(r=>r.json()).then(w=>{ geoHi=toGeo(w); }).catch(()=>{}), 1200);
}).catch(()=>{ document.querySelector(".hint").textContent="Country shapes failed to load. Pins still work."; });
addEventListener("resize",resize);
if (innerWidth<760) setPanel(false);
{ const s=readSession(); if (s?.email && validEmail(s.email)) {
    applyUser(s.email, s.role);
    // an administrator view needs a live Supabase session; if it has expired, fall back to the student view
    if (s.role==="admin" && sb) sb.auth.getSession().then(({ data }) => { if (!data.session) applyUser(s.email, "student"); });
  } else { document.body.classList.add("locked"); gate.hidden=false; $("gEmail").focus(); } }
resize(); refresh(); requestAnimationFrame(loop);
loadFromApi();
