/* ==========================================================
   AVVIO
   Sequenza: stato salvato → indice di ricerca → DOM → intro →
   precaricamento locandine → service worker.
   ========================================================== */

async function boot(){
  // 1. dati e struttura (tutto sincrono e locale: nessuna rete)
  loadState();
  buildSearchIndex();
  buildCards();
  buildFilterPanel();
  syncFilterUI();
  render();

  // 2. intro: parte subito, il resto continua dietro le quinte
  const showIntro = shouldShowIntro();
  if(!showIntro){
    dismissIntroImmediately();
  }else{
    // iOS consente l'autoplay solo se muted+playsinline; se il browser
    // rifiuta comunque, l'intro si chiude invece di restare bloccata
    const played = introVideo.play();
    if(played && played.catch) played.catch(() => closeIntro());
  }

  // 3. locandine: gli URL sono già negli attributi src, qui si
  //    aspettano solo i file per far avanzare la barra
  setIntroProgress(4);
  await preloadPosters(ITEMS, (done, total) => setIntroProgress(4 + (done / total) * 96));
  setIntroProgress(100);

  updateModalStatus();

  // 4. service worker: solo ora, a interfaccia già interattiva,
  //    per non contendere banda al primo caricamento
  registerServiceWorker();
}

/* Il service worker richiede http(s): aprendo il file con doppio click
   (protocollo file://) non è disponibile e il sito funziona comunque. */
function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  if(!location.protocol.startsWith('http')) return;

  navigator.serviceWorker.register('sw.js').catch(err => {
    console.warn('[app] service worker non registrato:', err.message);
  });
}

boot();
