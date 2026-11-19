// Map tools (projection, researcher mode, borders, places) and header navigation.
// ---------- tools ----------
document.querySelectorAll(".proj button").forEach(b=>b.onclick=()=>{
  state.proj=b.dataset.proj; state.panY=0;
  document.querySelectorAll(".proj button").forEach(x=>x.setAttribute("aria-pressed", x===b));
  if (state.proj!=="globe") state.rot[1]=0;
  draw();
});
const modeBtn=document.getElementById("mode");
modeBtn.onclick=()=>{ state.researchers=!state.researchers; modeBtn.setAttribute("aria-pressed",state.researchers);
  document.getElementById("modeLabel").textContent = state.researchers ? "Showing researchers" : "Researchers";
  closeCard(); refresh(); };
const tog=(id,key,after)=>{ const b=document.getElementById(id); b.onclick=()=>{ state[key]=!state[key]; b.setAttribute("aria-pressed",state[key]); after&&after(); draw(); }; };
tog("borders","borders"); tog("places","places");

const drawer=document.getElementById("drawer");
const openDrawer=()=>{ closePages(); drawer.classList.add("open"); document.getElementById("drawerClose").focus(); };
// Pages (project, upload, profile) open under the site header. Only one is open at a time.
// The section pages (New entries, Community, Events, Sponsors) sit just below them, so a project opened from one
// returns to it when closed.
const sitePg=document.getElementById("sitePage");
let curPage=null;
function closePages(){
  if (!lbEl.hidden) lbEl.hidden=true;
  sitePg.hidden=true; curPage=null;
  story.hidden=true; adminEl.hidden=true; syncHeader(); profileEl.hidden=true; syncHeader(); draw();
}
function syncHeader(){
  const home = story.hidden && adminEl.hidden && profileEl.hidden && sitePg.hidden;
  const map=document.getElementById("navMap"); home ? map.setAttribute("aria-current","page") : map.removeAttribute("aria-current");
  document.querySelectorAll(".nav [data-page]").forEach(b=>{
    if (!sitePg.hidden && story.hidden && adminEl.hidden && profileEl.hidden && b.dataset.page===curPage) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  document.getElementById("adminOpen").setAttribute("aria-pressed", !adminEl.hidden);
  document.getElementById("userBtn").setAttribute("aria-pressed", !profileEl.hidden);
}
function goHome(e){ e?.preventDefault(); closePages(); drawer.classList.remove("open"); closeCard(); stage.scrollTop=0; document.getElementById("homeLink").blur(); }
document.getElementById("homeLink").onclick=goHome;
document.getElementById("navMap").onclick=goHome;
document.getElementById("resultsBtn").onclick=openDrawer;
document.getElementById("navProjects").onclick=openDrawer;
document.getElementById("drawerClose").onclick=()=>drawer.classList.remove("open");

