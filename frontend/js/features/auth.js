// Sign-in gate (demo: any institutional email), sign-out, the travel route on the globe.
// ---------- sign-in gate (demo: no accounts yet; JWT + institutional allowlist replace this) ----------
const gate=$("gate"), SESSION_KEY="charter.session";
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const cap = s => s ? s[0].toUpperCase()+s.slice(1).toLowerCase() : s;
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)); } catch { return null; } };
// Two views: students explore, search and save; administrators also upload. The upload itself is enforced by
// Supabase (row-level security allows writes only from accounts in the admins table), not by hiding the button.
let isAdmin=false;
function applyUser(email, role){
  // name and institution come from the email (first.last@school → First Last, School) until the holder edits them
  loadProfile(email);
  isAdmin = role==="admin";
  ME.role = isAdmin ? "Administrator" : ME.role;
  $("userBtn").textContent=ME.given.toUpperCase();
  $("adminOpen").hidden=!isAdmin;
  if (!isAdmin && !adminEl.hidden) $("adminClose").click();
}
let gRole="student";
$("gRole").onclick=e=>{ const b=e.target.closest("[data-role]"); if (!b) return; gRole=b.dataset.role;
  $("gRole").querySelectorAll("[data-role]").forEach(x=>x.setAttribute("aria-checked", x===b));
  $("gNote").textContent = gRole==="admin"
    ? "Administrators sign in with their Charter account. Only accounts on the administrator list can upload projects."
    : "Students can explore, search and save projects. Demo sign-in: any institutional email and password are accepted until student accounts are connected. Your password is not stored.";
  $("gErr").textContent=""; };
// An administrator signs in to Supabase for real; the account must be in the admins table.
async function adminSignIn(email, pass){
  if (!sb) return null; // local development without Supabase: the backend's admin token is used instead
  const { data, error } = await sb.auth.signInWithPassword({ email, password:pass });
  if (error) return "That email and password did not work.";
  const { data:rows } = await sb.from("admins").select("user_id").eq("user_id", data.user.id);
  if (!rows?.length) { await sb.auth.signOut(); return "This account is not an administrator. Sign in as a student instead."; }
  return null;
}
function lock(){
  document.body.classList.add("locked"); gate.hidden=false; gate.classList.remove("leaving","stamped");
  showGateView("gSignin"); $("gPass").value=""; $("gPass").type="password"; $("gEye").setAttribute("aria-pressed", false); $("gErr").textContent=""; $("gSubmit").disabled=false;
  closeCard(); state.auto=true; state.k=1; syncZoom(); resize(); $("gEmail").focus();
}
function unlock(animate){
  const finish=()=>{ document.body.classList.remove("locked"); gate.hidden=true; resize(); };
  if (!animate) return finish();
  $("gstampDate").textContent=pdate(new Date().toISOString().slice(0,10));
  gate.classList.add("stamped");
  setTimeout(()=>gate.classList.add("leaving"), reduce ? 0 : 1050);
  setTimeout(finish, reduce ? 0 : 1550);
}
$("gEye").onclick=()=>{ const show=$("gPass").type==="password"; $("gPass").type=show ? "text" : "password";
  $("gEye").setAttribute("aria-pressed", show); $("gEye").setAttribute("aria-label", show ? "Hide password" : "Show password"); };
function showGateView(id){ const first=$(id).querySelector("input"); if (first && !gate.hidden) first.focus(); }
$("gSignin").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("gEmail").value.trim(), pass=$("gPass").value;
  const badEmail=!validEmail(email), badPass=!pass;
  $("gEmail").setAttribute("aria-invalid",badEmail); $("gPass").setAttribute("aria-invalid",badPass);
  $("gErr").textContent = badEmail ? "Enter your institutional email, like name@university.edu." : badPass ? "Enter your password." : "";
  if (badEmail) return $("gEmail").focus(); if (badPass) return $("gPass").focus();
  $("gSubmit").disabled=true;
  if (gRole==="admin"){
    $("gSubmit").textContent="Checking…";
    const err=await adminSignIn(email, pass);
    $("gSubmit").textContent="Enter the map";
    if (err) { $("gErr").textContent=err; $("gSubmit").disabled=false; return; }
  } else if (sb) await sb.auth.signOut(); // a student session never carries upload rights
  try { ($("gKeep").checked ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({email, role:gRole})); } catch {}
  $("gPass").value="";
  applyUser(email, gRole); unlock(true);
});
function signOut(){
  try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch {}
  if (sb) sb.auth.signOut();
  closeProfile(); showRoute(false); adminEl.hidden=true; syncHeader(); closeStory(); lock();
}

// The holder's saved places, joined as great-circle legs from home, drawn on the globe.
var routeLegs=null; // var: draw() can run before this line executes
function showRoute(on){
  routeLegs = on ? (()=>{ const s=[ME.home, ...savedEntries().map(e=>[e.p.lng,e.p.lat])]; return s.slice(1).map((to,i)=>[s[i],to]); })() : null;
  $("routeTxt").textContent=`Showing ${ME.given}'s route · ${savedEntries().length} ${isAdmin ? "projects" : "saved projects"}`;
  $("routechip").hidden=!on; state.auto=false;
  if (on) flyTo(ME.home); else draw();
}
$("routeOff").onclick=()=>showRoute(false);
function drawRoute(){
  if (!routeLegs) return;
  ctx.save(); ctx.beginPath(); path({type:"Sphere"}); ctx.clip();
  ctx.setLineDash([6,4]); ctx.lineWidth=2.2; ctx.strokeStyle="#ffe3a3"; ctx.lineCap="round";
  for (const [a,b] of routeLegs){ ctx.beginPath(); path({type:"LineString",coordinates:[a,b]}); ctx.stroke(); }
  ctx.setLineDash([]);
  if (isVisible(ME.home)){ const [x,y]=projection(ME.home); ctx.fillStyle="#ffe3a3"; ctx.strokeStyle="#1f3b44"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(x,y,6,0,7); ctx.fill(); ctx.stroke();
    ctx.font="600 11px 'Instrument Sans', system-ui, sans-serif"; ctx.textAlign="left"; ctx.fillStyle="#fff"; ctx.fillText(`Home · ${(ME.based || "").split(",")[0] || "Home"}`,x+10,y+4); }
  ctx.restore();
}

