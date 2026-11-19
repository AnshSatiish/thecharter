// The D3 globe: projection, sizing, land and borders, the draw loop's drawing step.
// ---------- globe ----------
const stage=document.getElementById("stage"), canvas=document.getElementById("globe"), ctx=canvas.getContext("2d");
const svg=d3.select("#pins");
let W=0,H=0,DPR=1, projection=d3.geoOrthographic(), path;
// Country outlines come in two detail levels (Natural Earth 1:110m and 1:50m). The light one is drawn while the
// globe moves; the detailed one is drawn once the view is still and zoomed in, then reused from a cached copy.
let geoLo=null, geoHi=null, lastMove=0, baseKey=null, drawnHi=false;
let hiAllowed=!matchMedia("(pointer:coarse)").matches;   // phones keep the light outlines
const HI_ZOOM=1.8, baseCanvas=document.createElement("canvas");
const toGeo = world => ({ countries:topojson.feature(world,world.objects.countries).features,
  land:topojson.feature(world,world.objects.land), borders:topojson.mesh(world,world.objects.countries,(a,b)=>a!==b) });
const graticule=d3.geoGraticule10();
const LAND=["#F3CD8E","#EDB877","#E6A765","#F6DBA6","#DDB47C","#BFCB73","#A9BC62","#E9C27F"];
const hash = s => { let h=0; for (const c of String(s)) h=(h*31+c.charCodeAt(0))|0; return Math.abs(h); };

function resize(){
  const r=canvas.getBoundingClientRect(); W=r.width; H=r.height; DPR=Math.min(2,devicePixelRatio||1);
  canvas.width=W*DPR; canvas.height=H*DPR; draw();
}
function center(){
  // signed out: the globe sits to the left of the passport cover (above it on phones)
  if (document.body.classList.contains("locked")){
    if (W>860) return [W*0.33, H*0.5];
    // phones: the globe's centre sits at the sheet's top edge, so its upper half rises behind the card
    const top=document.querySelector(".pass").getBoundingClientRect().top;
    return [W/2, Math.max(Math.min(W,H)*0.42+28, top-4)];
  }
  const off = (!panel.classList.contains("closed") && W>900) ? 170 : 0;
  return [W/2+off, H/2+28]; // centred in the part below the header
}
function setupProjection(){
  const [cx,cy]=center();
  if (state.proj==="globe"){
    projection=d3.geoOrthographic().clipAngle(90).rotate(state.rot)
      .scale(Math.min(W,H)*0.42*state.k).translate([cx,cy]).precision(0.4);
  } else if (state.proj==="mercator"){
    const s=Math.max(W/(2*Math.PI), H/(2*Math.PI*0.72))*state.k*0.9;
    projection=d3.geoMercator().rotate([state.rot[0],0]).scale(s).translate([cx,cy+state.panY]);
  } else {
    const s=Math.min(W/5.6, H/2.8)*state.k;
    projection=d3.geoEqualEarth().rotate([state.rot[0],0]).scale(s).translate([cx,cy+state.panY]);
  }
  path=d3.geoPath(projection, ctx);
}

let t0=performance.now();
function draw(){
  if (!W) return;
  setupProjection();
  const t=(performance.now()-t0)/1000;
  const globe = state.proj==="globe";
  const [cx,cy]=projection.translate(), r=projection.scale();
  const useHi = !!geoHi && hiAllowed && state.k>=HI_ZOOM && performance.now()-lastMove>220;
  const geo = useHi ? geoHi : geoLo;
  const key = useHi ? [state.proj,state.rot[0].toFixed(3),state.rot[1].toFixed(3),state.k.toFixed(4),Math.round(state.panY),W,H,Math.round(cx),Math.round(cy),state.borders].join("|") : null;
  drawnHi = useHi;
  if (useHi && key===baseKey){
    // nothing moved since the detailed map was drawn: paint the saved copy
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(baseCanvas,0,0);
    ctx.setTransform(DPR,0,0,DPR,0,0); ctx.save(); ctx.beginPath(); path({type:"Sphere"}); ctx.clip();
  } else {
  const started=performance.now();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);

  // atmosphere
  if (globe){
    const g=ctx.createRadialGradient(cx,cy,r*0.96,cx,cy,r*1.16);
    g.addColorStop(0,"rgba(140,210,240,.45)"); g.addColorStop(1,"rgba(140,210,240,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r*1.16,0,7); ctx.fill();
  }
  // ocean
  ctx.beginPath(); path({type:"Sphere"});
  if (globe){
    const g=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.05,cx,cy,r);
    g.addColorStop(0,"#4aa7b8"); g.addColorStop(.55,"#23677f"); g.addColorStop(1,"#143f56");
    ctx.fillStyle=g;
  } else ctx.fillStyle="#1f5f77";
  ctx.fill();
  ctx.save(); ctx.beginPath(); path({type:"Sphere"}); ctx.clip();

  ctx.beginPath(); path(graticule); ctx.strokeStyle="rgba(255,255,255,.08)"; ctx.lineWidth=.7; ctx.stroke();
  if (geo){
    // shallow-water halo around coasts
    ctx.beginPath(); path(geo.land); ctx.strokeStyle="rgba(150,222,214,.45)"; ctx.lineWidth=Math.min(9,Math.max(4,5*Math.sqrt(state.k))); ctx.lineJoin="round"; ctx.stroke();
    for (const f of geo.countries){ ctx.beginPath(); path(f); ctx.fillStyle=LAND[hash(f.properties.name)%LAND.length]; ctx.fill(); }
    ctx.beginPath(); path(geo.land); ctx.strokeStyle="rgba(120,80,40,.35)"; ctx.lineWidth=.8; ctx.stroke();
    ctx.beginPath(); path(geo.borders);
    if (state.borders){ ctx.strokeStyle="#2b1d12"; ctx.lineWidth=1.4; ctx.setLineDash([]); }
    else { ctx.strokeStyle="rgba(255,255,255,.45)"; ctx.lineWidth=.5; }
    ctx.stroke();
  }
  if (useHi){
    // keep a copy of the finished map so later redraws of the same view do not redraw 80,000 outline points
    baseCanvas.width=canvas.width; baseCanvas.height=canvas.height; baseCanvas.getContext("2d").drawImage(canvas,0,0); baseKey=key;
    if (performance.now()-started>900) hiAllowed=false;   // too slow on this device: stay on the light outlines
  }
  }
  ctx.restore();
  if (typeof drawRoute==="function") drawRoute();
  // limb shading + highlight for a 3D feel
  if (globe){
    let g=ctx.createRadialGradient(cx-r*.3,cy-r*.35,r*.1,cx,cy,r);
    g.addColorStop(0,"rgba(255,255,255,.14)"); g.addColorStop(.6,"rgba(255,255,255,0)"); g.addColorStop(1,"rgba(5,20,35,.42)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  }
  drawPlaces();
  placePins();
}
