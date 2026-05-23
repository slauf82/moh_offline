const MODULES={main:{title:"Hauptteil",file:"Score.ui"},diagnostik:{title:"Diagnostik",file:"ScoreDiagnostik.ui"},parkinson:{title:"Parkinson",file:"ScoreParkinson.ui"},postop:{title:"PostOP",file:"ScorePostOP.ui"}};
let currentModule="main",currentId=null,dirty=false,highlightEmpty=false,recalcTimer=null,fields=[];
const $=id=>document.getElementById(id);
document.addEventListener("DOMContentLoaded",()=>{setup();document.querySelector(".content")?.classList.add("meta-hidden");loadModule("main");refreshEntries();});
function setup(){const ml=$("moduleList");Object.entries(MODULES).forEach(([k,m])=>{const b=document.createElement("button");b.className="module-btn";b.dataset.module=k;b.innerHTML=`<b>${m.title}</b><span>${m.file}</span>`;b.onclick=()=>loadModule(k);ml.appendChild(b);});
$("newBtn").onclick=()=>{currentId=null;dirty=false;loadModule(currentModule)};$("saveBtn").onclick=save;$("duplicateBtn").onclick=duplicate;$("deleteBtn").onclick=del;$("entrySelect").onchange=e=>e.target.value&&loadEntry(e.target.value);$("exportBtn").onclick=exportJson;$("importInput").onchange=importJson;if($("chapterSelect")) $("chapterSelect").onchange=chapterSelectChanged;$("searchInput").oninput=search;$("emptyBtn").onclick=()=>{highlightEmpty=!highlightEmpty;markEmpty();};const t=document.createElement("button");t.id="toggleMetaBtn";t.className="toggle-meta-btn";t.textContent="Info einblenden";document.querySelector(".actions").appendChild(t);t.onclick=toggleMeta;}
function loadModule(k){currentModule=k;document.body.classList.toggle("separate-module", k==="diagnostik"||k==="parkinson"||k==="postop");const m=MODULES[k];$("moduleTitle").textContent=m.title;$("moduleSub").textContent=`${m.file} · Full-HD Layout · Live-Berechnung`;$("moduleLabel").textContent=k;document.querySelectorAll(".module-btn").forEach(b=>b.classList.toggle("active",b.dataset.module===k));const src=window.MOH_UI_SOURCES?.[k];if(!src){showStatus(`UI-Quelle fehlt nicht im Dateisystem, sondern in der Einbettung: ${m.file}. Paket bitte neu erstellen.`, "err");$("renderRoot").innerHTML="";return;}showStatus(`Geladen: ${m.file}`, "ok");try{const doc=new DOMParser().parseFromString(src,"text/xml");const root=doc.querySelector("ui > widget")||doc.querySelector("widget");$("renderRoot").innerHTML=`<div class="qt-root">${renderWidget(root)}</div>`;promoteSubTabsIfNeeded();autoOpenRealEntryTab();setTimeout(autoOpenRealEntryTab,120);refreshChapterSelect();bind();cleanupV47Info();cleanupV50SummaryFieldsSafe();cleanupV48SummaryRows();cleanupV50SummaryFieldsSafe();wireLegacyActionButtons();cleanupV47Info();cleanupV50SummaryFieldsSafe();cleanupV48SummaryRows();cleanupV50SummaryFieldsSafe();updatePage1DisabledFieldsSoon();updatePage1DiagnosisTherapySoon();updateTodayDateFieldsSoon();setupLoop();applyAutoRulesSoon();applyChapterHandoffsSoon();recalc();updateProcessFidelity();updateMeta();}catch(e){showStatus("Renderfehler: "+e.message,"err");}}
function showStatus(msg,type="ok"){const box=$("statusBox");box.className=`status show ${type}`;box.textContent=msg;setTimeout(()=>box.classList.remove("show"), type==="ok"?2200:8000);}
function renderWidget(n){if(!n)return"";const c=n.getAttribute("class")||"",name=n.getAttribute("name")||"",text=prop(n,"text"),title=prop(n,"title"),dis=propBool(n,"enabled",true)?"":" disabled",style=sizeStyle(n);
if(c==="QLabel")return`<label class="qt-label">${esc(text)}</label>`;
if(c==="QLineEdit")return`<input class="qt-field" id="${escA(name)}" data-name="${escA(name)}"${dis} value="${escA(prop(n,"text"))}" style="${style}">`;
if(c==="QTextEdit"||c==="QPlainTextEdit")return`<textarea class="qt-textarea" id="${escA(name)}" data-name="${escA(name)}"${dis} style="${style}">${esc(prop(n,"plainText")||prop(n,"html"))}</textarea>`;
if(c==="QComboBox")return`<select class="qt-select" id="${escA(name)}" data-name="${escA(name)}"${dis} style="${style}">${combo(n)}</select>`;
if(c==="QCheckBox")return`<label class="qt-checkbox"><input type="checkbox" id="${escA(name)}" data-name="${escA(name)}"${dis}${propBool(n,"checked",false)?" checked":""}>${esc(text)}</label>`;
if(c==="QRadioButton")return`<label class="qt-checkbox"><input type="radio" id="${escA(name)}" data-name="${escA(name)}"${dis}${propBool(n,"checked",false)?" checked":""}>${esc(text)}</label>`;
if(c==="QDateEdit")return`<input class="qt-date" type="date" id="${escA(name)}" data-name="${escA(name)}"${dis} value="${dateVal(n)}" style="${style}">`;
if(c==="QSpinBox"||c==="QDoubleSpinBox")return`<input type="number" class="qt-field" id="${escA(name)}" data-name="${escA(name)}"${dis} value="${escA(prop(n,"value"))}" style="${style}">`;
if(c==="QProgressBar")return`<progress class="qt-progress" id="${escA(name)}" data-name="${escA(name)}" value="${prop(n,"value")||0}" max="${prop(n,"maximum")||100}"></progress>`;
if(c==="QPushButton"){const calc=/calculate|score|berechnen/i.test(name+" "+text);return`<button class="qt-button ${calc?"calc-hidden":""}" id="${escA(name)}" data-name="${escA(name)}"${dis}>${esc(text||name)}</button>`;}
if(c==="QGroupBox")return`<section class="qt-group" id="${escA(name)}" style="${style}">${title?`<div class="qt-group-title">${esc(title)}</div>`:""}${children(n)}</section>`;
if(c==="QScrollArea")return`<div class="qt-scroll" id="${escA(name)}">${children(n)}</div>`;
if(c==="QTabWidget"||c==="QToolBox")return paged(n,name);
return`<div class="qt-widget" id="${escA(name)}" style="${style}">${children(n)}</div>`;}
function children(n){const layout=[...n.children].find(x=>x.tagName==="layout");if(layout)return renderLayout(layout);return[...n.children].filter(x=>x.tagName==="widget").map(renderWidget).join("");}
function renderLayout(l){const c=l.getAttribute("class")||"",type=c==="QHBoxLayout"?"hbox":c==="QGridLayout"?"grid":"vbox",sp=prop(l,"spacing")||10,items=[...l.children].filter(x=>x.tagName==="item");let h=`<div class="qt-layout ${type}" style="gap:${sp}px">`;items.forEach(it=>{const ch=[...it.children].find(x=>["widget","layout","spacer"].includes(x.tagName));if(!ch)return;let st="";if(c==="QGridLayout"){let r=+(it.getAttribute("row")||0)+1,co=+(it.getAttribute("column")||0)+1,rs=+(it.getAttribute("rowspan")||1),cs=+(it.getAttribute("colspan")||it.getAttribute("columnspan")||1);st=`grid-row:${r}/span ${rs};grid-column:${co}/span ${cs};`;}else st=`flex:${+(it.getAttribute("stretch")||0)} 1 auto;`;h+=`<div class="qt-item" style="${st}">${renderAny(ch)}</div>`;});return h+"</div>";}
function renderAny(ch){if(ch.tagName==="widget")return renderWidget(ch);if(ch.tagName==="layout")return renderLayout(ch);return`<div style="flex:1 1 auto"></div>`;}
function paged(n,name){const pages=[...n.children].filter(x=>x.tagName==="widget"),id=name||"tabs"+Math.random().toString(36).slice(2);let nav="",cont="";pages.forEach((p,i)=>{const lab=attrText(p,"title")||attrText(p,"label")||p.getAttribute("name")||`Seite ${i+1}`;nav+=`<button type="button" class="qt-tab-button ${i?"":"active"}" data-root="${escA(id)}" data-idx="${i}">${esc(lab)}</button>`;cont+=`<div class="qt-tab-pane ${i?"search-hidden":""}" data-pane="${escA(id)}" data-idx="${i}">${renderWidget(p)}</div>`;});queueMicrotask(()=>tabEvents(id));return`<div class="qt-page-shell" id="${escA(id)}"><div class="qt-tabbar">${nav}</div><div class="qt-tab-content">${cont}</div></div>`;}
function tabEvents(id){document.querySelectorAll(`[data-root="${CSS.escape(id)}"]`).forEach(b=>{if(b.dataset.bound)return;b.dataset.bound=1;b.onclick=()=>{document.querySelectorAll(`[data-root="${CSS.escape(id)}"]`).forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(`[data-pane="${CSS.escape(id)}"]`).forEach(p=>p.classList.toggle("search-hidden",p.dataset.idx!==b.dataset.idx));refreshChapterSelectValue();updateSubScoresSoon();updateReturnButtonsVisibility();updateProcessFidelity();recalcSoon();};});updateSubScoresSoon();updateReturnButtonsVisibility();}
function bind(){fields=[...document.querySelectorAll("#renderRoot input[data-name],#renderRoot select[data-name],#renderRoot textarea[data-name]")];fields.forEach(e=>{e.oninput=e.onchange=()=>{dirty=true;updateMeta();markEmpty();applyAutoRulesSoon();applyChapterHandoffsSoon();refreshChapterSelectValue();updateSubScoresSoon();updateReturnButtonsVisibility();updateProcessFidelity();recalcSoon();};});}
function setupLoop(){clearInterval(window.__mohLoop);window.__mohLoop=setInterval(()=>{recalc();updateProcessFidelity?.();},1500);}
function recalcSoon(){clearTimeout(recalcTimer);recalcTimer=setTimeout(recalc,80);}
function recalc(){
  /*
    Kapitelbasierte/idempotente Berechnung:
    Es wird nur der aktuell sichtbare Kapitel-/Tabbereich berechnet.
    Damit hat FDN A1 seinen eigenen Score, FDN A2 einen anderen usw.
  */
  let total=0,filled=0,considered=0;
  let processDone=0, processTotal=0;
  const seen=new Set();
  const scope = activeScoreScope();

  fields.forEach(e=>{
    if(!e || !e.id || seen.has(e.id)) return;
    if(scope && !scope.contains(e)) return;

    // Unsichtbare inaktive Tab-Panes ignorieren.
    if(e.closest(".qt-tab-pane.search-hidden")) return;

    seen.add(e.id);
    considered++;

    const id=(e.id||"").toLowerCase();
    if(isScoreOutputField(id)) return;

    let v=val(e);
    if(v!=="" && v!==false) filled++;

    if(!isAdministrativeField(e)){
      processTotal++;
      if(isProcessFieldCompleted(e)) processDone++;
    }

    total += score(e);
  });

  $("liveScore").textContent=total;
  const chapter = activeChapterLabel();
  $("scoreInfo").textContent=`${chapter}: ${filled}/${considered} Felder gefüllt · aktiver Kapitel-Score`;

  fields.forEach(e=>{
    if(scope && !scope.contains(e)) return;
    const id=(e.id||"").toLowerCase();
    if(isScoreOutputField(id) && document.activeElement!==e) {
      e.value=total;
    }
  });

  
  updateProcessFidelity();
  updateMeta();
}

