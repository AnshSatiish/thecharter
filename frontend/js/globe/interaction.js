// Drag to rotate, wheel or pinch to zoom, click to select.
// ---------- interaction: drag = rotate, wheel/pinch = zoom ----------
let last={x:0,y:0,k:1}, syncing=false;
const MAX_K=14;
const zoom=d3.zoom().scaleExtent([0.7,MAX_K]).clickDistance(4)
  .on("start",()=>{ state.auto=false; })
  .on("zoom",e=>{
    if (syncing) return;
    const t=e.transform;
    if (Math.abs(t.k-last.k)>1e-6){
      // zoom toward the point under the cursor: keep that place under the cursor while the scale changes
      const se=e.sourceEvent, ptr = se && se.type==="wheel" && state.proj==="globe" ? d3.pointer(se, canvas) : null;
      const before = ptr ? projection.invert(ptr) : null;
      state.k=t.k;
      if (before && isFinite(before[0]) && isFinite(before[1])){
        for (let i=0; i<2; i++){
          setupProjection(); const now=projection.invert(ptr);
          if (!now || !isFinite(now[0]) || !isFinite(now[1])) break;
          state.rot[0]+=now[0]-before[0]; state.rot[1]=Math.max(-85,Math.min(85,state.rot[1]+now[1]-before[1]));
        }
      }
    }
    else {
      // on the globe, one pixel of drag moves the map one pixel at the centre, at any zoom
      const dx=t.x-last.x, dy=t.y-last.y, s = state.proj==="globe" ? 180/(Math.PI*projection.scale()) : 0.28/state.k;
      // a degree of longitude is shorter away from the equator, so sideways drags scale with the latitude in view
      state.rot[0]+=dx*s/(state.proj==="globe" ? Math.max(0.35, Math.cos(state.rot[1]*Math.PI/180)) : 1);
      if (state.proj==="globe") state.rot[1]=Math.max(-85,Math.min(85,state.rot[1]-dy*s));
      else state.panY=Math.max(-H*state.k*0.6,Math.min(H*state.k*0.6,state.panY+dy));
    }
    last={x:t.x,y:t.y,k:t.k}; lastMove=performance.now(); draw();
  });
const csel=d3.select(canvas).call(zoom).on("dblclick.zoom",null);
function syncZoom(){ syncing=true; const t=d3.zoomIdentity.translate(last.x,last.y).scale(state.k); csel.call(zoom.transform,t); last={x:t.x,y:t.y,k:t.k}; syncing=false; }
canvas.addEventListener("click",e=>{
  if (!picking) return closeCard();
  const ll=eventLL(e); if (!ll) return;
  $("latIn").value=ll[1].toFixed(4); $("lngIn").value=ll[0].toFixed(4); syncDraftPin();
  setTimeout(endPick, 450);
});
document.getElementById("zin").onclick=()=>zoomBy(1.5);
document.getElementById("zout").onclick=()=>zoomBy(1/1.5);
function zoomBy(f){ const a=state.k, b=Math.max(0.7,Math.min(MAX_K,a*f));
  d3.transition().duration(300).tween("z",()=>tt=>{ state.k=a+(b-a)*tt; lastMove=performance.now(); syncZoom(); draw(); }); }

