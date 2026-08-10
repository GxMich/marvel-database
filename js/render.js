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

const SORT_LABEL = {
  chrono:     'Per anno di uscita',
  story:      'In ordine narrativo',
  rating:     'Dal voto più alto',
  title:      'In ordine alfabetico',
  'year-desc':'Dai più recenti',
  watched:    'Per stato di visione',
};

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
   La locandina e basta: sotto, titolo e una riga di metadati.
   Anno, durata, voto e i pulsanti arrivano al passaggio del
   mouse, dentro il velo, senza occupare spazio a riposo.
   ========================================================== */
const grid = document.getElementById('grid');
const cardNodes = new Map();
let emptyStateEl = null;

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* durata in ore e minuti; per le serie è quella di un episodio */
function formatRuntime(min){
  if(!min) return null;
  if(min < 60) return min + ' min';
  return Math.floor(min/60) + 'h ' + String(min%60).padStart(2,'0');
}

function cardHTML(it, i){
  const st = styleFor(it);
  const status = getStatus(it.id);
  const url = posterUrl(it);
  const isSeries = it.type==='series' || it.type==='animated-series';
  const rating = it.rating ? it.rating.toFixed(1) : null;
  const runtime = formatRuntime(it.runtime);
  const sub = isSeries
    ? [it.episodes ? it.episodes + ' ep' : null, runtime].filter(Boolean).join(' · ')
    : runtime;

  /* Le prime locandine sono quelle che l'utente vede subito: vanno
     scaricate con priorità, non pigramente, perché sono l'LCP.
     width/height dichiarati riservano lo spazio ed evitano il CLS. */
  const eager = i < 8;
  const imgAttrs = [
    url ? `src="${url}" data-done="1"` : '',
    // vedi posters.js per il perché del CORS
    'crossorigin="anonymous"',
    'width="342" height="513"',
    eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"',
    'decoding="async"',
  ].filter(Boolean).join(' ');

  const tag = it.status==='upcoming'
    ? '<span class="tag soon">In arrivo</span>'
    : (it.essential ? '<span class="tag ess">Essenziale</span>' : '');

  /* Il pulsante che apre la scheda copre tutta la locandina ma è un
     elemento a sé, sotto le azioni: annidare tre <button> dentro un
     contenitore con role="button" sarebbe ARIA non valido e la
     tastiera non saprebbe cosa attivare. */
  return `
  <article class="card ${status==='watched'?'watched':''} ${status==='skipped'?'skipped':''}" data-id="${it.id}">
    <div class="frame" style="background:linear-gradient(160deg, ${st.from}, ${st.to});">
      <img class="poster-img" ${imgAttrs} alt="">
      <span class="fallback" aria-hidden="true">${st.icon}</span>
      <button class="frame-btn" data-act="info" aria-label="${escapeHtml(it.title)}, ${it.year}. Apri la scheda"></button>
      <span class="idx" aria-hidden="true">N°${String(i+1).padStart(3,'0')}</span>
      <span class="pip" aria-hidden="true">${status==='watched'?ICONS.check:ICONS.minus}</span>
      ${tag}
      <div class="scrim" aria-hidden="true">
        <div class="st">${escapeHtml(it.title)}</div>
        <div class="sm">
          <span>${it.year}</span>
          ${sub ? `<span>${sub}</span>` : ''}
          ${rating ? `<b>${ICONS.starSmall}${rating}</b>` : ''}
        </div>
      </div>
      <div class="acts">
        <button class="act a-skip" data-act="skipped" aria-pressed="${status==='skipped'}" aria-label="Salta ${escapeHtml(it.title)}">${ICONS.minus}</button>
        <button class="act a-watch" data-act="watched" aria-pressed="${status==='watched'}" aria-label="Segna ${escapeHtml(it.title)} come visto">${ICONS.check}</button>
        <button class="act a-info" data-act="info" aria-label="Scheda di ${escapeHtml(it.title)}">${ICONS.info}</button>
      </div>
    </div>

    <div class="foot">
      <h3>${escapeHtml(it.title)}</h3>
      <div class="m">
        <span>${it.year}${it.season ? ' · S'+it.season : ''}</span>
        <span class="u">${UNIVERSE_SHORT[it.universe] || it.universe}</span>
        ${it.phase ? `<span class="u">F${it.phase}</span>` : ''}
        ${rating ? `<span class="r">${ICONS.starSmall}${rating}</span>` : ''}
      </div>
    </div>
  </article>`;
}

