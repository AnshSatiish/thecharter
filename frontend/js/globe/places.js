// City and country labels on the globe (Natural Earth).
// ---------- places: cities and country names (Natural Earth, public domain) ----------
// More appear as you zoom in; the most important are placed first and a label is skipped when it would
// overlap another label or a project pin.
let PLACES=null, COUNTRY_LABELS=null;
fetch("data/cities.json").then(r=>r.json()).then(c=>{ PLACES=c; draw(); }).catch(()=>{});
function countryLabels(geo){
  return geo.countries.map(f=>{
    const polys = f.geometry.type==="MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    let best=null, bestA=0;
    for (const p of polys){ const g={type:"Polygon",coordinates:p}; let a=d3.geoArea(g); if (a>2*Math.PI) a=4*Math.PI-a; if (a>bestA){ bestA=a; best=g; } }
    return best ? { name:f.properties.name, c:d3.geoCentroid(best), a:bestA } : null;
  }).filter(Boolean).sort((a,b)=>b.a-a.a);
}
function drawPlaces(){
  if (!state.places || document.body.classList.contains("locked") || (!PLACES && !COUNTRY_LABELS)) return;
  if (!COUNTRY_LABELS && geoLo) COUNTRY_LABELS=countryLabels(geoLo);
  const k=state.k, r=projection.scale(), taken=[];
  const free=(x,y,w,h)=>{ for (const q of taken) if (x<q[0]+q[2] && x+w>q[0] && y<q[1]+q[3] && y+h>q[1]) return false; taken.push([x,y,w,h]); return true; };
  for (const d of items){ if (!isVisible([d.lng,d.lat])) continue; const [x,y]=projection([d.lng,d.lat]); taken.push([x-20,y-48,40,50]); }
  ctx.save(); ctx.textBaseline="middle"; ctx.lineJoin="round";
  if (PLACES){
    // few cities from far away, more only as you get close; a roomy gap around every label
    const maxRank = k<1.6 ? 0 : k<2.6 ? 1 : k<4 ? 2 : k<6.5 ? 3 : k<10 ? 4 : 6;
    const cap = k<1.6 ? 18 : k<4 ? 32 : 48, pad=10;
    let n=0;
    ctx.textAlign="left";
    for (const [name,lng,lat,rank,isCap] of PLACES){
      if (rank>maxRank) break;
      if (!isVisible([lng,lat])) continue;
      const [x,y]=projection([lng,lat]);
      if (x<8 || y<8 || x>W-8 || y>H-8) continue;
      ctx.font = isCap ? "600 11.5px 'Instrument Sans', system-ui, sans-serif" : "500 11px 'Instrument Sans', system-ui, sans-serif";
      const w=ctx.measureText(name).width;
      if (!free(x-6-pad,y-8-pad/2,w+16+pad*2,16+pad)) continue;
      // marker: a small ink dot with a paper ring; capitals get a square
      ctx.fillStyle="rgba(251,246,236,.95)"; ctx.strokeStyle="#2a211a"; ctx.lineWidth=1.4;
      if (isCap){ ctx.fillRect(x-3.5,y-3.5,7,7); ctx.strokeRect(x-3.5,y-3.5,7,7); ctx.fillStyle="#2a211a"; ctx.fillRect(x-1.5,y-1.5,3,3); }
      else { ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.fill(); ctx.stroke(); }
      // label: dark ink with a soft paper halo, like a printed atlas
      ctx.lineWidth=3.5; ctx.strokeStyle="rgba(251,246,236,.82)"; ctx.strokeText(name,x+8,y);
      ctx.fillStyle="#2a211a"; ctx.fillText(name,x+8,y);
      if (++n>=cap) break;
    }
  }
  if (COUNTRY_LABELS){
    ctx.font="600 10px 'Instrument Sans', system-ui, sans-serif"; ctx.textAlign="center";
    if ("letterSpacing" in ctx) ctx.letterSpacing="1.6px";
    for (const c of COUNTRY_LABELS){
      if (c.a*r*r<2200) break;   // sorted by area: the rest are too small at this zoom
      if (!isVisible(c.c)) continue;
      const [x,y]=projection(c.c), label=c.name.toUpperCase(), w=ctx.measureText(label).width;
      if (!free(x-w/2-4,y-7,w+8,14)) continue;
      ctx.fillStyle="rgba(62,42,22,.58)"; ctx.fillText(label,x,y);
    }
  }
  ctx.restore();
}
function isVisible(c){
  if (state.proj==="globe"){ const rot=projection.rotate(); return d3.geoDistance(c,[-rot[0],-rot[1]])<Math.PI/2-0.03; }
  const p=projection(c); return p && p[0]>-20 && p[0]<W+20 && p[1]>-20 && p[1]<H+20;
}

