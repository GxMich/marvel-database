/* ==========================================================
   FILTRI, RICERCA, ORDINAMENTO E RENDERING
   ========================================================== */

const ITEMS = CATALOG;

/* Indice di ricerca: una stringa per titolo che contiene tutto ciò
   su cui si può cercare (titolo, personaggi, franchise, universo,
   anno, generi). Costruito una volta sola. */
const searchIndex = new Map();
function buildSearchIndex(){
  ITEMS.forEach(it=>{
    searchIndex.set(it.id, normalizeText([
      it.title,
      it.originalTitle,
      it.q,
      it.franchise.join(' '),
      it.characters.join(' '),
      it.genres.join(' '),
      it.universe,
      it.year,
      it.actualYear,
      TYPE_LABEL[it.type] || '',
      it.phase ? 'fase ' + it.phase + ' phase ' + it.phase : '',
      it.saga || '',
    ].filter(Boolean).join(' ')));
  });
}

/* "X-Men" e "xmen" devono trovarsi a vicenda: si toglie tutto
   ciò che non è lettera o cifra. */
function normalizeText(s){
  return String(s).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}
function squash(s){ return normalizeText(s).replace(/ /g,''); }

const filters = {
  query:'',
  watch:'all',          // all | watched | unwatched | skipped
  type:[],              // movie, series, animated-movie, ...
  universe:[],
  franchise:[],
  character:[],
  medium:'all',         // all | live-action | animation
  status:[],
  phase:[],
  yearMin:null,
  yearMax:null,
  essentialOnly:false,
};
let sortMode = 'chrono';

function activeFilterCount(){
  let n = 0;
  ['type','universe','franchise','character','status','phase'].forEach(k=>{ n += filters[k].length; });
  if(filters.medium !== 'all') n++;
  if(filters.watch !== 'all') n++;
  if(filters.essentialOnly) n++;
  if(filters.yearMin !== null || filters.yearMax !== null) n++;
  return n;
}

function resetFilters(){
  filters.query=''; filters.watch='all'; filters.medium='all';
  filters.type=[]; filters.universe=[]; filters.franchise=[];
  filters.character=[]; filters.status=[]; filters.phase=[];
  filters.yearMin=null; filters.yearMax=null; filters.essentialOnly=false;
}

/* La ricerca accetta parole parziali e ignora punteggiatura:
   "spider" trova Spider-Man, "xmen" trova X-Men, "2019" l'anno. */
function matchesQuery(it, rawQuery){
  if(!rawQuery) return true;
  const hay = searchIndex.get(it.id) || '';
  const haySquashed = hay.replace(/ /g,'');
  const terms = normalizeText(rawQuery).split(' ').filter(Boolean);
  return terms.every(term=>
    hay.includes(term) || haySquashed.includes(term.replace(/ /g,''))
  );
}

function applyFiltersSort(){
  const q = filters.query;
  let list = ITEMS.filter(it=>{
    const st = getStatus(it.id);
    if(filters.watch==='watched'   && st!=='watched') return false;
    if(filters.watch==='unwatched' && st!=='todo')    return false;
    if(filters.watch==='skipped'   && st!=='skipped') return false;

    if(filters.type.length      && !filters.type.includes(it.type)) return false;
    if(filters.universe.length  && !filters.universe.includes(it.universe)) return false;
    if(filters.franchise.length && !it.franchise.some(f=>filters.franchise.includes(f))) return false;
    if(filters.character.length && !it.characters.some(c=>filters.character.includes(c))) return false;
    if(filters.status.length    && !filters.status.includes(it.status)) return false;
    if(filters.phase.length     && !filters.phase.includes(it.phase)) return false;
    if(filters.medium!=='all'   && it.medium!==filters.medium) return false;
    if(filters.essentialOnly    && !it.essential) return false;
    if(filters.yearMin!==null   && it.year < filters.yearMin) return false;
    if(filters.yearMax!==null   && it.year > filters.yearMax) return false;

    if(q && !matchesQuery(it, q)) return false;
    return true;
  });

  const byYear = (a,b)=> a.year-b.year || a.title.localeCompare(b.title);
  if(sortMode==='title')          list.sort((a,b)=>a.title.localeCompare(b.title));
  else if(sortMode==='year-desc') list.sort((a,b)=> b.year-a.year || a.title.localeCompare(b.title));
  else if(sortMode==='year-asc')  list.sort(byYear);
  else if(sortMode==='rating')    list.sort((a,b)=> (b.rating||0)-(a.rating||0));
  else if(sortMode==='story'){
    // i non-MCU non hanno un posto nella timeline: vanno in coda, per anno
    list.sort((a,b)=>{
      const ao=a.chronoOrder, bo=b.chronoOrder;
      if(ao!==null && bo!==null) return ao-bo;
      if(ao!==null) return -1;
      if(bo!==null) return 1;
      return byYear(a,b);
    });
  }
  else if(sortMode==='watched'){
    const rank = s => s==='todo' ? 0 : (s==='watched' ? 1 : 2);
    list.sort((a,b)=> rank(getStatus(a.id))-rank(getStatus(b.id)) || byYear(a,b));
  }
  else list.sort(byYear); // chrono = per anno di uscita

  return list;
}