function isScoreOutputField(id){
  return id==="lescore" || id.endsWith("score") || id.includes("gesamtscore") || id.includes("teilscore");
}

function activeScoreScope(){
  /*
    Nimmt den tiefsten sichtbaren Tab-Pane als Score-Scope.
    Bei verschachtelten Tabs ist damit wirklich das aktive Unterkapitel gemeint.
  */
  const visiblePanes=[...document.querySelectorAll("#renderRoot .qt-tab-pane")]
    .filter(p=>!p.classList.contains("search-hidden") && p.offsetParent!==null);

  if(!visiblePanes.length) return $("renderRoot");

  visiblePanes.sort((a,b)=>depth(b)-depth(a));
  return visiblePanes[0];
}

function depth(el){
  let d=0;
  while(el && el!==document.body){d++;el=el.parentElement;}
  return d;
}

function activeChapterLabel(){
  const activeButtons=[...document.querySelectorAll("#renderRoot .qt-tab-button.active")]
    .filter(b=>b.offsetParent!==null)
    .map(b=>b.textContent.trim())
    .filter(Boolean);
  return activeButtons.length ? activeButtons.join(" / ") : "Aktuelles Kapitel";
}

function val(e){return e.type==="checkbox"||e.type==="radio"?e.checked:e.value;}
function score(e){if(e.type==="checkbox"||e.type==="radio")return e.checked?1:0;if(e.tagName==="SELECT")return Math.max(0,e.selectedIndex);const s=String(e.value||"").trim().replace(",",".");if(!s)return 0;const n=Number(s);return Number.isNaN(n)?1:n;}
function collect(){const data={};fields.forEach(e=>data[e.id]=val(e));return{id:currentId||String(Date.now()),module:currentModule,updatedAt:new Date().toISOString(),data};}
function apply(entry){if(entry.module&&entry.module!==currentModule)loadModule(entry.module);setTimeout(()=>{Object.entries(entry.data||{}).forEach(([id,v])=>{const e=document.getElementById(id);if(!e)return;if(e.type==="checkbox"||e.type==="radio")e.checked=!!v;else e.value=v;});currentId=entry.id;dirty=false;recalc();updateProcessFidelity();updateMeta();},50);}
function save(){const e=collect();currentId=e.id;localStorage.setItem("moh_entry_"+e.id,JSON.stringify(e));dirty=false;refreshEntries();updateMeta();showStatus("Gespeichert","ok");}
function duplicate(){const e=collect();e.id=String(Date.now());currentId=e.id;localStorage.setItem("moh_entry_"+e.id,JSON.stringify(e));dirty=false;refreshEntries();updateMeta();}
function del(){if(!currentId)return;localStorage.removeItem("moh_entry_"+currentId);currentId=null;refreshEntries();loadModule(currentModule);}
function entries(){return Object.keys(localStorage).filter(k=>k.startsWith("moh_entry_")).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}}).filter(Boolean).sort((a,b)=>String(b.updatedAt||b.id).localeCompare(String(a.updatedAt||a.id)));}
function refreshEntries(){const es=entries();$("entrySelect").innerHTML='<option value="">Eintrag laden...</option>'+es.map(e=>`<option value="${escA(e.id)}">${esc(e.module)} · ${esc(e.id)}</option>`).join("");if(currentId)$("entrySelect").value=currentId;}
function loadEntry(id){const raw=localStorage.getItem("moh_entry_"+id);if(raw)apply(JSON.parse(raw));}
function exportJson(){const blob=new Blob([JSON.stringify(collect(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`moh-${currentModule}-${currentId||"neu"}.json`;a.click();URL.revokeObjectURL(a.href);}
function importJson(ev){const f=ev.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{apply(JSON.parse(r.result));setTimeout(save,80)}catch(e){showStatus("Importfehler: "+e.message,"err")}};r.readAsText(f);}
function search(){const q=$("searchInput").value.toLowerCase().trim();document.querySelectorAll("#renderRoot .qt-group,#renderRoot .qt-widget,#renderRoot .qt-item").forEach(e=>{if(!q){e.classList.remove("search-hidden");return;}e.classList.toggle("search-hidden",!e.textContent.toLowerCase().includes(q)&&![...e.querySelectorAll("[data-name]")].some(x=>x.id.toLowerCase().includes(q)));});}
function markEmpty(){fields.forEach(e=>{const empty=e.tagName==="SELECT"?e.selectedIndex<=0:String(e.value||"").trim()==="";e.classList.toggle("empty-field",highlightEmpty&&empty);});}
function updateMeta(){$("idLabel").textContent=currentId||"neu";$("moduleLabel").textContent=currentModule;$("fieldCount").textContent=fields.length;$("dirtyLabel").textContent=dirty?"geändert":"unverändert";}
function propNode(n,name){return[...n.children].find(x=>x.tagName==="property"&&x.getAttribute("name")===name)}
function prop(n,name){const p=propNode(n,name);if(!p)return"";const x=p.querySelector("string,number,bool");return x?x.textContent:""}
function propBool(n,name,def=false){const v=prop(n,name);return v===""?def:v==="true"}
function attrText(n,name){const a=[...n.children].find(x=>x.tagName==="attribute"&&x.getAttribute("name")===name);return a?.querySelector("string")?.textContent||""}
function combo(n){const cur=prop(n,"currentText");let h=[...n.children].filter(x=>x.tagName==="item").map(it=>{const t=it.querySelector("property[name='text'] string")?.textContent||"";return`<option${cur&&cur===t?" selected":""}>${esc(t)}</option>`}).join("");return h||"<option></option>"}
function dateVal(n){const d=propNode(n,"date");if(!d)return new Date().toISOString().slice(0,10);return`${d.querySelector("year")?.textContent||2018}-${String(d.querySelector("month")?.textContent||1).padStart(2,"0")}-${String(d.querySelector("day")?.textContent||1).padStart(2,"0")}`}
function sizeStyle(n){const a=[];for(const [p,css] of [["minimumSize","min"],["maximumSize","max"]]){const node=propNode(n,p);if(!node)continue;const w=+(node.querySelector("width")?.textContent||0),h=+(node.querySelector("height")?.textContent||0);if(w&&w<100000)a.push(`${css}-width:${w}px`);if(h&&h<100000)a.push(`${css}-height:${h}px`);}return a.join(";")}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escA(s){return esc(s).replace(/`/g,"&#096;")}



function toggleMeta(){
  const card=document.querySelector(".meta-card");
  const content=document.querySelector(".content");
  const btn=document.getElementById("toggleMetaBtn");

  const hidden = card.style.display === "none" || getComputedStyle(card).display === "none";

  if(hidden){
    card.style.display = "";
    content.classList.remove("meta-hidden");
    btn.textContent = "Info ausblenden";
  } else {
    card.style.display = "none";
    content.classList.add("meta-hidden");
    btn.textContent = "Info einblenden";
  }
}



function promoteSubTabsIfNeeded(){
  if(!(currentModule==="diagnostik"||currentModule==="parkinson"||currentModule==="postop")) return;

  /*
    Ziel:
    - Die äußere QToolBox-Ebene "Seite 2 / Seite 1" bleibt erhalten.
    - Innerhalb von Seite 2 wird die alte große MOH-Kapitelleiste (FDN/CRS, TIN, CI, ...)
      nicht mehr als Zwischenschritt benötigt.
    - Stattdessen wird automatisch das passende Schein-Kapitel geöffnet und dessen echte
      Unterkapitel werden direkt als Hauptkapitel innerhalb von Seite 2 angezeigt.
  */
  const root = document.querySelector("#renderRoot .qt-root");
  if(!root) return;

  const outerToolbox = root.querySelector(":scope > .qt-page-shell");
  if(!outerToolbox) return;

  // page panes der äußeren ToolBox: Seite 2 / Seite 1
  const outerPanes = [...outerToolbox.querySelectorAll(":scope > .qt-tab-content > .qt-tab-pane")];
  if(!outerPanes.length) return;

  // Seite 2 bevorzugen, sonst erste Pane.
  let page2Pane = outerPanes.find(p => {
    const btn = matchingButtonForPane(outerToolbox, p);
    return btn && /seite\s*2/i.test(btn.textContent || "");
  }) || outerPanes[0];

  // Darin liegt meistens die alte große Haupt-Kapitelleiste.
  const pseudoShell = page2Pane.querySelector(":scope > .qt-widget > .qt-page-shell, :scope > .qt-page-shell, .qt-page-shell");
  if(!pseudoShell) return;

  const targetPatterns = {
    diagnostik: [/^diagnostik$/i, /diagnostik/i],
    parkinson: [/mb\.\s*parkinson/i, /^pks$/i, /parkinson/i],
    postop: [/post\s*op/i, /^postop$/i]
  }[currentModule] || [];

  const pseudoButtons = [...pseudoShell.querySelectorAll(":scope > .qt-tabbar > .qt-tab-button")];
  const targetButton = pseudoButtons.find(btn => targetPatterns.some(rx => rx.test((btn.textContent||"").trim())));
  if(!targetButton) return;

  targetButton.click();
  const targetIndex = targetButton.dataset.idx;
  const targetPane = [...pseudoShell.querySelectorAll(":scope > .qt-tab-content > .qt-tab-pane")]
    .find(p => p.dataset.idx === targetIndex);
  if(!targetPane) return;

  // In diesem Ziel-Pane suchen wir die echte Unterkapitelstruktur.
  const innerShells = [...targetPane.querySelectorAll(".qt-page-shell")];
  const realShell = innerShells
    .map(s => ({shell:s, count:s.querySelectorAll(":scope > .qt-tabbar > .qt-tab-button").length, depth:depth(s)}))
    .filter(x => x.count >= 2)
    .sort((a,b) => (b.count - a.count) || (a.depth - b.depth))[0]?.shell;

  if(!realShell) {
    // Falls es keine Unterkapitel gibt, wenigstens nur das Ziel-Kapitel anzeigen,
    // aber Seite 1/2 bleibt trotzdem außen erhalten.
    pseudoShell.querySelector(":scope > .qt-tabbar")?.classList.add("pseudo-hidden");
    return;
  }

  // Pseudo-Shell im page2Pane durch reale Unterkapitel-Shell ersetzen.
  const holder = pseudoShell.parentElement;
  holder.replaceChild(realShell, pseudoShell);

  // Events erneut binden und ersten echten Untertab aktivieren.
  if(realShell.id) tabEvents(realShell.id);
  realShell.querySelectorAll(".qt-page-shell").forEach(shell => { if(shell.id) tabEvents(shell.id); });
  const firstRealButton = realShell.querySelector(":scope > .qt-tabbar > .qt-tab-button");
  if(firstRealButton) firstRealButton.click();

  document.body.classList.add("pseudo-tabs-removed");
}

function matchingButtonForPane(shell, pane){
  const idx = pane.dataset.idx;
  if(idx == null) return null;
  return shell.querySelector(`:scope > .qt-tabbar > .qt-tab-button[data-idx="${idx}"]`);
}





let autoRulesTimer=null;
function applyAutoRulesSoon(){
  clearTimeout(autoRulesTimer);
  autoRulesTimer=setTimeout(applyAutoRules,60);
}

function applyAutoRules(){
  /*
    Erweiterte Browser-Automatik.
    Sie bildet möglichst viele wiederkehrende STARC-Muster ab:
    1. Score je aktivem Kapitel aktualisieren.
    2. Abhängige Begründungs-/Zusatzfelder aktivieren/deaktivieren.
    3. Textfelder aus Comboboxen und Zahlenfeldern ableiten.
    4. Therapie-/Empfehlungs-/Auswertungstexte nach Kapiteltyp befüllen.
    5. Manuelle Texte nicht überschreiben.
  */
  const scope = activeScoreScope ? activeScoreScope() : document.getElementById("renderRoot");
  if(!scope) return;

  const all = [...scope.querySelectorAll("input[data-name], textarea[data-name], select[data-name]")];

  applyEnableDisableRules(scope, all);
  applyMirrorAndDerivedTextRules(scope, all);
  applyRecommendationRules(scope, all);
  applyProgressRules(scope, all);
}

function applyEnableDisableRules(scope, all){
  all.forEach(el=>{
    const id = el.id || "";
    if(!id) return;

    // Typisches STARC-Muster: Zusatzfeld ...2 / _2 / Grund / Kommentar wird aktiv,
    // wenn die zugehörige Auswahl nicht leer ist.
    const dependents = findDependentFields(id, scope);
    if(!dependents.length) return;

    const active = isMeaningful(el);
    dependents.forEach(dep=>{
      if(dep === el) return;
      dep.disabled = !active;
      if(!active && dep.dataset.autoTouched === "1") {
        dep.value = "";
        dep.dataset.autoTouched = "";
      }
    });
  });
}

function findDependentFields(id, scope){
  const results = [];
  const base = id
    .replace(/^cb/,"")
    .replace(/^le/,"")
    .replace(/^pte/,"")
    .replace(/^chkb/,"");

  const patterns = [
    "le"+base+"2", "le"+base+"_2", "pte"+base+"2", "pte"+base+"_2",
    "leGrund"+base, "leKommentar"+base, "leBegruendung"+base,
    id+"2", id+"_2"
  ];

  patterns.forEach(pid=>{
    const el = scope.querySelector("#"+cssEscape(pid));
    if(el) results.push(el);
  });

  // Nähe-Regel: unmittelbar folgende Textfelder in derselben Zeile/Gruppe
  const parent = id ? document.getElementById(id)?.closest(".qt-item,.qt-group,.qt-widget") : null;
  if(parent){
    parent.querySelectorAll("input[data-name],textarea[data-name]").forEach(x=>{
      const xid=(x.id||"").toLowerCase();
      if(x !== document.getElementById(id) && (
        xid.includes("grund") || xid.includes("kommentar") || xid.includes("bemerk") ||
        xid.includes("begruend") || xid.endsWith("2") || xid.endsWith("_2")
      )) results.push(x);
    });
  }

  return [...new Set(results)];
}

function applyMirrorAndDerivedTextRules(scope, all){
  all.forEach(el=>{
    if(el.tagName !== "SELECT") return;
    const id = el.id || "";
    const text = selectedText(el);
    if(!text) return;

    const base = id.replace(/^cb/,"");
    const possibleTargets = [
      "le"+base, "le"+base+"2", "le"+base+"_2",
      "pte"+base, "pte"+base+"2", "pte"+base+"_2"
    ];

    possibleTargets.forEach(tid=>{
      const target = scope.querySelector("#"+cssEscape(tid));
      if(!target || target === el) return;
      if(isScoreOutputField((target.id||"").toLowerCase())) return;
      if(!isTextual(target)) return;

      const shouldExplain = /nicht|ja|pathologisch|auffällig|positiv|erhöht|veranlasst|empfohlen|kontrolle|therapie/i.test(text);
      if(shouldExplain && shouldAutoWrite(target)) {
        target.value = text;
        target.dataset.autoFilled = "1";
        target.dataset.autoTouched = "1";
      }
    });
  });
}

function applyRecommendationRules(scope, all){
  const sourceFields = all.filter(e => !isAutoTargetField(e) && !isScoreOutputField((e.id||"").toLowerCase()));
  const targetFields = all.filter(isAutoTargetField);
  if(!targetFields.length) return;

  const chapter = activeChapterLabel ? activeChapterLabel() : "Kapitel";
  const scoreNow = sourceFields.reduce((sum,e)=>sum+score(e),0);
  const selected = sourceFields.map(fieldDescription).filter(Boolean);
  const text = buildRuleBasedRecommendation(chapter, scoreNow, selected, sourceFields);

  targetFields.forEach(t=>{
    if(shouldAutoWrite(t)){
      t.value = text;
      t.dataset.autoFilled = "1";
      t.dataset.autoTouched = "1";
    }
  });
}

function buildRuleBasedRecommendation(chapter, scoreNow, selected, sourceFields){
  const hay = (chapter + " " + selected.join(" ")).toLowerCase();
  const suggestions = [];

  function add(s){ if(s && !suggestions.includes(s)) suggestions.push(s); }

  // Kapitel-/Diagnose-spezifische Regelgruppen
  if(/tin|tinnitus/.test(hay)){
    add("Tinnitusberatung / Aufklärung über Verlauf, Trigger und Umgang mit Ohrgeräuschen.");
    if(/audiogramm|rta|hör|hoer|tymp|bera|dpoae|cng/.test(hay)) add("Audiologische Diagnostik prüfen bzw. vervollständigen.");
    if(/schwindel|dhi|vestib|nystagmus/.test(hay)) add("Bei begleitendem Schwindel vestibuläre Diagnostik und Differenzialdiagnostik erwägen.");
    if(/mri|mrt|cbct|felsenbein/.test(hay)) add("Bildgebung nur bei entsprechender Indikation / Red Flags berücksichtigen.");
  }

  if(/ci|implant|cic|cochlea/.test(hay)){
    add("CI-Abklärung / Implantatberatung bei erfüllten audiologischen Kriterien erwägen.");
    if(/bera|dpoae|cng|rta|spra|freiburger/.test(hay)) add("Audiologische Vorbefunde für CI-Konferenz vollständig dokumentieren.");
    if(/mri|mrt|cbct|felsenbein/.test(hay)) add("Bildgebung Felsenbein/Innenohr je nach Befundlage einplanen.");
  }

  if(/fdn|crs|snot|snif|rhi|prick|mucs|fess|polyp|nps|dupm/.test(hay)){
    if(/mometason|nasenspray|mucs|nps|snot|crs|fdn/.test(hay)) add("Konservative Basistherapie mit topischem Steroid / Nasenpflege prüfen.");
    if(/prick|allerg|immunocap|gräser|milbe|katze/.test(hay)) add("Allergologische Abklärung bzw. Therapieoptionen berücksichtigen.");
    if(/rhi|rhinomanometrie|snif/.test(hay)) add("Funktionelle Nasenatmungsdiagnostik in Bewertung einbeziehen.");
    if(/fess|cbct|ct|nnh/.test(hay)) add("Operative FESS-Indikation anhand Klinik, Endoskopie und Bildgebung prüfen.");
    if(/dupilumab|dupm|biolog/.test(hay)) add("Biologika-/Dupilumab-Kriterien anhand Verlauf und Vorbehandlung prüfen.");
  }

  if(/parkinson|pks|m\.|tremor|ergo|logo|physio|mobilität|mobilitaet/.test(hay)){
    add("Interdisziplinäre Verlaufskontrolle und funktionelle Therapieplanung prüfen.");
    if(/logo|sprache|stimme|schluck/.test(hay)) add("Logopädische Mitbeurteilung / Therapie erwägen.");
    if(/ergo|alltag|funktion|hand/.test(hay)) add("Ergotherapeutische Unterstützung bei alltagsrelevanten Einschränkungen erwägen.");
    if(/physio|gang|mobil|tonus/.test(hay)) add("Physiotherapeutische Therapieziele dokumentieren.");
  }

  if(/postop|pod|pom|pow|naht|doyle|drainage|verband|schmerz|blutung|schwellung/.test(hay)){
    add("Postoperative Kontrolle gemäß Eingriff und Verlauf dokumentieren.");
    if(/schmerz|pain/.test(hay)) add("Schmerztherapie und Verlaufskontrolle anpassen.");
    if(/blutung|bleeding|hämatom|haematom/.test(hay)) add("Blutungs-/Hämatomzeichen kontrollieren und Dringlichkeit bewerten.");
    if(/naht|doyle|drainage|verband/.test(hay)) add("Entfernung von Naht/Doyle/Drainage/Verband gemäß Protokoll prüfen.");
    if(/follow|kontrolle|wiedervorstellung/.test(hay)) add("Nächste Wiedervorstellung bzw. Verlaufskontrolle festlegen.");
  }

  if(/dys|schluck|dysphag|ees|pneumonie|aspiration|husten/.test(hay)){
    add("Dysphagie-Risiko strukturieren und Aspirationszeichen beachten.");
    if(/logo|physio|neuro/.test(hay)) add("Logopädische/neurologische Mitbeurteilung je nach Befund veranlassen.");
    if(/pneumonie|fieber|aspiration/.test(hay)) add("Bei Red Flags zeitnahe ärztliche Eskalation prüfen.");
  }

  if(/schwindel|ved|vac|dhi|nystagmus|kopfimpuls|skew|hints/.test(hay)){
    add("Schwindeldiagnostik anhand HINTS/vestibulärer Befunde einordnen.");
    if(/zentral|skew|vertikal|regellos/.test(hay)) add("Bei Hinweis auf zentrale Ursache sofortige ärztliche/neurologische Abklärung.");
    if(/lagerung|benign|bppv/.test(hay)) add("Lagerungsdiagnostik und Repositionsmanöver prüfen.");
  }

  // Generische Regeln aus Score-Höhe
  if(!suggestions.length){
    if(scoreNow <= 0) add("Keine relevante Auffälligkeit aus den aktuell gesetzten Feldern ableitbar.");
    else if(scoreNow < 5) add("Geringe Auffälligkeit / Verlaufskontrolle erwägen.");
    else if(scoreNow < 12) add("Mäßige Auffälligkeit / gezielte Diagnostik oder Therapie prüfen.");
    else add("Deutliche Auffälligkeit / zeitnahe ärztliche Bewertung empfohlen.");
  }

  const details = selected.length
    ? selected.slice(0,18).map(x=>"• "+x).join("\n")
    : "• Keine verwertbaren Auswahlfelder im aktiven Kapitel gesetzt.";

  return `${chapter} – automatische Auswertung\nScore: ${scoreNow}\n\nEmpfehlung:\n${suggestions.map(x=>"• "+x).join("\n")}\n\nAktive Kriterien:\n${details}`;
}

function applyProgressRules(scope, all){
  const filled = all.filter(e => !isScoreOutputField((e.id||"").toLowerCase()) && isMeaningful(e)).length;
  const total = all.filter(e => !isScoreOutputField((e.id||"").toLowerCase())).length || 1;
  const percent = Math.round(filled * 100 / total);

  scope.querySelectorAll("progress[data-name]").forEach(p=>{
    p.value = percent;
  });

  scope.querySelectorAll("input[data-name]").forEach(e=>{
    const id=(e.id||"").toLowerCase();
    if(id.includes("anzahlelemente") && shouldAutoWrite(e)) {
      e.value = String(total);
      e.dataset.autoFilled = "1";
    }
  });
}

function isMeaningful(e){
  if(!e || e.disabled) return false;
  if(e.type==="checkbox" || e.type==="radio") return !!e.checked;
  if(e.tagName==="SELECT") return e.selectedIndex > 0;
  return String(e.value || "").trim() !== "";
}

function selectedText(e){
  if(e.tagName !== "SELECT") return "";
  return e.options[e.selectedIndex]?.textContent?.trim() || "";
}

function isTextual(e){
  return e && (e.tagName==="TEXTAREA" || e.tagName==="INPUT");
}

function shouldAutoWrite(e){
  if(!e || e.disabled) return false;
  if(e.dataset.manualEdited === "1") return false;
  const empty = String(e.value || "").trim() === "";
  const oldAuto = e.dataset.autoFilled === "1";
  return empty || oldAuto;
}

function isAutoTargetField(e){
  const id=(e.id||"").toLowerCase();
  const label=nearestLabelText(e).toLowerCase();
  const hay=id+" "+label;

  if(e.tagName !== "TEXTAREA" && !(e.tagName==="INPUT" && (e.type==="text" || e.type==="" || !e.type))) return false;

  return (
    hay.includes("empfehl") ||
    hay.includes("recommend") ||
    hay.includes("therapie") ||
    hay.includes("therapy") ||
    hay.includes("auswertung") ||
    hay.includes("beurteilung") ||
    hay.includes("evaluation") ||
    hay.includes("befundtext") ||
    hay.includes("resulttext") ||
    hay.includes("diagnose") ||
    hay.includes("icd") ||
    hay.includes("mode")
  );
}

function fieldDescription(e){
  if(e.disabled) return "";
  const id=(e.id||"").trim();
  let value = "";
  if(e.type==="checkbox" || e.type==="radio") {
    if(!e.checked) return "";
    value = "ja";
  } else if(e.tagName==="SELECT") {
    if(e.selectedIndex <= 0) return "";
    value = e.options[e.selectedIndex]?.textContent?.trim() || "";
  } else {
    value = String(e.value || "").trim();
    if(!value) return "";
  }

  const label = nearestLabelText(e) || id;
  return `${label}: ${value}`;
}

function nearestLabelText(e){
  let p=e.parentElement;
  for(let i=0;i<5 && p;i++,p=p.parentElement){
    const labels=[...p.querySelectorAll("label.qt-label,label")].map(x=>x.textContent.trim()).filter(Boolean);
    if(labels.length) return labels[0].replace(/\s+/g," ");
  }
  return "";
}

function cssEscape(id){
  if(window.CSS && CSS.escape) return CSS.escape(id);
  return String(id).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

// Manuelle Texte schützen: sobald der Nutzer ein automatisch erzeugtes Textfeld bearbeitet,
// wird es nicht weiter überschrieben.
document.addEventListener("input", ev=>{
  const e=ev.target;
  if(!e || !e.matches || !e.matches("input[data-name], textarea[data-name]")) return;
  if(e.dataset.autoFilled==="1" && document.activeElement===e) {
    e.dataset.manualEdited="1";
    e.dataset.autoFilled="";
  }
}, true);


let chapterHandoffTimer=null;
function applyChapterHandoffsSoon(){
  clearTimeout(chapterHandoffTimer);
  chapterHandoffTimer=setTimeout(applyChapterHandoffs,90);
}

function applyChapterHandoffs(){
  /*
    Kapitelhinweise nur anzeigen, wenn wirklich ein passender Sprung existiert.
    Keine generischen Hinweise, kein leerer Platzhalterbereich.
  */
  const box = document.getElementById("chapterSuggestions");
  if(!box) return;

  const scope = activeScoreScope ? activeScoreScope() : document.getElementById("renderRoot");
  if(!scope) {
    hideChapterSuggestions();
    return;
  }

  const hay = collectActiveHaystack(scope);
  const active = activeChapterLabel ? activeChapterLabel() : "";
  const suggestions = computeChapterSuggestions(hay, active)
    .filter(s => s && s.label && chapterExists(s.label))
    .filter(s => isStrongChapterSuggestion(s, hay, active));

  if(!suggestions.length){
    hideChapterSuggestions();
    return;
  }

  box.innerHTML = `
    <div class="title">Passender Folgeabschnitt</div>
    <div class="suggestion-list">
      ${suggestions.map(s=>`<button type="button" data-jump-label="${escA(s.label)}">${esc(s.label)}</button>`).join("")}
    </div>
    <div class="hint">${esc(suggestions[0].reason || "")}</div>
  `;
  box.classList.add("show");

  box.querySelectorAll("button[data-jump-label]").forEach(btn=>{
    btn.onclick=()=>jumpToChapter(btn.dataset.jumpLabel);
  });
}

function hideChapterSuggestions(){
  const box = document.getElementById("chapterSuggestions");
  if(!box) return;
  box.classList.remove("show");
  box.innerHTML = "";
}

function isStrongChapterSuggestion(s, hay, active){
  const label = String(s.label || "").toLowerCase();
  const activeNorm = String(active || "").toLowerCase();

  // Keine Empfehlung auf sich selbst oder nahezu gleichen aktiven Abschnitt.
  if(activeNorm && activeNorm.includes(label)) return false;

  // Nur anzeigen, wenn im aktiven Kapitel tatsächlich verwertbare Eingaben gemacht wurden.
  const scope = activeScoreScope ? activeScoreScope() : document.getElementById("renderRoot");
  const meaningfulCount = scope
    ? [...scope.querySelectorAll("input[data-name], select[data-name], textarea[data-name]")]
        .filter(e => !e.disabled)
        .filter(e => !isScoreOutputField((e.id||"").toLowerCase()))
        .filter(isMeaningful).length
    : 0;

  if(meaningfulCount < 1) return false;

  // Label muss durch echte Trigger gestützt sein.
  const triggerMap = [
    { labels:["tin empfehlung","ci a1","ved a1"], rx:/tin|tinnitus|ohrgeräusch|ohrgeraeusch/ },
    { labels:["ci a1","ci a2"], rx:/ci|implant|hörminderung|hoerminderung|sprachaudi|freiburger|rta/ },
    { labels:["mucs","pfess","dupm","fdn a2"], rx:/fdn|crs|snot|snif|mucs|rhi|nasen|polyp|nps|sinus|fess|allerg|prick|dupilumab|dupm/ },
    { labels:["3pod","10pod","30pod","3pom"], rx:/postop|pod|pow|pom|naht|doyle|drainage|verband|blutung|schmerz/ },
    { labels:["tgl-phon","pks"], rx:/parkinson|pks|tremor|rigor|logo|sprache|stimme|ergo|physio|mobilität|mobilitaet/ },
    { labels:["ved a1","ved a2"], rx:/schwindel|nystagmus|kopfimpuls|hints|skew|dhi|vestib|zentral/ },
    { labels:["dys a1","dys a2"], rx:/dysphag|schluck|aspiration|pneumonie|ees|husten|räusper|raeusper/ }
  ];

  return triggerMap.some(group => group.labels.some(l => label.includes(l)) && group.rx.test(hay));
}

function collectActiveHaystack(scope){
  const parts = [];
  parts.push(activeChapterLabel ? activeChapterLabel() : "");
  scope.querySelectorAll("label, input[data-name], select[data-name], textarea[data-name]").forEach(el=>{
    if(el.tagName==="LABEL") parts.push(el.textContent || "");
    else if(el.tagName==="SELECT") {
      parts.push(el.id || "");
      parts.push(el.options[el.selectedIndex]?.textContent || "");
    } else {
      parts.push(el.id || "");
      parts.push(el.value || "");
      if(el.checked) parts.push("checked ja positiv");
    }
  });
  return parts.join(" ").toLowerCase();
}

function computeChapterSuggestions(hay, activeLabel){
  const active = (activeLabel || "").toLowerCase();
  const out = [];
  function add(label, reason){
    if(!label) return;
    if(active.includes(label.toLowerCase())) return;
    if(out.some(x=>x.label===label)) return;
    if(chapterExists(label)) out.push({label, reason});
  }

  // Tinnitus -> TIN Empfehlung / CI-Abklärung / Schwindel
  if(/tin|tinnitus|ohrgeräusch|ohrgeraeusch/.test(hay)){
    add("TIN Empfehlung", "Bei Tinnitusangaben ist die Empfehlungsauswertung als nächster Abschnitt sinnvoll.");
    if(/hörminderung|hoerminderung|rta|sprachaudi|freiburger|ci|implant/.test(hay)){
      add("CI A1", "Bei Tinnitus plus Hör-/Audiologie-Hinweisen kann die CI-Abklärung relevant sein.");
    }
    if(/schwindel|dhi|nystagmus|vestib/.test(hay)){
      add("VED A1", "Bei Tinnitus mit Schwindelangaben ist der Schwindel-/Vestibularabschnitt sinnvoll.");
    }
  }

  // FDN/CRS/Nase -> MUCS/FESS/DUPM/Allergie
  if(/fdn|crs|snot|snif|mucs|rhi|nasen|polyp|nps|sinus|fess/.test(hay)){
    add("MUCS", "Bei Nasen-/CRS-Befunden ist der Mucosa-Score oft der passende Folgeabschnitt.");
    if(/cbct|ct|nnh|fess|operation|op|polyp/.test(hay)){
      add("pFESS", "Bei Bildgebung/OP-/FESS-Hinweisen ist pFESS als Folgekapitel plausibel.");
    }
    if(/dupilumab|dupm|biolog|rezidiv|polyp/.test(hay)){
      add("DUPM", "Bei Polyposis-/Biologika-Hinweisen ist DUPM sinnvoll.");
    }
    if(/prick|allerg|gräser|graeser|milbe|katze|immunocap/.test(hay)){
      add("FDN A2", "Bei Allergiehinweisen ist der weiterführende FDN-/Allergieabschnitt sinnvoll.");
    }
  }

  // PostOP -> spezifische Unterkapitel/Folgezeitpunkte
  if(/postop|pod|pow|pom|naht|doyle|drainage|verband|blutung|schmerz/.test(hay)){
    if(/1pod|1 pod|tag 1|erster/.test(hay)) add("3POD", "Nach 1POD ist häufig die nächste postoperative Kontrolle 3POD.");
    if(/3pod|3 pod/.test(hay)) add("10POD", "Nach 3POD ist häufig 10POD als Folgekontrolle sinnvoll.");
    if(/10pod|10 pod/.test(hay)) add("30POD", "Nach 10POD ist häufig 30POD als Folgekontrolle sinnvoll.");
    if(/30pod|30 pod/.test(hay)) add("3POM", "Nach 30POD kann eine Monatskontrolle sinnvoll sein.");
  }

  // Parkinson/Logopädie/Ergo/Physio
  if(/parkinson|pks|tremor|rigor|mobilität|mobilitaet|tonus|ergo|logo|physio/.test(hay)){
    if(/sprache|stimme|phon|schluck|dysphag/.test(hay)) add("TGL-PHON", "Bei Sprach-/Stimm-/Schluckhinweisen ist ein logopädischer Abschnitt sinnvoll.");
    if(/ergo|alltag|hand|funktion/.test(hay)) add("PKS", "Bei funktionellen Einschränkungen ist der Parkinson-/Funktionsabschnitt sinnvoll.");
  }

  // Schwindel / zentrale Hinweise
  if(/schwindel|nystagmus|kopfimpuls|hints|skew|dhi|vestib/.test(hay)){
    add("VED A1", "Bei Schwindel-/Vestibularbefunden ist VED A1 als nächster Abschnitt sinnvoll.");
    if(/zentral|skew|vertikal|regellos|neurolog/.test(hay)){
      add("VED A2", "Bei zentralen Warnhinweisen ist eine weiterführende Schwindel-/Neurologie-Einordnung sinnvoll.");
    }
  }

  // Dysphagie
  if(/dysphag|schluck|aspiration|pneumonie|ees|husten|räusper|raeusper/.test(hay)){
    add("DYS A1", "Bei Dysphagie-Hinweisen ist der strukturierte Dysphagieabschnitt sinnvoll.");
    if(/therapie|empfehl|logo|physio|neuro/.test(hay)){
      add("DYS A2", "Bei Therapie-/Konsilhinweisen ist der weiterführende Dysphagieabschnitt sinnvoll.");
    }
  }

  return out.slice(0,4);
}

function chapterExists(label){
  const needle = label.toLowerCase().replace(/\s+/g,"");
  return [...document.querySelectorAll("#renderRoot .qt-tab-button")]
    .some(b => b.textContent.toLowerCase().replace(/\s+/g,"").includes(needle));
}

function jumpToChapter(label){
  const needle = label.toLowerCase().replace(/\s+/g,"");
  const btn = [...document.querySelectorAll("#renderRoot .qt-tab-button")]
    .find(b => b.textContent.toLowerCase().replace(/\s+/g,"").includes(needle));

  if(btn){
    btn.click();
    btn.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
    applyAutoRulesSoon();
    updateProcessFidelity();recalcSoon();
  }
}


function refreshChapterSelect(){
  const sel = document.getElementById("chapterSelect");
  if(!sel) return;

  const buttons = visibleChapterButtons();
  sel.innerHTML = '<option value="">Kapitel wählen...</option>' + buttons.map((b,i)=>{
    b.dataset.chapterSelectIndex = String(i);
    const txt = b.textContent.trim() || ("Kapitel " + (i+1));
    return `<option value="${i}">${esc(txt)}</option>`;
  }).join("");

  refreshChapterSelectValue();
}



function refreshChapterSelectValue(){
  const sel = document.getElementById("chapterSelect");
  if(!sel) return;

  const buttons = visibleChapterButtons();
  const active = buttons.findIndex(b=>b.classList.contains("active"));
  sel.value = active >= 0 ? String(active) : "";
}

function chapterSelectChanged(ev){
  const idx = Number(ev.target.value);
  if(Number.isNaN(idx)) return;

  const buttons = visibleChapterButtons();
  const btn = buttons[idx];
  if(!btn) return;

  btn.click();
  btn.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
  refreshChapterSelectValue();
}


function realEntryTabLabelForModule(){
  if(currentModule === "diagnostik") return "diagnostik";
  if(currentModule === "parkinson") return "mb.parkinson";
  if(currentModule === "postop") return "postop";
  return "";
}

function normalizeTabLabel(s){
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\.\-_]/g,"")
    .replace(/ö/g,"oe").replace(/ä/g,"ae").replace(/ü/g,"ue").replace(/ß/g,"ss");
}


function autoOpenRealEntryTab(){
  /*
    V18:
    Die Hauptkapitelleiste bleibt im DOM, damit Klicks/Logik/Synchronisation funktionieren.
    Nach dem Auto-Klick wird sie nur visuell ausgelagert, nicht gelöscht und nicht display:none.
  */
  const wanted = realEntryTabLabelForModule();
  if(!wanted) return;

  const tryClick = () => {
    const candidates = entryTabCandidatesForModule();
    if(!candidates.length) return false;

    candidates.sort((a,b)=>depth(b)-depth(a));
    const btn = candidates[0];

    btn.classList.add("entry-autoclick-active");
    btn.dataset.autoOpenedEntryTab = "1";
    btn.click();

    const bar = btn.closest(".qt-tabbar");
    if(bar){
      bar.classList.add("entry-mainbar-hidden");
      bar.dataset.hiddenButRendered = "1";
    }

    setTimeout(()=>{
      refreshChapterSelect();
      applyAutoRulesSoon?.();
      applyChapterHandoffsSoon?.();
      recalcSoon?.();
      updateProcessFidelity?.(); setTimeout(()=>updateProcessFidelity?.(),180);
    }, 100);

    return true;
  };

  if(!tryClick()){
    setTimeout(()=>{ if(!tryClick()) setTimeout(tryClick, 250); }, 80);
  }
}

function entryTabCandidatesForModule(){
  const wanted = realEntryTabLabelForModule();
  if(!wanted) return [];

  const wantedNorm = normalizeTabLabel(wanted);
  const extra = currentModule==="parkinson" ? ["pks","mbparkinson","morbusparkinson"] :
                currentModule==="postop" ? ["postop","postoperation","postop"] :
                currentModule==="diagnostik" ? ["diagnostik"] : [];

  return [...document.querySelectorAll("#renderRoot .qt-tab-button")]
    .filter(btn => btn.offsetParent !== null)
    .filter(btn => {
      const n = normalizeTabLabel(btn.textContent);
      if(n === "seite1" || n === "seite2") return false;
      return n === wantedNorm || n.includes(wantedNorm) || wantedNorm.includes(n) || extra.some(x=>n.includes(x));
    });
}

function visibleChapterButtons(){
  /*
    Alternative Kapitelauswahl:
    Hauptleisten, die nur für Logik im DOM bleiben, werden ignoriert.
    Sichtbare echte Unterkapitelleiste wird verwendet.
  */
  const root = document.querySelector("#renderRoot .qt-root");
  if(!root) return [];

  const bars = [...root.querySelectorAll(".qt-tabbar")]
    .filter(bar => bar.offsetParent !== null)
    .filter(bar => !bar.classList.contains("entry-mainbar-hidden"))
    .filter(bar => !bar.classList.contains("entry-tabbar-hidden"))
    .filter(bar => bar.querySelector(".qt-tab-button"));

  if(!bars.length) return [];

  bars.sort((a,b)=>{
    const ac=a.querySelectorAll(".qt-tab-button").length;
    const bc=b.querySelectorAll(".qt-tab-button").length;
    const ad=depth(a), bd=depth(b);
    if(bc !== ac) return bc - ac;
    return bd - ad;
  });

  return [...bars[0].querySelectorAll(".qt-tab-button")].filter(b=>b.offsetParent!==null);
}










/* PATCH v23: Prozesstreueberechnung aus funktionierender v15 wiederhergestellt */

function updateProcessFidelity(){
  /*
    Prozesstreue pro aktivem Kapitel:
    Pflicht/Prozessrelevanz wird pragmatisch aus sichtbaren aktiven Eingabefeldern berechnet.
    Score-/Ausgabefelder und versteckte/inaktive Felder zählen nicht.
  */
  const box = document.getElementById("processFidelity");
  const text = document.getElementById("processFidelityText");
  const bar = document.getElementById("processFidelityBar");
  if(!box || !text || !bar) return;

  const scope = activeScoreScope ? activeScoreScope() : document.getElementById("renderRoot");
  if(!scope) return;

  const relevant = [...scope.querySelectorAll("input[data-name], select[data-name], textarea[data-name]")]
    .filter(e => e.offsetParent !== null)
    .filter(e => !e.disabled)
    .filter(e => !isScoreOutputField((e.id||"").toLowerCase()))
    .filter(e => !isAdministrativeField(e));

  const done = relevant.filter(isProcessFieldCompleted).length;
  const total = relevant.length;
  const pct = total ? Math.round(done * 100 / total) : 0;

  text.textContent = `${pct}% (${done}/${total})`;
  bar.style.width = pct + "%";
}

function isAdministrativeField(e){
  const id=(e.id||"").toLowerCase();
  return (
    id.includes("anzahlelemente") ||
    id.includes("tooltip") ||
    id.includes("kapitel") ||
    id.includes("score") ||
    id.includes("tagesdatum") ||
    id.includes("mego") ||
    id.includes("verantwarzt")
  );
}

function isProcessFieldCompleted(e){
  if(e.type==="checkbox" || e.type==="radio") return !!e.checked;
  if(e.tagName==="SELECT") return e.selectedIndex > 0;
  return String(e.value || "").trim() !== "";
}


// PATCH_V23_PF_INTERVAL: optischer Refresh der v15-Prozesstreue
setInterval(()=>{ try { updateProcessFidelity(); } catch(e) {} }, 700);



let subScoreTimer=null;
function updateSubScoresSoon(){
  clearTimeout(subScoreTimer);
  subScoreTimer=setTimeout(updateSubScores,50);
}

function updateSubScores(){
  /*
    Zwischenscores:
    Typische Teilscorefelder wie MUCS / Mucosa Score werden aus den naheliegenden
    Eingabefeldern im selben Kapitel/Block berechnet.
  */
  const root = document.getElementById("renderRoot");
  if(!root) return;

  // 1. Mucosa Scores
  const mucosaOutputs = [...root.querySelectorAll("input[data-name], textarea[data-name]")]
    .filter(e => /mucs|mucosa/i.test(e.id || ""))
    .filter(e => /score|mucs/i.test((e.id || "").toLowerCase()))
    .filter(e => isLikelyOutput(e));

  mucosaOutputs.forEach(out => {
    const score = calculateLocalMucosaScore(out);
    if(score !== null && document.activeElement !== out){
      out.value = score;
      out.dataset.autoFilled = "1";
    }
  });

  // 2. generische Teilscore-Ausgabefelder
  const genericOutputs = [...root.querySelectorAll("input[data-name], textarea[data-name]")]
    .filter(e => isLikelySubScoreOutput(e))
    .filter(e => !/mucs|mucosa/i.test(e.id || ""));

  genericOutputs.forEach(out => {
    const score = calculateLocalBlockScore(out);
    if(score !== null && document.activeElement !== out){
      out.value = score;
      out.dataset.autoFilled = "1";
    }
  });
}

function isLikelyOutput(e){
  const id=(e.id||"").toLowerCase();
  return id.startsWith("le") || id.includes("score") || id.includes("mucs");
}

function isLikelySubScoreOutput(e){
  const id=(e.id||"").toLowerCase();
  if(isScoreOutputField(id)) return false; // Gesamtscore nicht hier
  return (
    id.includes("teilscore") ||
    id.includes("subscore") ||
    id.includes("befundscore") ||
    (id.includes("score") && !id.includes("gesamtscore"))
  );
}

function calculateLocalMucosaScore(out){
  const container = nearestScoringContainer(out);
  if(!container) return null;

  const mucosaNames = [
    "surface","glands","vessels","tension","sekret",
    "mucssurface","mucs","mucosa"
  ];

  let total = 0, count = 0;
  const fields = [...container.querySelectorAll("select[data-name], input[data-name], textarea[data-name]")]
    .filter(e => e !== out)
    .filter(e => !isScoreOutputField((e.id||"").toLowerCase()));

  fields.forEach(e => {
    const id=(e.id||"").toLowerCase();
    const label=nearestLabelText ? nearestLabelText(e).toLowerCase() : "";
    const hay=id+" "+label;
    if(!mucosaNames.some(n=>hay.includes(n))) return;

    const v = localScoreValue(e);
    if(v !== null){
      total += v;
      count++;
    }
  });

  return count ? total : null;
}

function calculateLocalBlockScore(out){
  const container = nearestScoringContainer(out);
  if(!container) return null;

  let total = 0, count = 0;
  const fields = [...container.querySelectorAll("select[data-name], input[data-name], textarea[data-name]")]
    .filter(e => e !== out)
    .filter(e => !isScoreOutputField((e.id||"").toLowerCase()))
    .filter(e => !isAdministrativeField(e));

  fields.forEach(e => {
    const v = localScoreValue(e);
    if(v !== null){
      total += v;
      count++;
    }
  });

  return count ? total : null;
}

function nearestScoringContainer(el){
  return el.closest(".qt-group") ||
         el.closest(".qt-tab-pane") ||
         el.closest(".qt-widget") ||
         document.getElementById("renderRoot");
}

function localScoreValue(e){
  if(e.disabled) return null;
  if(e.type==="checkbox" || e.type==="radio") return e.checked ? 1 : 0;
  if(e.tagName==="SELECT") {
    return e.selectedIndex > 0 ? e.selectedIndex : 0;
  }
  const raw = String(e.value || "").trim().replace(",",".");
  if(!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 1;
}

function updateReturnButtonsVisibility(){
  /*
    Zurück-Schaltflächen sollen nicht global sichtbar sein.
    Sie erscheinen nur, wenn der aktuelle sichtbare Bereich ein Unterkapitel/Detailbereich ist.
  */
  const root = document.getElementById("renderRoot");
  if(!root) return;

  const activeScope = activeScoreScope ? activeScoreScope() : root;
  const activeText = activeChapterLabel ? activeChapterLabel().toLowerCase() : "";

  const isDetail =
    /mucs|mucosa|pfess|post|pod|pom|diagnostik|parkinson|pks|unterkapitel|detail/.test(activeText) ||
    !!activeScope.closest(".qt-tab-pane");

  root.querySelectorAll("button[data-name]").forEach(btn => {
    const txt=(btn.textContent||"").toLowerCase();
    const id=(btn.id||"").toLowerCase();
    const isReturn = txt.includes("zurück") || txt.includes("zurueck") || id.includes("return") || id.includes("zurueck");
    if(!isReturn) return;

    const inActive = activeScope && activeScope.contains(btn);
    btn.style.display = (isDetail && inActive) ? "" : "none";
  });
}




function wireLegacyActionButtons(){
  /*
    Aktiviert alte STARC-Buttons:
    - Drucken / Print -> window.print()
    - Speichern / Save / Export -> vorhandene Speicher-/Exportfunktion
    - Abbrechen / Cancel -> Änderungen verwerfen / neu laden
  */
  const root = document.getElementById("renderRoot");
  if(!root) return;

  root.querySelectorAll("button[data-name], button[id]").forEach(btn=>{
    if(btn.dataset.legacyActionBound === "1") return;

    const hay = ((btn.id || "") + " " + (btn.textContent || "")).toLowerCase();

    if(hay.includes("print") || hay.includes("drucken")) {
      btn.disabled = false;
      btn.style.display = "";
      btn.dataset.legacyActionBound = "1";
      btn.onclick = (ev) => {
        ev.preventDefault();
        window.print();
      };
      return;
    }

    if(hay.includes("save") || hay.includes("speichern")) {
      btn.disabled = false;
      btn.style.display = "";
      btn.dataset.legacyActionBound = "1";
      btn.onclick = (ev) => {
        ev.preventDefault();
        if(typeof save === "function") save();
        else if(typeof saveEntry === "function") saveEntry();
      };
      return;
    }

    if(hay.includes("export")) {
      btn.disabled = false;
      btn.style.display = "";
      btn.dataset.legacyActionBound = "1";
      btn.onclick = (ev) => {
        ev.preventDefault();
        if(typeof exportJson === "function") exportJson();
        else if(typeof save === "function") save();
      };
      return;
    }

    if(hay.includes("cancel") || hay.includes("abbrechen")) {
      btn.disabled = false;
      btn.style.display = "";
      btn.dataset.legacyActionBound = "1";
      btn.onclick = (ev) => {
        ev.preventDefault();
        if(confirm("Änderungen verwerfen und aktuellen Eintrag neu laden?")) {
          if(currentId && typeof loadEntry === "function") loadEntry(currentId);
          else if(typeof newEntry === "function") newEntry();
          else loadModule(currentModule);
        }
      };
      return;
    }
  });
}




/* PATCH v39: Seite 1 - gesperrte Felder automatisch befüllen oder freigeben */

function patchPage1DisabledFields(){
  const root = document.getElementById("renderRoot");
  if(!root) return;

  const page1 = findPageOneScope() || root;

  const fields = [...page1.querySelectorAll("input[data-name], select[data-name], textarea[data-name]")]
    .filter(e => !e.closest(".entry-mainbar-hidden"))
    .filter(e => !e.closest(".entry-tabbar-hidden"));

  fields.forEach(el => {
    if(!el.disabled && !el.readOnly) return;

    const id = (el.id || "").toLowerCase();

    // Felder, die klar errechenbar oder organisatorisch sind, automatisch füllen.
    const autoValue = derivePage1AutoValue(el);

    if(autoValue !== null && autoValue !== undefined && String(autoValue).trim() !== ""){
      setFieldValue(el, autoValue);
      el.dataset.autoFilled = "1";
      el.disabled = false;
      el.readOnly = true;
      el.classList.add("auto-page1-field");
    } else {
      // Wenn keine sichere Automatik greift: anwählbar machen.
      el.disabled = false;
      el.readOnly = false;
      el.classList.add("unlocked-page1-field");
    }
  });
}

function findPageOneScope(){
  const buttons = [...document.querySelectorAll("#renderRoot .qt-tab-button")];
  const pageOneButton = buttons.find(b => {
    const t = (b.textContent || "").trim().toLowerCase();
    return t === "seite 1" || t === "seite1" || t.includes("seite 1");
  });

  if(pageOneButton){
    const rootId = pageOneButton.dataset.root;
    const idx = pageOneButton.dataset.idx;
    if(rootId !== undefined && idx !== undefined){
      const pane = document.querySelector(`[data-pane="${CSS.escape(rootId)}"][data-idx="${CSS.escape(idx)}"]`);
      if(pane) return pane;
    }
  }

  // Fallback: erster sichtbarer Pane
  return document.querySelector("#renderRoot .qt-tab-pane:not(.search-hidden)");
}

function derivePage1AutoValue(el){
  const id = (el.id || "").toLowerCase();
  const now = new Date();

  if(id.includes("datum") || id.includes("date") || id.includes("tagesdatum")){
    return now.toISOString().slice(0,10);
  }

  if(id.includes("zeit") || id.includes("time")){
    return now.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"});
  }

  if(id.includes("score")){
    const live = document.getElementById("liveScore");
    return live ? live.textContent : "0";
  }

  if(id.includes("prozesstreue") || id.includes("process")){
    const pf = document.getElementById("processFidelityText");
    return pf ? pf.textContent : "";
  }

  if(id.includes("anzahl") || id.includes("element")){
    const scope = findPageOneScope() || document.getElementById("renderRoot");
    const count = scope ? scope.querySelectorAll("input[data-name], select[data-name], textarea[data-name]").length : 0;
    return String(count);
  }

  if(id.includes("kapitel")){
    return activeChapterLabel ? activeChapterLabel() : "";
  }

  if(id.includes("diagnose")){
    const title = document.getElementById("moduleTitle");
    return title ? title.textContent : "";
  }

  if(id.includes("modus") || id.includes("mode")){
    return "Web Offline";
  }

  // Nutzer-/Arzt-/MEGO-Felder nicht blind erfinden.
  if(id.includes("arzt") || id.includes("mego") || id.includes("user") || id.includes("name")){
    return "";
  }

  return null;
}

function setFieldValue(el, value){
  if(el.tagName === "SELECT"){
    const valueText = String(value).toLowerCase();
    const options = [...el.options];
    const match = options.find(o => (o.textContent || "").toLowerCase() === valueText)
               || options.find(o => (o.textContent || "").toLowerCase().includes(valueText));
    if(match) el.value = match.value;
    else if(options.length > 1) el.selectedIndex = 1;
    return;
  }

  if(el.type === "checkbox" || el.type === "radio"){
    el.checked = !!value;
    return;
  }

  el.value = value;
}

function updatePage1DisabledFieldsSoon(){
  clearTimeout(window.__page1PatchTimer);
  window.__page1PatchTimer = setTimeout(patchPage1DisabledFields, 120);
}

// Hooks
document.addEventListener("input", updatePage1DisabledFieldsSoon, true);
document.addEventListener("change", updatePage1DisabledFieldsSoon, true);
document.addEventListener("click", ev => {
  if(ev.target && ev.target.classList && ev.target.classList.contains("qt-tab-button")){
    updatePage1DisabledFieldsSoon();
  }
}, true);

setInterval(updatePage1DisabledFieldsSoon, 1500);




/* PATCH v40: Seite 1 Diagnose/Therapie automatisch befüllen */

function updatePage1DiagnosisTherapy(){
  const page1 = findPageOneScope ? findPageOneScope() : document.getElementById("renderRoot");
  if(!page1) return;

  const diagnosisTargets = findPage1TextTargets(page1, ["diagnose", "diagnosis", "befund"]);
  const therapyTargets = findPage1TextTargets(page1, ["therapie", "therapy", "behandlung", "empfehlung", "recommendation"]);

  const active = activeChapterLabel ? activeChapterLabel() : "";
  const moduleTitle = document.getElementById("moduleTitle")?.textContent || "";
  const score = document.getElementById("liveScore")?.textContent || "0";
  const process = document.getElementById("processFidelityText")?.textContent || "";

  const criteria = collectActiveCriteriaForPage1();
  const existingRecommendations = collectExistingRecommendationTexts();

  const diagnosisText = buildPage1DiagnosisText(moduleTitle, active, score, process, criteria);
  const therapyText = buildPage1TherapyText(moduleTitle, active, score, criteria, existingRecommendations);

  diagnosisTargets.forEach(el => writePreparedPage1Text(el, diagnosisText));
  therapyTargets.forEach(el => writePreparedPage1Text(el, therapyText));
}

function findPage1TextTargets(scope, keywords){
  const fields = [...scope.querySelectorAll("input[data-name], textarea[data-name]")]
    .filter(el => el.tagName === "TEXTAREA" || el.type === "text" || !el.type);

  return fields.filter(el => {
    const hay = ((el.id || "") + " " + (nearestLabelText ? nearestLabelText(el) : "")).toLowerCase();
    return keywords.some(k => hay.includes(k));
  });
}

function collectActiveCriteriaForPage1(){
  const scope = activeScoreScope ? activeScoreScope() : document.getElementById("renderRoot");
  if(!scope) return [];

  return [...scope.querySelectorAll("input[data-name], select[data-name], textarea[data-name]")]
    .filter(el => !el.disabled)
    .filter(el => !el.closest(".qt-tab-pane.search-hidden"))
    .filter(el => !isScoreOutputField((el.id || "").toLowerCase()))
    .filter(el => {
      if(el.type === "checkbox" || el.type === "radio") return el.checked;
      if(el.tagName === "SELECT") return el.selectedIndex > 0;
      return String(el.value || "").trim() !== "";
    })
    .map(el => {
      const label = nearestLabelText ? nearestLabelText(el) : (el.id || "");
      let value = "";
      if(el.type === "checkbox" || el.type === "radio") value = "ja";
      else if(el.tagName === "SELECT") value = el.options[el.selectedIndex]?.textContent?.trim() || "";
      else value = String(el.value || "").trim();

      return `${label || el.id}: ${value}`;
    })
    .filter(Boolean)
    .slice(0, 18);
}

function collectExistingRecommendationTexts(){
  const root = document.getElementById("renderRoot");
  if(!root) return [];

  return [...root.querySelectorAll("textarea[data-name], input[data-name]")]
    .filter(el => {
      // Eigene Seite-1-Auto-Therapie nicht wieder als Quelle verwenden.
      if(el.dataset.autoPage1DiagnosisTherapy === "1") return false;

      const hay = ((el.id || "") + " " + (nearestLabelText ? nearestLabelText(el) : "")).toLowerCase();
      return hay.includes("empfehl") || hay.includes("recommend") || hay.includes("therapie") || hay.includes("auswertung");
    })
    .map(el => String(el.value || "").trim())
    .filter(v => v.length > 12)
    .slice(0, 3);
}

function buildPage1DiagnosisText(moduleTitle, active, score, process, criteria){
  /*
    Diagnose soll nicht nur den UI-Teil enthalten.
    Sie enthält jetzt:
      1. konkretes aktives Kapitel / Unterkapitel
      2. optional den fachlich abgeleiteten Diagnosebereich
      3. Score / Prozesstreue
      4. relevante Kriterien
  */

  const concreteChapter = getConcreteActiveChapterName();
  const inferred = inferDiagnosisTitleFromCriteria(criteria);
  const cleanActive = cleanGenericTitle(active);
  const cleanModule = cleanGenericTitle(moduleTitle);

  const title =
    concreteChapter ||
    cleanActive ||
    inferred ||
    cleanModule ||
    "Automatisch erstellte Diagnosezusammenfassung";

  const lines = [];

  lines.push(title);

  if(inferred && inferred !== title){
    lines.push(`Bereich: ${inferred}`);
  }

  if(cleanModule && cleanModule !== title && cleanModule !== inferred){
    lines.push(`Modul: ${cleanModule}`);
  }

  lines.push(`Score: ${score}`);
  if(process) lines.push(`Prozesstreue: ${process}`);

  if(criteria.length){
    lines.push("");
    lines.push("Relevante Kriterien:");
    criteria.slice(0, 10).forEach(c => lines.push("• " + cleanLeadingMarks(c)));
  } else {
    lines.push("");
    lines.push("Keine relevanten Kriterien im aktiven Kapitel dokumentiert.");
  }

  return normalizeGeneratedText(lines.join("\n"));
}

function buildPage1TherapyText(moduleTitle, active, score, criteria, existingRecommendations){
  const hay = (moduleTitle + " " + active + " " + criteria.join(" ")).toLowerCase();
  const nScore = Number(String(score).replace(",", ".")) || 0;
  const suggestions = [];

  function add(s){
    s = normalizeTherapySuggestion(s);
    if(s && !suggestions.includes(s)) suggestions.push(s);
  }

  if(existingRecommendations.length){
    existingRecommendations.forEach(t => {
      splitRecommendationText(t).forEach(add);
    });
  }

  if(/tin|tinnitus/.test(hay)){
    add("Tinnitusberatung, Aufklärung und Verlaufskontrolle erwägen.");
    if(/hör|hoer|rta|audi|bera|dpoae|ci/.test(hay)) add("Audiologische Diagnostik bzw. CI-Abklärung je nach Befundlage prüfen.");
  }

  if(/ci|implant|cochlea/.test(hay)){
    add("CI-Abklärung mit audiologischer und bildgebender Befundsammlung prüfen.");
  }

  if(/fdn|crs|mucs|snot|snif|nasen|polyp|fess|dupm/.test(hay)){
    add("Konservative rhinologische Basistherapie und Verlaufskontrolle prüfen.");
    if(/fess|ct|cbct|nnh|polyp/.test(hay)) add("Operative Indikation anhand Klinik, Endoskopie und Bildgebung prüfen.");
    if(/dupm|dupilumab|biolog/.test(hay)) add("Biologika-Kriterien und Vorbehandlung prüfen.");
  }

  if(/parkinson|pks|tremor|rigor|ergo|logo|physio/.test(hay)){
    add("Interdisziplinäre Therapieplanung mit Physio-/Ergo-/Logopädie je nach Befund erwägen.");
  }

  if(/postop|post op|pod|naht|doyle|drainage|verband|schmerz/.test(hay)){
    add("Postoperative Verlaufskontrolle gemäß Befund und Eingriff fortführen.");
  }

  if(!suggestions.length){
    if(nScore <= 0) add("Keine spezifische Therapieempfehlung aus den aktuellen Angaben ableitbar.");
    else if(nScore < 5) add("Verlaufskontrolle und Befundabgleich empfohlen.");
    else if(nScore < 12) add("Gezielte Diagnostik/Therapieentscheidung anhand Score und Kriterien prüfen.");
    else add("Zeitnahe ärztliche Bewertung und Therapieentscheidung empfohlen.");
  }

  return normalizeGeneratedText(suggestions.map(s => "• " + s).join("\n"));
}

function writePreparedPage1Text(el, text){
  if(!el || !text) return;

  /*
    V42:
    Ruhige Auto-Befüllung.
    Das Feld wird nur geschrieben, wenn sich der berechnete Text wirklich geändert hat.
    Kein vorheriges Leeren mehr, kein Flackern, kein dauerndes Neusetzen.
  */

  const manual = el.dataset.manualPage1Edit === "1";
  if(manual) return;

  const newText = String(text || "").trim();
  const oldText = String(el.value || "").trim();
  const lastAuto = String(el.dataset.lastAutoText || "").trim();

  // Wenn der Inhalt bereits identisch ist: gar nichts tun.
  if(oldText === newText || lastAuto === newText) {
    return;
  }

  // Wenn der Nutzer einen anderen Inhalt hineingeschrieben hat, nicht überschreiben.
  const hasManualDifferentContent =
    oldText !== "" &&
    el.dataset.autoPage1DiagnosisTherapy !== "1" &&
    oldText !== lastAuto;

  if(hasManualDifferentContent) {
    el.dataset.manualPage1Edit = "1";
    return;
  }

  el.disabled = false;
  el.readOnly = false;

  el.value = newText;

  el.dataset.autoFilled = "1";
  el.dataset.autoPage1DiagnosisTherapy = "1";
  el.dataset.lastAutoText = newText;

  el.classList.add("auto-page1-field");
}

function updatePage1DiagnosisTherapySoon(){
  clearTimeout(window.__page1DiagTherapyTimer);
  window.__page1DiagTherapyTimer = setTimeout(updatePage1DiagnosisTherapy, 180);
}

document.addEventListener("input", updatePage1DiagnosisTherapySoon, true);
document.addEventListener("change", updatePage1DiagnosisTherapySoon, true);
document.addEventListener("click", ev => {
  if(ev.target && ev.target.classList && ev.target.classList.contains("qt-tab-button")){
    updatePage1DiagnosisTherapySoon();
  }
}, true);

setInterval(updatePage1DiagnosisTherapySoon, 2000);



function cleanGenericTitle(s){
  s = String(s || "").trim();
  if(!s) return "";
  const n = s.toLowerCase().replace(/\s+/g, " ").trim();
  const compact = n.replace(/\s+/g,"").replace(/[.\-_]/g,"");

  if(compact === "hauptteil" || compact === "moh" || compact === "medicaloperationhandbook") return "";
  if(compact === "seite1" || compact === "seite2") return "";
  if(compact === "diagnostik" || compact === "postop" || compact === "mbparkinson" || compact === "parkinson") return "";
  if(n.includes("full-hd") || n.includes("offline")) return "";

  return s;
}

function inferDiagnosisTitleFromCriteria(criteria){
  const hay = String((criteria || []).join(" ")).toLowerCase();
  if(/tin|tinnitus/.test(hay)) return "Tinnitus";
  if(/ci|cochlea|implant/.test(hay)) return "CI-Abklärung";
  if(/fdn|crs|mucs|snot|snif|nasen|polyp|fess/.test(hay)) return "Rhinologische Diagnostik";
  if(/parkinson|pks|tremor|rigor/.test(hay)) return "Mb. Parkinson";
  if(/postop|post op|pod|naht|doyle|drainage|verband/.test(hay)) return "Postoperative Kontrolle";
  if(/schwindel|vestib|nystagmus/.test(hay)) return "Schwindel / Vestibuläre Diagnostik";
  if(/dysphag|schluck/.test(hay)) return "Dysphagie";
  return "";
}

function cleanLeadingMarks(s){
  return String(s || "")
    .replace(/^[\s•\-\.\u2022]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTherapySuggestion(s){
  s = cleanLeadingMarks(s);

  // Mehrfach-Bullets, einzeln stehende Punkte und bereits generierte Überschriften entfernen.
  s = s
    .replace(/^therapie\s*:?\s*/i, "")
    .replace(/^empfehlung\s*:?\s*/i, "")
    .replace(/^automatische\s+auswertung\s*:?\s*/i, "")
    .replace(/^score\s*:\s*\d+.*$/i, "")
    .trim();

  if(!s || s === "." || s === "•") return "";

  // Verhindert, dass alle paar Sekunden ein Punkt vorne entsteht.
  s = s.replace(/^\.+\s*/g, "").trim();

  return s;
}

function splitRecommendationText(t){
  return String(t || "")
    .split(/\n+/)
    .map(normalizeTherapySuggestion)
    .filter(Boolean)
    .filter(line => !/^aktive kriterien/i.test(line))
    .filter(line => !/^score:/i.test(line));
}

function normalizeGeneratedText(text){
  return String(text || "")
    .split("\n")
    .map(line => {
      // Bullet-Zeilen sauber halten: genau ein Bullet.
      if(/^\s*[•\-\.\u2022]+\s*/.test(line)){
        return "• " + cleanLeadingMarks(line);
      }
      return line.replace(/^\s+\./, "").trimEnd();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}



function getConcreteActiveChapterName(){
  /*
    Sucht den wirklich konkreten aktiven Kapitelpfad.
    Technische Wrapper wie Seite 1/2, Hauptteil, Diagnostik, post OP etc.
    werden herausgefiltert, sofern darunter ein konkreteres Unterkapitel aktiv ist.
  */
  const activeButtons = [...document.querySelectorAll("#renderRoot .qt-tab-button.active")]
    .filter(b => b.offsetParent !== null || !b.closest(".entry-mainbar-hidden"))
    .map(b => (b.textContent || "").trim())
    .filter(Boolean);

  const cleaned = activeButtons
    .map(cleanChapterLabel)
    .filter(Boolean)
    .filter(label => !isGenericChapterLabel(label));

  if(cleaned.length){
    return cleaned.join(" / ");
  }

  // Fallback: sichtbarer Tabbar-Button, falls active wegen Wrappern nicht sauber greift.
  const visibleActive = [...document.querySelectorAll("#renderRoot .qt-tabbar:not(.entry-mainbar-hidden) .qt-tab-button.active")]
    .map(b => cleanChapterLabel(b.textContent || ""))
    .filter(Boolean)
    .filter(label => !isGenericChapterLabel(label));

  if(visibleActive.length) return visibleActive.join(" / ");

  return "";
}

function cleanChapterLabel(s){
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/^\s*[•\-\.\u2022]+\s*/g, "")
    .trim();
}

function isGenericChapterLabel(label){
  const n = String(label || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.\-_]/g, "");

  return (
    n === "" ||
    n === "seite1" ||
    n === "seite2" ||
    n === "hauptteil" ||
    n === "diagnostik" ||
    n === "postop" ||
    n === "mbparkinson" ||
    n === "parkinson" ||
    n === "moh" ||
    n.includes("medicaloperationhandbook")
  );
}



/* PATCH v45: echtes Tagesdatum statt Altwerten wie 01.01.2018 */

function updateTodayDateFields(){
  const root = document.getElementById("renderRoot");
  if(!root) return;

  const now = new Date();

  const isoDate = now.toISOString().slice(0,10);

  const germanDate = now.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const targets = [...root.querySelectorAll("input[data-name], textarea[data-name]")]
    .filter(el => {
      const hay = ((el.id || "") + " " + (nearestLabelText ? nearestLabelText(el) : "")).toLowerCase();

      return (
        hay.includes("datum") ||
        hay.includes("date") ||
        hay.includes("tagesdatum") ||
        hay.includes("untersuchungsdatum")
      );
    });

  targets.forEach(el => {
    const current = String(el.value || "").trim();

    // Nur offensichtliche Platzhalter/Altwerte überschreiben.
    const looksLikeOldDefault =
      current === "" ||
      current === "01.01.2018" ||
      current === "1.1.2018" ||
      current === "2018-01-01" ||
      /^0?1[.\-/]0?1[.\-/]20(1[0-9]|2[0-4])$/.test(current);

    if(!looksLikeOldDefault && el.dataset.autoTodayDate !== "1"){
      return;
    }

    el.disabled = false;
    el.readOnly = false;

    // Typabhängig befüllen
    if((el.type || "").toLowerCase() === "date"){
      el.value = isoDate;
    } else {
      el.value = germanDate;
    }

    el.dataset.autoTodayDate = "1";
    el.dataset.autoFilled = "1";
    el.classList.add("auto-page1-field");
  });
}

function updateTodayDateFieldsSoon(){
  clearTimeout(window.__todayDateTimer);
  window.__todayDateTimer = setTimeout(updateTodayDateFields, 100);
}

document.addEventListener("DOMContentLoaded", updateTodayDateFieldsSoon);
document.addEventListener("input", updateTodayDateFieldsSoon, true);
document.addEventListener("change", updateTodayDateFieldsSoon, true);

setInterval(updateTodayDateFieldsSoon, 60000);




/* PATCH v47: Info-Button/Infofeld entfernen, sonst v45-Layout beibehalten */
function cleanupV47Info(){
  const toggle = document.getElementById("toggleMetaBtn");
  if(toggle) toggle.remove();

  document.querySelectorAll(".meta-card,#infoPanel,#infoBox,.info-panel,.info-box").forEach(el => {
    el.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", cleanupV47Info);
document.addEventListener("click", () => setTimeout(cleanupV47Info, 50), true);
setInterval(cleanupV47Info, 2000);




/* PATCH v48: Abschlusszeile dynamisch entfernen */
function cleanupV48SummaryRows(){
  const root = document.getElementById("renderRoot");
  if(!root) return;

  const patterns = [
    "prozesstreue",
    "process",
    "anzahlelemente",
    "anzahl elemente",
    "gesamtscore",
    "gesamt score",
    "totalscore",
    "total score"
  ];

  root.querySelectorAll("input[data-name], textarea[data-name], select[data-name]").forEach(el => {
    const label =
      typeof nearestLabelText === "function"
        ? nearestLabelText(el)
        : "";

    const hay = ((el.id || "") + " " + label).toLowerCase();

    if(patterns.some(p => hay.includes(p))){
      const row =
        el.closest(".qt-item") ||
        el.closest(".qt-row") ||
        el.closest(".qt-inline") ||
        el.parentElement;

      if(row){
        row.style.display = "none";
      } else {
        el.style.display = "none";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", cleanupV48SummaryRows);
document.addEventListener("click", () => setTimeout(cleanupV48SummaryRows, 50), true);
document.addEventListener("change", () => setTimeout(cleanupV48SummaryRows, 50), true);
setInterval(cleanupV48SummaryRows, 1500);




/* PATCH v50: Abschlusszeile sicher entfernen, ohne Kapitelcontainer auszublenden */
function cleanupV50SummaryFieldsSafe(){
  const root = document.getElementById("renderRoot");
  if(!root) return;

  const terms = [
    "prozesstreue",
    "anzahl der elemente",
    "anzahl elemente",
    "gesamtscore",
    "gesamt score"
  ];

  // Nur direkte Label-/Input-Paare entfernen, keine großen DIVs oder Layoutcontainer.
  root.querySelectorAll("label, input, textarea, select").forEach(el => {
    const labelText = (el.textContent || "").toLowerCase().replace(/\s+/g, " ");
    const idText = ((el.id || "") + " " + (el.getAttribute("name") || "")).toLowerCase();

    const hay = labelText + " " + idText;
    const match = terms.some(t => hay.includes(t));

    if(!match) return;
    if(el.closest(".floating-pf")) return;

    // Element selbst ausblenden
    el.classList.add(el.tagName === "LABEL" ? "summary-label-hidden" : "summary-field-hidden");
    el.style.display = "none";

    // Nur kleinste direkte Hülle ausblenden, wenn sie sehr klein ist.
    const parent = el.parentElement;
    if(parent && parent !== root && !parent.classList.contains("qt-tab-pane") && !parent.classList.contains("qt-group")){
      const inputs = parent.querySelectorAll("input, textarea, select").length;
      const labels = parent.querySelectorAll("label").length;
      const text = (parent.textContent || "").toLowerCase();

      const onlySummary =
        (text.includes("prozesstreue") || text.includes("gesamtscore") || text.includes("anzahl der elemente")) &&
        inputs <= 4 &&
        labels <= 4;

      if(onlySummary){
        parent.classList.add("summary-row-hidden");
        parent.style.display = "none";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", cleanupV50SummaryFieldsSafe);
document.addEventListener("click", () => setTimeout(cleanupV50SummaryFieldsSafe, 80), true);
document.addEventListener("change", () => setTimeout(cleanupV50SummaryFieldsSafe, 80), true);
setInterval(cleanupV50SummaryFieldsSafe, 1500);




/* PATCH v51: linke Datensatz-Combobox exakt an Buttonbreite anpassen */
function cleanupV51LeftComboWidth(){
  const entry = document.getElementById("entrySelect");
  if(!entry) return;

  // passenden Referenzbutton suchen
  const panel = entry.closest(".storage-panel, .left-panel, .sidebar") || entry.parentElement;
  if(!panel) return;

  const buttons = [...panel.querySelectorAll("button")]
    .filter(b => b.offsetWidth > 40);

  if(!buttons.length) return;

  const refWidth = buttons[0].offsetWidth;

  entry.style.width = refWidth + "px";
  entry.style.maxWidth = refWidth + "px";
  entry.style.minWidth = refWidth + "px";
  entry.style.boxSizing = "border-box";
}

document.addEventListener("DOMContentLoaded", cleanupV51LeftComboWidth);
document.addEventListener("resize", cleanupV51LeftComboWidth);
setInterval(cleanupV51LeftComboWidth, 1200);

