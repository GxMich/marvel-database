/* ==========================================================
   AVVIO
   Sequenza: stato salvato → indice di ricerca → DOM → intro →
   precaricamento locandine → schede → service worker.
   ========================================================== */

/* Lo sfondo della testata è una scelta editoriale, non un dato:
   serve al primo paint e i backdrop stanno in details.js, che a
   quel punto non è ancora stato caricato. Una costante evita di
   rimettere 184 percorsi nel catalogo per usarne uno. */
const HERO_BACKDROP = '/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg';   // Avengers: Endgame

function paintMasthead(){
  const bg = document.getElementById('mastBg');
  if(bg){
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.alt = '';
    img.src = IMG_BASE + 'w1280' + HERO_BACKDROP;
    bg.appendChild(img);
  }
  const range = document.getElementById('ovRange');
  if(range){
    const years = ITEMS.map(i=>i.year);
    range.textContent = `${Math.min(...years)} → ${Math.max(...years)}`;
  }
}

async function boot(){
  // 1. dati e struttura (tutto sincrono e locale: nessuna rete)
  loadState();
  buildSearchIndex();
  buildCards();
  buildFilterPanel();
  syncFilterUI();
  render();
  paintMasthead();

  // 2. intro: parte subito, il resto continua dietro le quinte
  if(!shouldShowIntro()){
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

  // 4. schede: solo ora, quando le locandine non contendono più la
  //    banda. Chi clicca prima se le trova già in arrivo.
  prefetchDetails();

  // 5. service worker: a interfaccia già interattiva, per non
  //    contendere banda al primo caricamento
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
