/* ==========================================================
   CONTROLLI: ricerca, filtri, export/import

   I filtri esistono UNA volta sola nel DOM. Su desktop stanno
   nella colonna laterale, sotto i 1180px vengono spostati dentro
   il drawer: costruirli due volte vorrebbe dire tenere allineati
   due insiemi di pulsanti per gli stessi dati.
   ========================================================== */

function countBy(getter){
  const m = new Map();
  ITEMS.forEach(it=>{
    const v = getter(it);
    (Array.isArray(v) ? v : [v]).filter(x=>x!==null&&x!==undefined&&x!=='').forEach(x=>{
      m.set(x, (m.get(x)||0)+1);
    });
  });
  return m;
}
function optionsFrom(getter, label){
  return [...countBy(getter).entries()]
    .sort((a,b)=> b[1]-a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([v,n])=>({ value:v, label:label ? label(v) : v, count:n }));
}

const YEARS = ITEMS.map(i=>i.year);
const MIN_YEAR = Math.min(...YEARS);
const MAX_YEAR = Math.max(...YEARS);

let facetGroups = null;   // il contenitore che viaggia fra colonna e drawer

function buildFilterPanel(){
  const groups = [
    {
      key:'watch', title:'Visione', multi:false, live:true,
      options:[
        {value:'unwatched', label:'Da vedere'},
        {value:'watched',   label:'Visti'},
        {value:'skipped',   label:'Saltati'},
      ],
    },
    { key:'universe', title:'Universo', multi:true, options: optionsFrom(i=>i.universe) },
    { key:'type', title:'Tipo', multi:true, options: optionsFrom(i=>i.type, v=>TYPE_LABEL[v]||v) },
    {
      key:'medium', title:'Formato', multi:false,
      options:[
        {value:'live-action', label:'Live action', count: ITEMS.filter(i=>i.medium==='live-action').length},
        {value:'animation',   label:'Animazione',  count: ITEMS.filter(i=>i.medium==='animation').length},
      ],
    },
    { key:'status', title:'Stato', multi:true, options: optionsFrom(i=>i.status, v=>STATUS_LABEL[v]||v) },
    { key:'phase', title:'Fase MCU', multi:true, options: optionsFrom(i=>i.phase, v=>'Fase '+v) },
    { key:'franchise', title:'Franchise', multi:true, scroll:true, options: optionsFrom(i=>i.franchise) },
    { key:'character', title:'Personaggi', multi:true, scroll:true, options: optionsFrom(i=>i.characters) },
  ];

  facetGroups = document.createElement('div');
  facetGroups.id = 'facetGroups';

  /* L'ordinamento vive nella barra comandi, ma sotto i 720px la barra
     non ha spazio per cinque controlli e la <select> sparisce: qui c'è
     il suo doppio, nascosto su desktop dal CSS. Senza, su telefono
     l'ordinamento sarebbe semplicemente irraggiungibile. */
  const sortSection = `
      <section class="facet facet-sort">
        <h3 class="facet-title">Ordina per</h3>
        <div class="facet-opts">
          ${Object.entries(SORT_LABEL).map(([v,l])=>`
            <button class="fopt fsort" data-sort="${v}" aria-pressed="${v===sortMode}">
              <span class="t">${l}</span>
            </button>`).join('')}
        </div>
      </section>`;

  facetGroups.innerHTML = sortSection +
    groups.map(g=>`
      <section class="facet" data-group="${g.key}">
        <h3 class="facet-title">${g.title}</h3>
        <div class="facet-opts ${g.scroll?'is-scroll':''}">
          ${g.options.map(o=>`
            <button class="fopt" data-key="${g.key}" data-value="${escapeHtml(String(o.value))}" data-multi="${g.multi}" aria-pressed="false">
              <span class="t">${escapeHtml(o.label)}</span>
              <span class="c"${g.live?' data-live="'+o.value+'"':''}>${o.count ?? ''}</span>
            </button>`).join('')}
        </div>
      </section>`).join('') + `
      <section class="facet">
        <h3 class="facet-title">Curatela</h3>
        <div class="facet-opts">
          <button class="fopt" id="optEssential" aria-pressed="false">
            <span class="t">Solo gli essenziali MCU</span>
            <span class="c">${ITEMS.filter(i=>i.essential).length}</span>
          </button>
        </div>
      </section>
      <section class="facet">
        <h3 class="facet-title">Anno <span class="c" id="yearHint">${MIN_YEAR}–${MAX_YEAR}</span></h3>
        <div class="year-range">
          <input type="range" id="yearMin" min="${MIN_YEAR}" max="${MAX_YEAR}" value="${MIN_YEAR}" step="1" aria-label="Anno minimo">
          <input type="range" id="yearMax" min="${MIN_YEAR}" max="${MAX_YEAR}" value="${MAX_YEAR}" step="1" aria-label="Anno massimo">
        </div>
      </section>
      <button class="facet-reset" id="railResetBtn">Azzera i filtri</button>`;

  facetGroups.querySelectorAll('.fopt[data-key]').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      const key = opt.dataset.key;
      const multi = opt.dataset.multi === 'true';
      let value = opt.dataset.value;
      if(key === 'phase') value = Number(value);

      if(multi){
        const arr = filters[key];
        const i = arr.indexOf(value);
        if(i >= 0) arr.splice(i,1); else arr.push(value);
      }else{
        filters[key] = (filters[key] === value) ? 'all' : value;
      }
      syncFilterUI();
      render();
    });
  });

  facetGroups.querySelectorAll('.fsort').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      sortMode = btn.dataset.sort;
      document.getElementById('sortSelect').value = sortMode;
      syncFilterUI();
      render();
    });
  });

  facetGroups.querySelector('#optEssential').addEventListener('click', ()=>{
    filters.essentialOnly = !filters.essentialOnly;
    syncFilterUI();
    render();
  });

  facetGroups.querySelector('#railResetBtn').addEventListener('click', ()=>{
    resetFilters();
    syncFilterUI();
    render();
    showToast('Filtri azzerati.');
  });

  const yMin = facetGroups.querySelector('#yearMin');
  const yMax = facetGroups.querySelector('#yearMax');
  const onYear = ()=>{
    let a = Number(yMin.value), b = Number(yMax.value);
    if(a > b){ [a,b] = [b,a]; }
    filters.yearMin = (a === MIN_YEAR) ? null : a;
    filters.yearMax = (b === MAX_YEAR) ? null : b;
    facetGroups.querySelector('#yearHint').textContent = `${a}–${b}`;
    render();
  };
  yMin.addEventListener('input', onYear);
  yMax.addEventListener('input', onYear);

  placeFilters();
}

