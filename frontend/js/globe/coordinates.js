// Cursor latitude/longitude and country name under the pointer.
// ---------- coordinates: cursor readout + pick on globe ----------
const coordsEl=$("coords");
function eventLL(e){
  const r=canvas.getBoundingClientRect(), xy=[e.clientX-r.left, e.clientY-r.top];
  const ll=projection.invert(xy);
  if (!ll || !isFinite(ll[0]) || !isFinite(ll[1])) return null;
  if (state.proj==="globe"){ const rot=projection.rotate(); if (d3.geoDistance(ll,[-rot[0],-rot[1]])>Math.PI/2) return null; }
  else { const back=projection(ll); if (!back || Math.hypot(back[0]-xy[0],back[1]-xy[1])>1) return null; }
  return ll;
}
// Which country a coordinate is in, from the most detailed outlines loaded. A bounding box check keeps it fast.
const boundsOf=new WeakMap();
function countryAt(ll){
  const list=(geoHi || geoLo)?.countries; if (!list) return null;
  for (const f of list){
    let b=boundsOf.get(f); if (!b){ b=d3.geoBounds(f); boundsOf.set(f,b); }
    const [[w,s],[e,n]]=b, inLng = w<=e ? (ll[0]>=w && ll[0]<=e) : (ll[0]>=w || ll[0]<=e);
    if (inLng && ll[1]>=s && ll[1]<=n && d3.geoContains(f,ll)) return f.properties.name;
  }
  return null;
}
let lastCountry=0, countryText="";
canvas.addEventListener("mousemove",e=>{ const ll=eventLL(e); coordsEl.hidden=!ll; if (!ll) return;
  const now=performance.now();
  if (now-lastCountry>70){ lastCountry=now; const c=countryAt(ll); countryText = c ? " · "+c : ""; }
  coordsEl.textContent=fmtLL(ll[1],ll[0])+countryText; });
canvas.addEventListener("mouseleave",()=>{ coordsEl.hidden=true; });

