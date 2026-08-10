/* ==========================================================
   INFORMATIVE E CONSENSO
   L'app non usa cookie di profilazione né analytics: l'unico
   dato salvato è la tua lista, in localStorage, su questo
   dispositivo. Il banner serve a dichiararlo, non a chiedere
   un consenso che per l'archiviazione tecnica non è dovuto.
   ========================================================== */
const CONSENT_LS = 'marvelStorageNotice';

const consentBanner = document.getElementById('consentBanner');
const privacyDialog = document.getElementById('privacyDialog');
const termsDialog   = document.getElementById('termsDialog');

function noticeAcknowledged(){
  try{ return localStorage.getItem(CONSENT_LS) === '1'; }
  catch(e){ return true; }   // se localStorage è bloccato non ha senso insistere
}

function acknowledgeNotice(){
  try{ localStorage.setItem(CONSENT_LS, '1'); }catch(e){}
  consentBanner.classList.remove('show');
  // via dal DOM a transizione finita
  setTimeout(() => consentBanner.remove(), 500);
}

/* Il banner era stato disattivato per capire se fosse lui a causare
   l'overflow orizzontale su iPhone. Non era lui: il colpevole era una
   decorazione della testata larga 120vw, poi rimossa. Il test è quindi
   chiuso e l'informativa torna al suo posto. */
function maybeShowNotice(){
  if(!consentBanner || noticeAcknowledged()) {
    if(consentBanner) consentBanner.remove();
    return;
  }
  // compare dopo che l'interfaccia si è posata, per non competere
  // con l'animazione d'ingresso della pagina
  setTimeout(() => consentBanner.classList.add('show'), 900);
}

/* ---------- dialoghi nativi ---------- */
function openDialog(dlg){
  if(!dlg) return;
  dlg.showModal();
  document.body.classList.add('no-scroll');
}
function closeDialog(dlg){
  if(!dlg) return;
  dlg.classList.add('closing');
  // si attende la transizione di uscita prima di chiudere davvero
  setTimeout(() => {
    dlg.classList.remove('closing');
    dlg.close();
    document.body.classList.remove('no-scroll');
  }, 220);
}

document.querySelectorAll('[data-open-dialog]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    openDialog(document.getElementById(el.dataset.openDialog));
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(el => {
  el.addEventListener('click', () => closeDialog(el.closest('dialog')));
});

/* click fuori dal riquadro = chiusura (il target è il dialog stesso
   solo quando si colpisce l'area di sfondo) */
[privacyDialog, termsDialog].forEach(dlg => {
  if(!dlg) return;
  dlg.addEventListener('click', (e) => { if(e.target === dlg) closeDialog(dlg); });
  // Esc: si intercetta per far girare l'animazione di uscita
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
});

const consentAccept = document.getElementById('consentAccept');
if(consentAccept) consentAccept.addEventListener('click', acknowledgeNotice);

maybeShowNotice();
