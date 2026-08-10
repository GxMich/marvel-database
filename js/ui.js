/* ==========================================================
   SCHEDA, MODALE INFO, TOAST, TORNA-SU, ICONE
   ========================================================== */

/* ==========================================================
   SCHEDA DEL TITOLO
   I dati vengono da js/data/details.js, che al primo click
   potrebbe non essere ancora arrivato: in quel caso il
   pannello si apre lo stesso e mostra un'attesa, invece di
   restare fermo senza spiegazioni finché il file non c'è.
   ========================================================== */
const sheet   = document.getElementById('sheet');
const sheetBg = document.getElementById('sheetBg');
let sheetId = null;
let sheetOpener = null;

function openSheet(id){
  const it = ITEMS.find(x=>x.id===id);
  if(!it) return;

  if(!sheet.classList.contains('open')){
    sheetOpener = document.activeElement;
    sheet.classList.add('open');
    sheetBg.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  sheetId = id;
  sheet.scrollTop = 0;

  if(detailsReady()){
    paintSheet(it);
  }else{
    sheet.innerHTML = `<div class="s-loading">${ICONS.spinner} Carico la scheda…</div>`;
    loadDetails()
      .then(()=>{ if(sheetId === id) paintSheet(it); })
      .catch(()=>{
        if(sheetId !== id) return;
        // senza i dettagli si mostra comunque quello che il catalogo sa
        paintSheet(it);
      });
  }
}

function closeSheet(){
  if(!sheet.classList.contains('open')) return;
  sheet.classList.remove('open');
  sheetBg.classList.remove('open');
  document.body.classList.remove('no-scroll');
  sheetId = null;
  // chi è arrivato qui con Tab deve ritrovarsi dov'era
  if(sheetOpener && document.contains(sheetOpener)) sheetOpener.focus({preventScroll:true});
}

function paintSheet(it){
  const d = getDetail(it.id) || {};
  const isSeries = it.type==='series' || it.type==='animated-series';
  const status = getStatus(it.id);
  const esc = escapeHtml;

  // per una serie conta chi l'ha creata, per un film chi l'ha diretto
  const crew = (d.creators && d.creators.length)
    ? { label:'Creata da', names:d.creators }
    : { label:'Regia',     names:d.directors || [] };

  const cast = (d.cast || []).slice(0, 8);
  const backdrop = d.backdrop ? IMG_BASE + 'w780' + d.backdrop : null;
  const logo = d.logo ? IMG_BASE + 'w300' + d.logo : null;

  const chip = (dt, dd)=> dd ? `<div><dt>${dt}</dt><dd>${dd}</dd></div>` : '';

  sheet.innerHTML = `
  <div class="sheet-hero">
    ${backdrop ? `<img class="bd" src="${backdrop}" crossorigin="anonymous" alt="" decoding="async">` : ''}
    ${logo ? `<img class="sheet-logo" src="${logo}" crossorigin="anonymous" alt="${esc(it.title)}" decoding="async">` : ''}
    <button class="sheet-close" id="sheetCloseBtn" aria-label="Chiudi">${ICONS.close}</button>
  </div>

  <div class="sheet-body">
    <div class="s-over">
      <span>${TYPE_LABEL[it.type] || it.type}</span><span class="sep"></span>
      <span>${it.year}${it.season ? ' · Stagione '+it.season : ''}</span><span class="sep"></span>
      <span>${UNIVERSE_SHORT[it.universe] || it.universe}</span>
      ${it.phase ? `<span class="sep"></span><span>Fase ${it.phase}</span>` : ''}
      ${it.essential ? `<span class="sep"></span><span class="ess">Essenziale</span>` : ''}
    </div>

    <h2 class="s-title">${esc(it.title)}</h2>
    ${it.originalTitle && it.originalTitle !== it.title ? `<p class="s-orig">${esc(it.originalTitle)}</p>` : ''}
    ${d.tagline ? `<p class="s-tag">“${esc(d.tagline)}”</p>` : ''}
    ${d.overview ? `<p class="s-plot">${esc(d.overview)}</p>` : ''}

    <div class="s-actions">
      <button class="pill ${status==='watched'?'solid':''}" data-sheet-act="watched">${ICONS.check} Visto</button>
      <button class="pill ${status==='skipped'?'muted':''}" data-sheet-act="skipped">${ICONS.minus} Salta</button>
      ${d.trailer ? `<a class="pill red" href="https://www.youtube.com/watch?v=${d.trailer.key}" target="_blank" rel="noopener">${ICONS.play} Trailer</a>` : ''}
    </div>

    <div class="s-sec">
      <h4>Scheda</h4>
      <dl class="spec">
        ${chip('Voto TMDB', it.rating ? `${it.rating.toFixed(1)} <span class="q">/ 10 · ${it.votes.toLocaleString('it-IT')} voti</span>` : null)}
        ${chip(isSeries ? 'Durata episodio' : 'Durata', formatRuntime(it.runtime))}
        ${isSeries ? chip('Episodi', it.episodes ? `${it.episodes}${it.seasons && !it.season ? ` <span class="q">in ${it.seasons} stagioni</span>` : ''}` : null) : ''}
        ${chip('Monte ore', it.totalMinutes ? `${Math.round(it.totalMinutes/60)}h` : null)}
        ${chip(crew.label, crew.names.length ? esc(crew.names.join(', ')) : null)}
        ${chip('Sceneggiatura', (d.writers && d.writers.length) ? esc(d.writers.join(', ')) : null)}
        ${chip('Stato', STATUS_LABEL[it.status] || it.status)}
        ${chip('Piattaforma', it.platform ? esc(it.platform) : null)}
        ${chip('Franchise', it.franchise.length ? esc(it.franchise.join(', ')) : null)}
      </dl>
    </div>

    ${cast.length ? `
    <div class="s-sec">
      <h4>Cast principale</h4>
      <div class="cast">
        ${cast.map(c=>`
          <figure>
            ${c.p
              ? `<img src="${IMG_BASE}w185${c.p}" crossorigin="anonymous" alt="${esc(c.n)}" loading="lazy" decoding="async">`
              : `<div class="ph" aria-hidden="true">${esc(c.n.charAt(0))}</div>`}
            <figcaption>${esc(c.n)}${c.c ? `<span class="ch">${esc(c.c)}</span>` : ''}</figcaption>
          </figure>`).join('')}
      </div>
    </div>` : ''}

    ${it.characters.length ? `
    <div class="s-sec">
      <h4>Personaggi</h4>
      <div class="chips">${it.characters.map(c=>`<span class="g">${esc(c)}</span>`).join('')}</div>
    </div>` : ''}

    ${it.genres.length ? `
    <div class="s-sec">
      <h4>Generi</h4>
      <div class="chips">${it.genres.map(g=>`<span class="g">${esc(g)}</span>`).join('')}</div>
    </div>` : ''}
  </div>`;

  document.getElementById('sheetCloseBtn').addEventListener('click', closeSheet);

  sheet.querySelectorAll('[data-sheet-act]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = cardNodes.get(it.id);
      if(card) applyStatusChange(card, btn.dataset.sheetAct);
      else { setStatus(it.id, btn.dataset.sheetAct); updateStats(); }
      paintSheet(it);   // i due pulsanti riflettono subito il nuovo stato
    });
  });
}