/* Le 184 card si costruiscono dentro un <template>, quindi fuori dal
   documento: indicizzazione e aggancio degli eventi non costano alcun
   ricalcolo. L'inserimento avviene una volta sola con replaceChildren,
   che nello stesso frame rimuove gli skeleton e mette le card.
   Filtri e ordinamenti poi agiscono su classi CSS e proprietà `order`,
   senza ricostruire l'HTML. */
function buildCards(){
  const tpl = document.createElement('template');
  tpl.innerHTML = ITEMS.map((it, i) => cardHTML(it, i)).join('');
  const fragment = tpl.content;

  // lo stato vuoto viaggia con le card, sempre fuori dal documento
  emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'empty-state';
  emptyStateEl.innerHTML = `${ICONS.search}<p>Nessun titolo trovato.</p>` +
    `<button class="btn" id="emptyResetBtn">Azzera i filtri</button>`;
  emptyStateEl.style.display = 'none';
  fragment.appendChild(emptyStateEl);

  cardNodes.clear();
  for(const el of fragment.querySelectorAll('.card')){
    cardNodes.set(el.dataset.id, el);
  }

  for(const img of fragment.querySelectorAll('.poster-img')){
    if(!img.getAttribute('src')) continue;
    const frame = img.closest('.frame');
    // la locandina parte trasparente: senza la classe .loaded resterebbe
    // invisibile sopra il gradiente di riserva
    if(img.complete && img.naturalWidth > 0){
      frame.classList.add('loaded');
    }else{
      img.addEventListener('load',  () => frame.classList.add('loaded'), {once:true});
      img.addEventListener('error', () => img.removeAttribute('src'),    {once:true});
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

  const title = document.getElementById('gridTitle');
  if(title) title.textContent = SORT_LABEL[sortMode] || SORT_LABEL.chrono;
}

function updateResultCount(n){
  const el = document.getElementById('resultCount');
  if(el) el.textContent = n === ITEMS.length ? `${n} titoli` : `${n} di ${ITEMS.length} titoli`;
  const badge = document.getElementById('filterCountBadge');
  if(badge){
    const c = activeFilterCount();
    badge.textContent = c;
    badge.classList.toggle('hide', c === 0);
  }
}

function updateStats(){
  const total = ITEMS.length;
  const watched = ITEMS.filter(i=>getStatus(i.id)==='watched');
  const skipped = ITEMS.filter(i=>getStatus(i.id)==='skipped').length;
  // il monte ore è quello guardato davvero, non quello del catalogo:
  // è l'unico numero della testata che parla di te e non dell'archivio
  const minutes = watched.reduce((a,i)=> a + (i.totalMinutes || 0), 0);

  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('statTotal', total);
  set('statWatched', watched.length);
  set('statSkipped', skipped);
  set('statHours', Math.round(minutes/60).toLocaleString('it-IT'));

  const pct = total ? Math.round((watched.length/total)*100) : 0;
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

  const watchBtn = card.querySelector('.act.a-watch');
  const skipBtn  = card.querySelector('.act.a-skip');
  watchBtn.setAttribute('aria-pressed', status==='watched');
  skipBtn.setAttribute('aria-pressed', status==='skipped');
  card.querySelector('.pip').innerHTML = status==='watched' ? ICONS.check : ICONS.minus;

  const active = status==='watched' ? watchBtn : (status==='skipped' ? skipBtn : null);
  if(active && !prefersReducedMotion()){
    active.animate(
      [{transform:'scale(1)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],
      {duration:280, easing:'cubic-bezier(.34,1.56,.64,1)'}
    );
  }

  updateStats();
  // se l'ordinamento o il filtro dipendono dallo stato, la griglia va
  // ricomposta — ma dopo l'animazione, o la card sparirebbe a metà
  if(sortMode==='watched' || filters.watch!=='all') setTimeout(render, 260);
}

function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

grid.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const card = btn.closest('.card');
  if(!card) return;
  const act = btn.dataset.act;
  if(act === 'info') openSheet(card.dataset.id);
  else applyStatusChange(card, act);
});
