// Project and researcher pins.
// ---------- pins ----------
let items=[];
// Each project pin shows its lead photograph inside a ring of its category colour, on a short stem.
// The letter badge keeps the category readable without relying on colour. Researchers keep an initials disc.
const PIN_R=15, PIN_Y=-27;
const pinColor = d => d.kind==="project" ? CATS[d.p.cat].color : (d.journalist ? "#F68B1F" : "#1f1d1b");
const pinTitle = d => { const s=d.kind==="project" ? d.p.title : d.p.author; return s.length>34 ? s.slice(0,33).trimEnd()+"…" : s; };
function renderPins(){
  if (svg.select("defs#pindefs").empty()){
    const defs=svg.insert("defs",":first-child").attr("id","pindefs");
    defs.append("clipPath").attr("id","pinclip").attr("clipPathUnits","objectBoundingBox")
      .append("circle").attr("cx",.5).attr("cy",.5).attr("r",.5);
    const f=defs.append("filter").attr("id","pinshadow").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    f.append("feDropShadow").attr("dx",0).attr("dy",2).attr("stdDeviation",2.2).attr("flood-color","#000").attr("flood-opacity",.45);
  }
  const sel=svg.selectAll("g.pin").data(items, d=>d.id);
  sel.exit().remove();
  const g=sel.enter().append("g").attr("class","pin").attr("tabindex",0).attr("role","button")
    .attr("aria-label",d=>d.kind==="project" ? `${d.p.title}, ${d.p.loc}` : `${d.p.author}, ${d.journalist?"journalist":"academic"}`)
    .on("click",(e,d)=>{ e.stopPropagation(); select(d); })
    .on("keydown",(e,d)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); select(d);} });
  const b=g.append("g").attr("class","body");
  b.append("circle").attr("cy",PIN_Y).attr("r",26).attr("fill","transparent");          // larger hit area
  b.append("ellipse").attr("rx",5).attr("ry",1.8).attr("fill","rgba(0,0,0,.4)");        // contact shadow
  b.append("circle").attr("class","halo").attr("cy",PIN_Y).attr("r",PIN_R+3).attr("fill","none")
    .attr("stroke",pinColor).attr("stroke-width",2.5);
  const m=b.append("g").attr("filter","url(#pinshadow)");
  m.append("path").attr("d",`M-5,${PIN_Y+PIN_R-2} L0,-1 L5,${PIN_Y+PIN_R-2}Z`).attr("fill",pinColor);   // stem
  m.append("circle").attr("class","frame").attr("cy",PIN_Y).attr("r",PIN_R+2.5).attr("fill",pinColor).attr("stroke","none");
  m.append("circle").attr("cy",PIN_Y).attr("r",PIN_R+.5).attr("fill","#fff");
  m.each(function(d){
    const el=d3.select(this), src=d.kind==="project" ? img(d.p) : "";
    if (src){
      el.append("circle").attr("class","photo-ph").attr("cy",PIN_Y).attr("r",PIN_R-1).attr("fill",pinColor(d)).attr("opacity",.35);
      el.append("image").attr("href",src).attr("x",-(PIN_R-1)).attr("y",PIN_Y-(PIN_R-1)).attr("width",2*(PIN_R-1)).attr("height",2*(PIN_R-1))
        .attr("preserveAspectRatio","xMidYMid slice").attr("clip-path","url(#pinclip)");
    } else {
      el.append("circle").attr("cy",PIN_Y).attr("r",PIN_R-1).attr("fill",pinColor(d));
      el.append("text").attr("y",PIN_Y+3.5).attr("text-anchor","middle").attr("fill","#fff").style("font-size","10px").text(initials(d.p.author));
    }
    if (d.kind==="project"){   // category letter badge, top right
      el.append("circle").attr("cx",PIN_R-2).attr("cy",PIN_Y-PIN_R+2).attr("r",7).attr("fill",pinColor(d)).attr("stroke","#fff").attr("stroke-width",1.6);
      el.append("text").attr("x",PIN_R-2).attr("y",PIN_Y-PIN_R+5).attr("text-anchor","middle").attr("fill","#fff").text(CATS[d.p.cat].g);
    }
  });
  // title on hover
  const tip=b.append("g").attr("class","tip").attr("transform",`translate(0,${PIN_Y-PIN_R-14})`);
  tip.append("rect").attr("rx",4).attr("height",19).attr("y",-13.5);
  tip.append("text").attr("text-anchor","middle").text(pinTitle);
  tip.each(function(){ const L=this.querySelector("text").getComputedTextLength(), w=(L || this.textContent.length*5.9)+16; d3.select(this).select("rect").attr("x",-w/2).attr("width",w); });
  placePins();
}
function placePins(){
  svg.selectAll("g.pin").each(function(d){
    const vis=isVisible([d.lng,d.lat]); const p=projection([d.lng,d.lat]);
    this.style.display = vis ? "" : "none";
    if (vis) this.setAttribute("transform",`translate(${p[0]},${p[1]})`);
    this.classList.toggle("active", state.selected===d.id);
  });
  if (typeof placeDraft==="function") placeDraft();
  positionCard();
}

