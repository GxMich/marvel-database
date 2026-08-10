/* ==========================================================
   POSTER
   I percorsi delle locandine sono già dentro catalog.js (generati
   da tools/build-catalog.mjs), quindi all'avvio NON serve nessuna
   chiamata a TMDB: si costruisce direttamente l'URL immagine.
   Restano solo il precaricamento e il fade-in.
   ========================================================== */
const IMG_BASE = 'https://image.tmdb.org/t/p/';
const INTRO_PREF_LS = 'marvelShowIntro';

/* w342 basta per una card e pesa circa metà di w500 */
function posterUrl(item, size){
  if(!item.poster) return null;
  return IMG_BASE + (size || 'w342') + item.poster;
}

function applyPosterToCard(id, url){
  const card = grid.querySelector(`.card[data-id="${id}"]`);
  if(!card) return;
  const poster = card.querySelector('.poster');
  const img = card.querySelector('.poster-img');
  if(!img || !poster || img.dataset.done) return;
  img.dataset.done = '1';
  img.onload = ()=> poster.classList.add('loaded');
  img.src = url;
}

/* Precarica le immagini nella cache HTTP del browser.
   onProgress(fatte, totale) alimenta la barra dell'intro.

   crossOrigin='anonymous' nacque per le card condivisibili, che non
   ci sono più: servivano risposte leggibili per non contaminare il
   canvas. Il flag però resta, e non per inerzia — le cache (quella
   del browser e quella del service worker) confrontano per URL e non
   per modalità, quindi togliendolo le locandine già salvate in
   modalità CORS convivrebbero con nuove risposte opache per lo stesso
   indirizzo. Costa zero, perché TMDB manda `Access-Control-Allow-Origin: *`,
   ed evita di invalidare 184 immagini già sui dispositivi. */
function preloadPosters(items, onProgress){
  const urls = items.map(i=>posterUrl(i)).filter(Boolean);
  return new Promise(resolve=>{
    if(!urls.length){ resolve(); return; }
    let loaded = 0, idx = 0;
    const concurrency = Math.min(10, urls.length);
    const step = ()=>{
      loaded++;
      onProgress && onProgress(loaded, urls.length);
      if(loaded >= urls.length) resolve();
      else next();
    };
    const next = ()=>{
      if(idx >= urls.length) return;
      const url = urls[idx++];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = step;
      img.onerror = step;
      img.decoding = 'async';
      img.src = url;
    };
    for(let i=0;i<concurrency;i++) next();
  });
}