/* ==========================================================
   CARD
   Gerarchia voluta: poster > titolo > anno/tipo > resto.
   ========================================================== */
const grid = document.getElementById('grid');
const cardNodes = new Map();
let emptyStateEl = null;

function cardHTML(it, i){
  const st = styleFor(it);
  const status = getStatus(it.id);
  const url = posterUrl(it);
  const typeLabel = TYPE_LABEL[it.type] || it.type;
  const isAnim = it.medium === 'animation';
  const rating = it.rating ? it.rating.toFixed(1) : null;
  const seasonTag = it.season ? ` · S${it.season}` : '';

  /* Le prime locandine sono quelle che l'utente vede subito: vanno
     scaricate con priorità, non pigramente, perché sono l'LCP.
     width/height dichiarati riservano lo spazio ed evitano il CLS. */
  const eager = i < 8;
  const imgAttrs = [
    url ? `src="${url}" data-done="1"` : '',
    // vedi posters.js: senza CORS il canvas delle card condivisibili si contamina
    'crossorigin="anonymous"',
    'width="342" height="513"',
    eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"',
    'decoding="async"',
  ].filter(Boolean).join(' ');

  return `
  <article class="card ${status==='watched'?'watched':''} ${status==='skipped'?'skipped':''}"
           data-id="${it.id}" style="--i:${i}" tabindex="0" role="button"
           aria-pressed="${status==='watched'}" aria-label="${escapeAttr(it.title)}, segna come visto">
    <div class="poster" style="background:linear-gradient(160deg, ${st.from}, ${st.to});">
      <img class="poster-img" ${imgAttrs} alt="">
      <div class="sheen"></div>
      <span class="icon">${st.icon}</span>

      <div class="badge-topleft">
        <span class="badge badge-type ${isAnim?'is-anim':''}">${typeLabel}</span>
        ${it.status==='upcoming' ? `<span class="badge badge-upcoming">In arrivo</span>` : ''}
      </div>
      ${rating ? `<div class="badge-topright"><span class="badge badge-rating">${ICONS.starSmall}${rating}</span></div>` : ''}

      <div class="poster-title">${escapeHtml(it.title)}</div>
      <div class="status-actions">
        <div class="status-btn skip ${status==='skipped'?'active':''}" title="Salta">${ICONS.skip}</div>
        <div class="status-btn watch ${status==='watched'?'active':''}" title="Segna come visto">${ICONS.check}</div>
      </div>
    </div>

    <div class="card-body">
      <div class="card-meta">
        <span class="card-year">${it.year}${seasonTag}</span>
        <span class="card-universe">${UNIVERSE_SHORT[it.universe] || it.universe}</span>
      </div>
      <div class="card-franchise">${escapeHtml(it.franchise[0] || '')}</div>
    </div>
  </article>`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s){ return escapeHtml(s); }

/* Le card si costruiscono una volta sola: filtri e ordinamenti poi
   agiscono su classi CSS e proprietà `order`, senza ricostruire l'HTML. */
/* Le 184 card si costruiscono dentro un <template>, quindi fuori dal
   documento: indicizzazione e aggancio degli eventi non costano alcun
   ricalcolo. L'inserimento avviene una volta sola con replaceChildren,
   che nello stesso frame rimuove gli skeleton e mette le card. */