sheetBg.addEventListener('click', closeSheet);

/* La <figcaption> del cast contiene un <span> di blocco: il CSS lo
   tratta come riga a sé, quindi il markup resta valido. */

/* ==========================================================
   MODALE INFO E BACKUP
   ========================================================== */
const modalBackdrop = document.getElementById('modalBackdrop');
const introToggle = document.getElementById('introToggle');

function openModal(){
  introToggle.checked = shouldShowIntro();
  updateModalStatus();
  modalBackdrop.classList.add('show');
}
function closeModal(){ modalBackdrop.classList.remove('show'); }

function updateModalStatus(){
  const el = document.getElementById('modalStatus');
  if(!el) return;
  const universi = new Set(ITEMS.map(i=>i.universe)).size;
  const ore = Math.round(ITEMS.reduce((a,i)=> a + (i.totalMinutes||0), 0) / 60).toLocaleString('it-IT');
  el.textContent = `${ITEMS.length} titoli · ${universi} universi · ${ore} ore di visione`;
}

document.getElementById('settingsBtn').addEventListener('click', openModal);
document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e)=>{ if(e.target===modalBackdrop) closeModal(); });

/* Esc chiude una cosa sola, la più esterna: chiudere insieme scheda,
   filtri e modale a un solo tasto sorprenderebbe. */
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  if(modalBackdrop.classList.contains('show')){ closeModal(); return; }
  if(sheet.classList.contains('open')){ closeSheet(); return; }
  if(typeof closeFilters === 'function') closeFilters();
});

introToggle.addEventListener('change', ()=>{
  localStorage.setItem(INTRO_PREF_LS, introToggle.checked ? '1' : '0');
  showToast(introToggle.checked ? 'Intro attiva al prossimo avvio.' : 'Intro disattivata.');
});

/* ---------- toast ---------- */
let toastTimer;
function showToast(msg){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 3000);
}

/* ---------- torna su + vetro della barra ---------- */
const scrollBtn = document.getElementById('scrollTopBtn');
const commandEl = document.getElementById('command');
let scrollTicking = false;
window.addEventListener('scroll', ()=>{
  if(scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(()=>{
    const y = window.scrollY;
    scrollBtn.classList.toggle('show', y > 700);
    // il vetro si fa più denso appena qualcosa le passa sotto
    if(commandEl) commandEl.classList.toggle('is-stuck', y > 8);
    scrollTicking = false;
  });
}, {passive:true});
scrollBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

/* ---------- iniezione icone ---------- */
document.getElementById('searchIconSlot').innerHTML = ICONS.search;
document.getElementById('chevronSort').innerHTML    = ICONS.chevronDown;
document.getElementById('settingsBtn').innerHTML    = ICONS.gear;
document.getElementById('scrollTopBtn').innerHTML   = ICONS.chevronUp;
document.getElementById('modalCloseBtn').innerHTML  = ICONS.close;
document.getElementById('filterCloseBtn').innerHTML = ICONS.close;
document.getElementById('introSkipIcon').innerHTML  = ICONS.skipForward;
document.getElementById('exportBtn').innerHTML      = ICONS.download + ' Esporta JSON';
document.getElementById('importBtn').innerHTML      = ICONS.upload   + ' Importa JSON';
document.getElementById('resetBtn').innerHTML       = ICONS.refresh  + ' Azzera visti';