/* ---------- colonna o drawer, secondo lo spazio ---------- */
const wideScreen = window.matchMedia('(min-width: 1181px)');

function placeFilters(){
  if(!facetGroups) return;
  const host = wideScreen.matches
    ? document.getElementById('filterRail')
    : document.getElementById('facetDrawerBody');
  if(host && facetGroups.parentNode !== host) host.appendChild(facetGroups);
  // passando alla colonna il drawer non deve restare aperto sotto
  if(wideScreen.matches) closeFilters();
}
wideScreen.addEventListener('change', placeFilters);

/* riallinea lo stato visivo delle opzioni a `filters` */
function syncFilterUI(){
  if(!facetGroups) return;

  facetGroups.querySelectorAll('.fopt[data-key]').forEach(opt=>{
    const key = opt.dataset.key;
    const multi = opt.dataset.multi === 'true';
    let value = opt.dataset.value;
    if(key === 'phase') value = Number(value);
    const on = multi ? filters[key].includes(value) : filters[key] === value;
    opt.classList.toggle('active', on);
    opt.setAttribute('aria-pressed', on);
  });

  facetGroups.querySelectorAll('.fsort').forEach(btn=>{
    const on = btn.dataset.sort === sortMode;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });

  const ess = facetGroups.querySelector('#optEssential');
  ess.classList.toggle('active', filters.essentialOnly);
  ess.setAttribute('aria-pressed', filters.essentialOnly);

  // i conteggi della visione cambiano man mano che segni i titoli
  const live = { watched:0, skipped:0, unwatched:0 };
  ITEMS.forEach(i=>{
    const s = getStatus(i.id);
    if(s === 'watched') live.watched++;
    else if(s === 'skipped') live.skipped++;
    else live.unwatched++;
  });
  facetGroups.querySelectorAll('[data-live]').forEach(el=>{
    el.textContent = live[el.dataset.live];
  });

  const si = document.getElementById('searchInput');
  if(si && si.value !== filters.query) si.value = filters.query;

  const yMin = facetGroups.querySelector('#yearMin');
  const yMax = facetGroups.querySelector('#yearMax');
  if(yMin && yMax){
    const lo = filters.yearMin ?? MIN_YEAR;
    const hi = filters.yearMax ?? MAX_YEAR;
    yMin.value = lo; yMax.value = hi;
    facetGroups.querySelector('#yearHint').textContent = `${lo}–${hi}`;
  }
}

