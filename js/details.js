/* ==========================================================
   SCHEDE — caricamento a richiesta

   js/data/details.js pesa 269 KB: trama, cast, regia, trailer e
   logo di 184 titoli. Serve solo a chi apre una scheda, quindi
   non sta in index.html — verrebbe scaricato anche da chi si
   limita a scorrere la griglia, cioè quasi sempre.

   Si carica iniettando un <script>, non con fetch(): su file://
   fetch è bloccato dal CORS e il sito deve continuare ad aprirsi
   con un doppio click.
   ========================================================== */

/* deve restare allineato al ?v=N di index.html, o chi ha già
   visitato il sito riceverebbe le schede della versione vecchia */
const DETAILS_SRC = 'js/data/details.js?v=17';

let detailsPromise = null;

/* Attenzione: in uno script classico `const DETAILS = ...` crea un
   binding lessicale globale, NON una proprietà di window. Quindi
   `window.DETAILS` resta undefined e l'unico modo di sapere se il
   file è arrivato è `typeof` sull'identificatore nudo. */
function detailsReady(){
  return typeof DETAILS !== 'undefined';
}

function loadDetails(){
  if(detailsReady()) return Promise.resolve();
  if(detailsPromise) return detailsPromise;

  detailsPromise = new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = DETAILS_SRC;
    s.onload = ()=> resolve();
    s.onerror = ()=>{
      // azzerato: un secondo tentativo deve poter ripartire
      detailsPromise = null;
      reject(new Error('Schede non disponibili'));
    };
    document.head.appendChild(s);
  });
  return detailsPromise;
}

function getDetail(id){
  return detailsReady() ? (DETAILS[id] || null) : null;
}

/* Precaricamento in sottofondo, a interfaccia già interattiva.
   Serve all'offline: il service worker può mettere in cache solo
   ciò che è stato almeno chiesto una volta. Con requestIdleCallback
   parte quando il browser non ha di meglio da fare, quindi non
   toglie banda alle locandine. */
function prefetchDetails(){
  const go = ()=> loadDetails().catch(()=>{ /* riproverà al primo click */ });
  if('requestIdleCallback' in window) requestIdleCallback(go, {timeout:6000});
  else setTimeout(go, 3000);
}
