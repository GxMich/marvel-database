/* ==========================================================
   CONTROLLI: ricerca, pannello filtri, export/import
   ========================================================== */

/* --- costruzione dinamica dei gruppi di filtro dal catalogo --- */
function uniqueSorted(values){
  return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
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

function buildFilterPanel(){
  const panel = document.getElementById('filterPanel');

  const groups = [
    {
      key:'universe', title:'Universo', multi:true,
      options: uniqueSorted(ITEMS.map(i=>i.universe)).map(v=>({value:v, label:v})),
    },
    {
      key:'type', title:'Tipo di contenuto', multi:true,
      options: uniqueSorted(ITEMS.map(i=>i.type)).map(v=>({value:v, label:TYPE_LABEL[v]||v})),
    },
    {
      key:'medium', title:'Formato', multi:false,
      options: [
        {value:'all', label:'Tutti'},
        {value:'live-action', label:'Live action'},
        {value:'animation', label:'Animazione'},
      ],
    },
    {
      key:'status', title:'Stato', multi:true,
      options: uniqueSorted(ITEMS.map(i=>i.status)).map(v=>({value:v, label:STATUS_LABEL[v]||v})),
    },
    {
      key:'phase', title:'Fase MCU', multi:true,
      options: uniqueSorted(ITEMS.map(i=>i.phase)).map(v=>({value:v, label:'Fase '+v})),
    },
    {
      key:'franchise', title:'Franchise', multi:true, scroll:true,
      options: [...countBy(i=>i.franchise).entries()]
        .sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]))
        .map(([v,n])=>({value:v, label:v, count:n})),
    },
    {
      key:'character', title:'Personaggi', multi:true, scroll:true,
      options: [...countBy(i=>i.characters).entries()]
        .sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]))
        .map(([v,n])=>({value:v, label:v, count:n})),
    },
  ];

  const years = ITEMS.map(i=>i.year);
  const minY = Math.min(...years), maxY = Math.max(...years);

  panel.innerHTML = groups.map(g=>`
    <section class="fgroup" data-group="${g.key}">
      <h3 class="fgroup-title">${g.title}</h3>
      <div class="fgroup-opts ${g.scroll?'is-scroll':''}">
        ${g.options.map(o=>`
          <button class="fchip" data-key="${g.key}" data-value="${o.value}" data-multi="${g.multi}">
            ${o.label}${o.count?`<span class="fchip-n">${o.count}</span>`:''}
          </button>`).join('')}
      </div>
    </section>`).join('') + `
    <section class="fgroup">
      <h3 class="fgroup-title">Anno <span class="fgroup-hint" id="yearHint">${minY}–${maxY}</span></h3>
      <div class="year-range">
        <input type="range" id="yearMin" min="${minY}" max="${maxY}" value="${minY}" step="1" aria-label="Anno minimo">
        <input type="range" id="yearMax" min="${minY}" max="${maxY}" value="${maxY}" step="1" aria-label="Anno massimo">
      </div>
    </section>`;

  // selezione singola/multipla
  panel.querySelectorAll('.fchip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const key = chip.dataset.key;
      const multi = chip.dataset.multi === 'true';
      let value = chip.dataset.value;
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

  // range anni
  const yMin = document.getElementById('yearMin');
  const yMax = document.getElementById('yearMax');
  const onYear = ()=>{
    let a = Number(yMin.value), b = Number(yMax.value);
    if(a > b){ [a,b] = [b,a]; }
    filters.yearMin = (a === minY) ? null : a;
    filters.yearMax = (b === maxY) ? null : b;
    document.getElementById('yearHint').textContent = `${a}–${b}`;
    render();
  };
  yMin.addEventListener('input', onYear);
  yMax.addEventListener('input', onYear);
}

/* riallinea lo stato visivo dei chip a `filters` */
function syncFilterUI(){
  document.querySelectorAll('.fchip').forEach(chip=>{
    const key = chip.dataset.key;
    const multi = chip.dataset.multi === 'true';
    let value = chip.dataset.value;
    if(key === 'phase') value = Number(value);
    const on = multi ? filters[key].includes(value) : filters[key] === value;
    chip.classList.toggle('active', on);
  });
  document.querySelectorAll('[data-filter-watch]').forEach(c=>{
    c.classList.toggle('active', filters.watch === c.dataset.filterWatch);
  });
  const ess = document.getElementById('chipEssential');
  if(ess) ess.classList.toggle('active', filters.essentialOnly);

  const si = document.getElementById('searchInput');
  if(si && si.value !== filters.query) si.value = filters.query;

  const yMin = document.getElementById('yearMin');
  const yMax = document.getElementById('yearMax');
  if(yMin && yMax){
    const lo = filters.yearMin ?? Number(yMin.min);
    const hi = filters.yearMax ?? Number(yMax.max);
    yMin.value = lo; yMax.value = hi;
    document.getElementById('yearHint').textContent = `${lo}–${hi}`;
  }
}

/* --- ricerca (con debounce) --- */
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e)=>{
  const val = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ filters.query = val; render(); }, 130);
});

document.getElementById('sortSelect').addEventListener('change', (e)=>{
  sortMode = e.target.value;
  render();
});

/* --- chip rapidi sempre visibili --- */
document.querySelectorAll('[data-filter-watch]').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    const v = chip.dataset.filterWatch;
    filters.watch = (filters.watch === v) ? 'all' : v;
    syncFilterUI();
    render();
  });
});
document.getElementById('chipEssential').addEventListener('click', ()=>{
  filters.essentialOnly = !filters.essentialOnly;
  syncFilterUI();
  render();
});

/* --- apertura/chiusura pannello filtri --- */
const filterPanelWrap = document.getElementById('filterPanelWrap');
function openFilters(){
  filterPanelWrap.classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeFilters(){
  filterPanelWrap.classList.remove('open');
  document.body.classList.remove('no-scroll');
}
document.getElementById('filterToggle').addEventListener('click', ()=>{
  filterPanelWrap.classList.contains('open') ? closeFilters() : openFilters();
});
document.getElementById('filterCloseBtn').addEventListener('click', closeFilters);
filterPanelWrap.addEventListener('click', (e)=>{ if(e.target === filterPanelWrap) closeFilters(); });
document.getElementById('filterResetBtn').addEventListener('click', ()=>{
  resetFilters();
  syncFilterUI();
  render();
  showToast('Filtri azzerati.');
});
document.getElementById('filterApplyBtn').addEventListener('click', closeFilters);

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('Vuoi azzerare tutti i titoli segnati come visti o saltati? Il backup JSON già esportato non viene toccato.')){
    state.status = {};
    saveState();
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
      render();
      showToast(`Backup importato: ${count} titoli ripristinati.`);
    }catch(err){
      showToast('File non valido, impossibile importare.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});