/* --- ricerca (con debounce) --- */
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e)=>{
  const val = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ filters.query = val; render(); }, 130);
});

/* "/" porta il cursore nella ricerca, come in mezzo mondo — ma non
   mentre si sta già scrivendo da qualche altra parte. */
document.addEventListener('keydown', (e)=>{
  if(e.key !== '/' || e.metaKey || e.ctrlKey) return;
  const t = e.target;
  if(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
  e.preventDefault();
  document.getElementById('searchInput').focus();
});

document.getElementById('sortSelect').addEventListener('change', (e)=>{
  sortMode = e.target.value;
  syncFilterUI();   // il doppione nel drawer deve seguire
  render();
});

/* --- drawer dei filtri (solo sotto i 1180px) --- */
const facetWrap = document.getElementById('facetWrap');
function openFilters(){
  facetWrap.classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeFilters(){
  facetWrap.classList.remove('open');
  document.body.classList.remove('no-scroll');
}
document.getElementById('filterToggle').addEventListener('click', ()=>{
  facetWrap.classList.contains('open') ? closeFilters() : openFilters();
});
document.getElementById('filterCloseBtn').addEventListener('click', closeFilters);
facetWrap.addEventListener('click', (e)=>{ if(e.target === facetWrap) closeFilters(); });
document.getElementById('filterApplyBtn').addEventListener('click', closeFilters);
document.getElementById('filterResetBtn').addEventListener('click', ()=>{
  resetFilters();
  syncFilterUI();
  render();
  showToast('Filtri azzerati.');
});

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('Vuoi azzerare tutti i titoli segnati come visti o saltati? Il backup JSON già esportato non viene toccato.')){
    state.status = {};
    saveState();
    buildCards();
    syncFilterUI();
    render();
    showToast('Elenco visti/saltati azzerato.');
  }
});

/* ==========================================================
   EXPORT / IMPORT JSON
   ========================================================== */
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const payload = {
    app:'marvel-watchlist',
    version:3,
    exportedAt:new Date().toISOString(),
    status: ITEMS.filter(i=>getStatus(i.id)!=='todo')
                 .map(i=>({id:i.id, tmdbId:i.tmdbId, title:i.title, status:getStatus(i.id)})),
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marvel-watchlist-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup JSON scaricato.');
});

document.getElementById('importBtn').addEventListener('click', ()=>{
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt)=>{
    try{
      const data = JSON.parse(evt.target.result);
      const byId = new Set(ITEMS.map(i=>i.id));
      // i vecchi backup usavano id diversi: si recupera anche per titolo
      const byTitle = new Map(ITEMS.map(i=>[normalizeText(i.title), i.id]));
      let count = 0;
      const apply = (id, st)=>{
        if(id && byId.has(id)){ state.status[id] = st; count++; return true; }
        return false;
      };
      const rows = Array.isArray(data.status) ? data.status
                 : Array.isArray(data.watched) ? data.watched.map(w=>({id:(typeof w==='string'?w:w.id), title:(w&&w.title), status:'watched'}))
                 : null;
      if(!rows) throw new Error('Formato non valido');
      rows.forEach(w=>{
        const st = (w.status==='skipped') ? 'skipped' : 'watched';
        if(apply(w.id, st)) return;
        if(w.title){
          const guess = byTitle.get(normalizeText(w.title));
          if(guess) apply(guess, st);
        }
      });
      saveState();
      // le card portano lo stato nel markup: vanno ricostruite, non
      // basta rifiltrare
      buildCards();
      syncFilterUI();
      render();
      showToast(`Backup importato: ${count} titoli ripristinati.`);
    }catch(err){
      showToast('File non valido, impossibile importare.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});
