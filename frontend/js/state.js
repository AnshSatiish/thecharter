// Categories, SDG colours, small formatting helpers, the API-to-page mapping, and the shared `state`.

const CATS = {
  wildlife:     {label:"Wildlife & human interaction", color:"#64A70B", ink:"#447A10", g:"W"},
  anthropology: {label:"Anthropology",                 color:"#C9A86A", ink:"#86692F", g:"A"},
  urban:        {label:"Urban life",                   color:"#4a4a4a", ink:"#3D3D3D", g:"U"},
  border:       {label:"Cross-border interactions",    color:"#F68B1F", ink:"#AD5907", g:"B"},
  news:         {label:"News",                         color:"#E64626", ink:"#C8351B", g:"N"},
};
// Official UN SDG names and colours (UN SDG communications guidelines).
const SDGS = {1:["No poverty","#E5243B"],2:["Zero hunger","#DDA63A"],3:["Good health and well-being","#4C9F38"],4:["Quality education","#C5192D"],
  5:["Gender equality","#FF3A21"],6:["Clean water and sanitation","#26BDE2"],7:["Affordable and clean energy","#FCC30B"],8:["Decent work and economic growth","#A21942"],
  9:["Industry, innovation and infrastructure","#FD6925"],10:["Reduced inequalities","#DD1367"],11:["Sustainable cities and communities","#FD9D24"],
  12:["Responsible consumption and production","#BF8B2E"],13:["Climate action","#3F7E44"],14:["Life below water","#0A97D9"],15:["Life on land","#56C02B"],
  16:["Peace, justice and strong institutions","#00689D"],17:["Partnerships for the goals","#19486A"]};
const sdgNum = s => +String(s).replace(/\D/g,"");
const sdgTile = s => { const n=sdgNum(s), [name,c]=SDGS[n] ?? ["","#666"]; return `<span class="sdgt" style="background:${c}"><b>${n}</b>${name}</span>`; };
const CHECK = '<svg class="check" viewBox="0 0 24 24" aria-label="Curated"><path fill="#1d8cf0" d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.8-1 3 1 3-2.7 1.8-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3L2.5 16l1-3-1-3 2.7-1.8 1-3 3.2.2z"/><path d="m7.8 12.2 2.8 2.8 5.6-5.8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Search runs on the backend when it is up (backend/api/app/services/search/): full-text search for
// "Keywords", and for "By meaning" a sentence embedding model that ranks projects by how close their text is to
// the query. Without the backend, both run in the page (see "keyword ranking" and "search by meaning" below).
const EXAMPLES=["grief rituals","people forced to leave home","young people protesting","climate and livelihoods"];

const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const initials = n => n.replace(/^(Dr\.?)\s+/,"").split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();
const affCode = a => { const m = a.match(/\(([^)]+)\)/); if (m) return m[1];
  return a.split(/\s+/).filter(w=>/^[A-Z]/.test(w) && !["of","de","the"].includes(w)).map(w=>w[0]).join("").slice(0,4); };
// Sample photos live in assets/projects/thumbs/ (1920px copies in full/). Records saved before the move say "img/...".
const assetPath = u => String(u).replace(/^img\/(full\/)?(p\d+_\d+\.jpg)$/, (_, full, f) => `assets/projects/${full ? "full" : "thumbs"}/${f}`);
const img = (p,i=0) => p.images?.length ? assetPath(p.images[Math.min(i,p.images.length-1)]) : p.imgs ? `assets/projects/thumbs/p${p.id}_${Math.min(i,p.imgs-1)}.jpg` : "";
const imgFull = (p,i=0) => { const u=img(p,i); return /^assets\/projects\/thumbs\/p\d+_\d+\.jpg$/.test(u) ? u.replace("/thumbs/","/full/") : u; };
// Dates are stored as plain days; format them in UTC so no timezone shifts them by one.
const fmtDate = iso => new Date(iso+"T00:00:00Z").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",timeZone:"UTC"});
const fmtSize = b => b>=1048576 ? (b/1048576).toFixed(1)+" MB" : Math.max(1,Math.round(b/1024))+" KB";
const fmtLL = (lat,lng) => `${Math.abs(lat).toFixed(2)}° ${lat>=0?"N":"S"}, ${Math.abs(lng).toFixed(2)}° ${lng>=0?"E":"W"}`;
const fromApi = p => ({ id:String(p.id), title:p.title, author:p.author?.name ?? "Unknown author", prof:p.author?.profession ?? "",
  aff:p.author?.affiliation ?? "", cat:CATS[p.category] ? p.category : "news", loc:p.location_name, lat:p.lat, lng:p.lng,
  date:p.date, year:p.year ?? +String(p.date).slice(0,4), desc:p.description, kw:p.keywords ?? [], sdgs:p.sdgs ?? [],
  images:(p.images ?? []).map(u=>u.startsWith("/files/") ? API_BASE+u : u), imgs:(p.images ?? []).length, web:p.author?.website, verified:!!p.verified,
  caps:p.captions ?? [], summary:p.summary ?? "", docs:p.documents ?? [] });

// ---------- state ----------
let years = [...new Set(PROJECTS.map(p=>p.year))].sort();
let sdgList = [...new Set(PROJECTS.flatMap(p=>p.sdgs))].sort((a,b)=>+a.slice(3)-+b.slice(3));
const state = {
  q:"", semantic:false, cats:new Set(Object.keys(CATS)), sdgs:new Set(), y0:years[0], y1:years.at(-1),
  proj:"globe", researchers:false, borders:false, places:true, selected:null,
  rot:[70,-10], k:1, panY:0, auto:true,
};

