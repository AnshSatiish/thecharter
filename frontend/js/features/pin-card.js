// The preview card that opens when a pin is selected; flying to a point.
// ---------- card ----------
const card=document.getElementById("card");
function select(d){
  state.selected=d.id; state.auto=false;
  flyTo([d.lng,d.lat]);
  const p=d.p;
  if (d.kind==="project"){
    const c=CATS[p.cat];
    card.innerHTML=`<div class="card" role="dialog" aria-label="Project preview">
      <button class="x" type="button" aria-label="Close preview"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="ph" style="background-image:url('${img(p)}')"><span class="tag" style="background:${c.ink}">${esc(c.label)}</span></div>
      <div class="bd">
        <div class="who"><span class="av" style="background:${c.ink}">${esc(initials(p.author))}</span>
          <div class="who-t"><span class="name">${esc(p.author)} ${p.verified?CHECK:""}</span>
          <span class="aff"><b>${esc(affCode(p.aff))}</b>${esc(p.aff)}</span></div></div>
        <h3>${esc(p.title)}</h3>
        <div class="meta">${esc(p.loc)} · ${p.year}</div>
        ${p.verified?"":'<div class="pending">Curation pending. Details not yet checked.</div>'}
        <div class="card-acts"><button class="open" type="button">Open project</button>${saveBtn(p,"save")}</div>
      </div></div>`;
    card.querySelector(".open").onclick=()=>openStory(p);
  } else {
    const col=d.journalist?"#F68B1F":"#111";
    card.innerHTML=`<div class="card" role="dialog" aria-label="Researcher preview">
      <button class="x" type="button" aria-label="Close preview" style="background:rgba(0,0,0,.12);color:#333"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="bd" style="padding-top:16px">
        <div class="who"><span class="av" style="background:${col};width:48px;height:48px;font-size:16px">${esc(initials(p.author))}</span>
          <div class="who-t"><span class="name" style="font-size:15px">${esc(p.author)} ${CHECK}</span>
          <span class="aff"><b>${esc(affCode(p.aff))}</b>${esc(p.aff)}</span></div></div>
        <div class="meta"><strong style="color:${col}">${d.journalist?"Journalist":"Academic"}</strong> · ${esc(p.prof)}</div>
        <div class="meta">Works in ${esc(p.loc)}. Location shown at region level.</div>
        <button class="open" type="button">See their project</button>
      </div></div>`;
    card.querySelector(".open").onclick=()=>openStory(p);
  }
  card.querySelector(".x").onclick=closeCard;
  card.hidden=false; card._d=d; stage.classList.add("has-card"); placePins();
}
function closeCard(){ card.hidden=true; card._d=null; state.selected=null; stage.classList.remove("has-card"); placePins(); }
function positionCard(){
  const d=card._d; if (!d || card.hidden) return;
  const el=card.firstElementChild;
  if (!isVisible([d.lng,d.lat])) { el.style.visibility="hidden"; return; }
  el.style.visibility="";
  const [x,y]=projection([d.lng,d.lat]);
  el.style.left=Math.max(156,Math.min(W-156-(W>760 ? 216 : 0),x))+"px";
  el.style.top=Math.max(el.offsetHeight+54,y)+"px";
}
function flyTo([lng,lat]){
  const from=state.rot.slice(), to=[-lng, state.proj==="globe" ? -lat+12 : 0];
  if (to[0]-from[0]>180) to[0]-=360; if (from[0]-to[0]>180) to[0]+=360;
  const kFrom=state.k, kTo=Math.max(state.k, state.proj==="globe"?1.35:1.6);
  const i=d3.interpolate(from,to), dur=matchMedia("(prefers-reduced-motion: reduce)").matches?0:900;
  d3.transition().duration(dur).ease(d3.easeCubicInOut).tween("fly",()=>tt=>{
    state.rot=i(tt); state.k=kFrom+(kTo-kFrom)*tt; lastMove=performance.now(); syncZoom(); draw(); });
}