function buildCards(){
  const tpl = document.createElement('template');
  tpl.innerHTML = ITEMS.map((it, i) => cardHTML(it, i)).join('');
  const fragment = tpl.content;

  // lo stato vuoto viaggia con le card, sempre fuori dal documento
  emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'empty-state';
  emptyStateEl.innerHTML = `${ICONS.search}<p>Nessun titolo trovato.</p>` +
    `<button class="btn btn-ghost" id="emptyResetBtn">Azzera i filtri</button>`;
  emptyStateEl.style.display = 'none';
  fragment.appendChild(emptyStateEl);

  cardNodes.clear();
  for(const el of fragment.querySelectorAll('.card')){
    cardNodes.set(el.dataset.id, el);
  }

  for(const img of fragment.querySelectorAll('.poster-img')){
    if(!img.getAttribute('src')) continue;
    const poster = img.closest('.poster');
    // il poster parte trasparente: senza la classe .loaded resterebbe
    // invisibile sopra il gradiente di riserva
    if(img.complete && img.naturalWidth > 0){
      poster.classList.add('loaded');
    }else{
      img.addEventListener('load',  () => poster.classList.add('loaded'), {once:true});
      img.addEventListener('error', () => img.removeAttribute('src'),      {once:true});
    }
  }

  grid.replaceChildren(fragment);   // unico contatto con il DOM

  emptyStateEl.querySelector('#emptyResetBtn').addEventListener('click', () => {
    resetFilters();
    syncFilterUI();
    render();
  });
}

function render(){
  const list = applyFiltersSort();
  const visible = new Set(list.map(it=>it.id));

  list.forEach((it,i)=>{
    const el = cardNodes.get(it.id);
    if(el) el.style.order = i;
  });
  cardNodes.forEach((el,id)=> el.classList.toggle('is-hidden', !visible.has(id)));

  if(emptyStateEl) emptyStateEl.style.display = list.length ? 'none' : '';
  updateResultCount(list.length);
  updateStats();
}

function updateResultCount(n){
  const el = document.getElementById('resultCount');
  if(el) el.textContent = n === ITEMS.length ? `${n} titoli` : `${n} risultati`;
  const badge = document.getElementById('filterCountBadge');
  if(badge){
    const c = activeFilterCount();
    badge.textContent = c;
    badge.classList.toggle('show', c > 0);
  }
}

function updateStats(){
  const total = ITEMS.length;
  const watched = ITEMS.filter(i=>getStatus(i.id)==='watched').length;
  const skipped = ITEMS.filter(i=>getStatus(i.id)==='skipped').length;
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('statTotal', total);
  set('statWatched', watched);
  set('statSkipped', skipped);
  set('statRemaining', total-watched-skipped);
  set('statMovies', ITEMS.filter(i=>i.type==='movie'||i.type==='animated-movie'||i.type==='tv-movie').length);
  set('statSeries', ITEMS.filter(i=>i.type==='series'||i.type==='animated-series').length);

  const pct = total ? Math.round((watched/total)*100) : 0;
  const fill = document.getElementById('progressFill');
  if(fill) fill.style.width = pct+'%';
  set('progressPct', pct+'%');
  const track = document.getElementById('progressTrack');
  if(track) track.classList.toggle('full', pct===100);
}

/* ==========================================================
   INTERAZIONE SULLE CARD
   ========================================================== */
function applyStatusChange(card, target){
  const id = card.dataset.id;
  setStatus(id, target);
  const status = getStatus(id);
  card.classList.toggle('watched', status==='watched');
  card.classList.toggle('skipped', status==='skipped');
  card.setAttribute('aria-pressed', status==='watched');
  const watchBtn = card.querySelector('.status-btn.watch');
  const skipBtn  = card.querySelector('.status-btn.skip');
  watchBtn.classList.toggle('active', status==='watched');
  skipBtn.classList.toggle('active', status==='skipped');
  const active = status==='watched' ? watchBtn : (status==='skipped' ? skipBtn : null);
  if(active && !prefersReducedMotion()){
    active.animate(
      [{transform:'scale(1)'},{transform:'scale(1.35)'},{transform:'scale(1)'}],
      {duration:300, easing:'cubic-bezier(.34,1.56,.64,1)'}
    );
  }
  updateStats();
  if(sortMode==='watched' || filters.watch!=='all') setTimeout(render, 260);
}

function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

grid.addEventListener('click', (e)=>{
  const card = e.target.closest('.card');
  if(!card) return;
  const btn = e.target.closest('.status-btn');
  applyStatusChange(card, btn && btn.classList.contains('skip') ? 'skipped' : 'watched');
});
grid.addEventListener('keydown', (e)=>{
  if(e.key!=='Enter' && e.key!==' ') return;
  const card = e.target.closest('.card');
  if(!card) return;
  e.preventDefault();
  applyStatusChange(card, 'watched');
});
