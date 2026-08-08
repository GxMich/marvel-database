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
let scrollTicking = false;
window.addEventListener('scroll', ()=>{
  if(scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(()=>{
    scrollBtn.classList.toggle('show', window.scrollY > 600);
    scrollTicking = false;
  });
}, {passive:true});
scrollBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

/* ---------- iniezione icone ---------- */
const lbl = (long, short) => `<span class="lbl-long">${long}</span><span class="lbl-short">${short}</span>`;
document.getElementById('sparkLeft').innerHTML     = ICONS.star;
document.getElementById('sparkRight').innerHTML    = ICONS.star;
document.getElementById('searchIconSlot').innerHTML= ICONS.search;
document.getElementById('chevronSort').innerHTML   = ICONS.chevronDown;
document.getElementById('exportBtn').innerHTML     = ICONS.download + lbl(' Esporta','&nbsp;Esporta');
document.getElementById('importBtn').innerHTML     = ICONS.upload   + lbl(' Importa','&nbsp;Importa');
document.getElementById('settingsBtn').innerHTML   = ICONS.gear     + lbl(' Info','&nbsp;Info');
document.getElementById('filterToggle').innerHTML  = ICONS.sliders + ' Filtri <span class="filter-badge" id="filterCountBadge">0</span>';
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
