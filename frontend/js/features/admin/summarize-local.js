// Summary fallback in the browser, for the live site where there is no backend:
// read the PDF's text with pdf.js, then pick the sentences closest to the whole document
// (TF-IDF vectors, cosine similarity). Same method, stopwords and sentence rules as the backend's
// backend/api/app/ai/summarization/extractive.py and app/text/normalize.py, so both give the same summary.

const LOCAL_STOPWORDS = new Set(`a about above after again against all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her
here hers him his how i if in into is it its just may me might more most must my no nor not of off on once only or
other our out over own same she should so some such than that the their them then there these they this those through
to too under until up upon us very was we were what when where which while who whom why will with would you your
one two many much new however within without across among per via`.split(/\s+/));
const LOCAL_WORD = /\p{L}+(?:['’-]\p{L}+)*/gu;
const LOCAL_SENTENCE_END = /(?<=[.!?…])["”’)\]]*\s+(?=["“‘(\[¿¡]*[A-ZÁÉÍÓÚÑÜ\d])/;

const LOCAL_LINE_END = /[.!?…:;,]["”’)\]]*$/, LOCAL_SENTENCE_DONE = /[.!?…]["”’)\]]*$/;
// A short line without closing punctuation is a heading (a PDF's title lines): give it its own block.
function localSeparateHeadings(text){
  const out=[];
  for (const line of String(text || "").split("\n")){
    out.push(line);
    const bare=line.trim();
    if (bare && !LOCAL_LINE_END.test(bare) && bare.split(/\s+/).length<=12) out.push("");
  }
  return out.join("\n");
}

function localSentences(text){
  const out=[];
  for (const block of String(text || "").split(/\n\s*\n/)){
    const flat=block.split(/\s+/).filter(Boolean).join(" ");
    for (const s of flat.split(LOCAL_SENTENCE_END)) if (s.trim()) out.push(s.trim());
  }
  return out;
}

function localSummarize(text, maxSentences=3){
  const sentences=localSentences(localSeparateHeadings(text));
  if (maxSentences<1 || !sentences.length) return "";
  if (sentences.length<=maxSentences) return sentences.join(" ");
  const tokens=sentences.map(s=>(s.match(LOCAL_WORD) || []).map(w=>w.toLowerCase()).filter(w=>w.length>2 && !LOCAL_STOPWORDS.has(w)));
  const df=new Map();
  for (const words of tokens) for (const w of new Set(words)) df.set(w,(df.get(w) || 0)+1);
  if (!df.size) return sentences.slice(0,maxSentences).join(" ");
  const n=sentences.length, idf=new Map([...df].map(([w,c])=>[w, Math.log((n+1)/(c+1))+1]));
  const vector=words=>{
    const tf=new Map(); for (const w of words) tf.set(w,(tf.get(w) || 0)+1);
    const v=new Map([...tf].map(([w,c])=>[w,(1+Math.log(c))*idf.get(w)]));
    const norm=Math.sqrt([...v.values()].reduce((s,x)=>s+x*x,0)) || 1;
    for (const [w,x] of v) v.set(w,x/norm);
    return v;
  };
  const cosine=(a,b)=>{ let s=0; for (const [w,x] of a) s+=x*(b.get(w) || 0); return s; };
  const doc=vector(tokens.flat());
  let complete=sentences.map(s=>LOCAL_SENTENCE_DONE.test(s));
  if (!complete.some(Boolean)) complete=complete.map(()=>true);   // notes without full stops: every line may be chosen
  const sim=tokens.map((words,i)=>complete[i] && words.length>=3 ? cosine(vector(words),doc) : 0);
  const best=[], seen=new Set();
  for (const i of sentences.map((_,i)=>i).sort((i,j)=>sim[j]-sim[i] || i-j)){
    const key=sentences[i].toLowerCase().split(/\s+/).filter(Boolean).join(" ");
    if (seen.has(key)) continue;   // a sentence repeated word for word (e.g. in two photo captions) is used once
    seen.add(key); best.push(i);
    if (best.length===maxSentences) break;
  }
  best.sort((i,j)=>i-j);
  return best.map(i=>sentences[i]).join(" ");
}

// pdf.js (Mozilla, open source) is loaded only when an administrator asks for a draft.
const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
let pdfjsReady=null;
function loadPdfjs(){
  if (!pdfjsReady) pdfjsReady=new Promise((ok,fail)=>{
    const s=document.createElement("script"); s.src=PDFJS+"pdf.min.js";
    s.onload=()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+"pdf.worker.min.js"; ok(window.pdfjsLib); };
    s.onerror=()=>{ pdfjsReady=null; fail(new Error("pdf.js could not be loaded")); };
    document.head.appendChild(s);
  });
  return pdfjsReady;
}
// Text of every page, pages separated by a blank line (like the backend's pypdf extraction).
async function localPdfText(file){
  const pdfjs=await loadPdfjs();
  const pdf=await pdfjs.getDocument({ data:await file.arrayBuffer() }).promise;
  const pages=[];
  for (let i=1;i<=pdf.numPages;i++){
    const content=await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map(it=>it.str+(it.hasEOL ? "\n" : " ")).join("").trim());
  }
  return { text:pages.filter(Boolean).join("\n\n"), pages:pdf.numPages };
}
