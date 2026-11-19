// Load projects from Supabase or the backend, falling back to the built-in sample.
const SAMPLE_PROJECTS = PROJECTS.slice();
async function loadFromSupabase(){
  const src=$("src");
  try {
    const { data, error } = await sb.from("projects").select("*").order("created_at", { ascending:false });
    if (error) throw error;
    PROJECTS.splice(0, PROJECTS.length, ...data.map(fromSupabase), ...SAMPLE_PROJECTS);
    sbLive=true; buildFilters(); refresh();
    if (curPage==="entries" || curPage==="community") renderSitePage();
    src.innerHTML=`<span class="dot live"></span>${data.length} uploaded project${data.length===1?"":"s"} · ${SAMPLE_PROJECTS.length} samples`;
  } catch { sbLive=false; src.innerHTML='<span class="dot"></span>Sample data'; }
}
async function loadFromApi(){
  const src=$("src");
  if (!API_BASE){ if (sb) return loadFromSupabase(); src.innerHTML='<span class="dot"></span>Sample data'; return; }
  try {
    const r=await fetch(`${API_BASE}/api/projects`); if (!r.ok) throw new Error(r.status);
    const data=await r.json();
    PROJECTS.splice(0, PROJECTS.length, ...data.map(fromApi));
    apiLive=true; buildFilters(); refresh(); searchApi();
    src.innerHTML=`<span class="dot live"></span>Live from the API · ${data.length} projects`;
  } catch {
    apiLive=false; src.innerHTML='<span class="dot"></span>Sample data · API offline';
    if (sb) loadFromSupabase();
  }
}

