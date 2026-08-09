/* ==========================================================
   MODALE INFO, TOAST, TORNA-SU, ICONE DEI CONTROLLI
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
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('modalTotalNum', ITEMS.length);
  set('modalMoviesNum', ITEMS.filter(i=>i.type==='movie'||i.type==='animated-movie'||i.type==='tv-movie').length);
  set('modalSeriesNum', ITEMS.filter(i=>i.type==='series'||i.type==='animated-series').length);
  set('modalUniverseNum', new Set(ITEMS.map(i=>i.universe)).size);
}

document.getElementById('settingsBtn').addEventListener('click', openModal);
document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e)=>{ if(e.target===modalBackdrop) closeModal(); });
document.addEventListener('keydown', (e)=>{
  if(e.key!=='Escape') return;
  closeModal();
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

/* ---------- torna su ---------- */
const scrollBtn = document.getElementById('scrollTopBtn');
const topbarEl  = document.getElementById('topbar');
let scrollTicking = false;
window.addEventListener('scroll', ()=>{
  if(scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(()=>{
    const y = window.scrollY;
    scrollBtn.classList.toggle('show', y > 600);
    // il vetro della barra si fa più denso appena qualcosa le passa sotto
    if(topbarEl) topbarEl.classList.toggle('is-stuck', y > 8);
    scrollTicking = false;
  });
}, {passive:true});
scrollBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

/* ---------- iniezione icone ---------- */
const lbl = (long, short) => `<span class="lbl-long">${long}</span><span class="lbl-short">${short}</span>`;
document.getElementById('sparkLeft').innerHTML     = ICONS.star;
document.getElementById('sparkRight').innerHTML    = ICONS.star;
document.getElementById('searchIconSlot').innerHTML= ICONS.search;
document.getElementById('sortIconSlot').innerHTML  = ICONS.sort;
document.getElementById('chevronSort').innerHTML   = ICONS.chevronDown;
/* Esporta/Importa vivono nel modale: lì c'è spazio per l'etichetta piena */
document.getElementById('exportBtn').innerHTML     = ICONS.download + ' Esporta JSON';
document.getElementById('importBtn').innerHTML     = ICONS.upload   + ' Importa JSON';
/* nella barra restano solo icone: su mobile il testo sparisce via CSS */
document.getElementById('settingsBtn').innerHTML   = ICONS.gear + lbl(' Info','');
document.getElementById('filterToggle').innerHTML  = ICONS.sliders + lbl(' Filtri','') +
  '<span class="filter-badge" id="filterCountBadge">0</span>';
document.getElementById('resetBtn').innerHTML      = ICONS.refresh + ' Azzera visti';
document.getElementById('scrollTopBtn').innerHTML  = ICONS.chevronUp;
document.getElementById('modalCloseBtn').innerHTML = ICONS.close;
document.getElementById('modalTitleIcon').innerHTML= ICONS.image;
document.getElementById('filterCloseBtn').innerHTML= ICONS.close;
document.getElementById('chipUnwatched').innerHTML = ICONS.box + ' Da vedere';
document.getElementById('chipWatched').innerHTML   = ICONS.checkSmall + ' Visti';
document.getElementById('chipSkippedFilter').innerHTML = ICONS.skipSmall + ' Saltati';
document.getElementById('chipEssential').innerHTML = ICONS.starSmall + ' Essenziali MCU';
document.getElementById('introSkipIcon').innerHTML = ICONS.skipSmall;
/* wrapped */
document.getElementById('wrapOpenBtn').innerHTML     = ICONS.sparkles + ' Crea la tua card';
document.getElementById('wrapCloseBtn').innerHTML    = ICONS.close;
document.getElementById('wrapTitleIcon').innerHTML   = ICONS.sparkles;
document.getElementById('wrapEmptyIcon').innerHTML   = ICONS.starSmall;
document.getElementById('wrapShareBtn').innerHTML    = ICONS.share + ' Condividi';
document.getElementById('wrapDownloadBtn').innerHTML = ICONS.download + ' Scarica PNG';
