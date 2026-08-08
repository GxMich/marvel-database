/* ==========================================================
   INTRO VIDEO
   Il catalogo si carica dietro le quinte mentre il video scorre.
   ========================================================== */
const introEl    = document.getElementById('intro');
const introVideo = document.getElementById('introVideo');
const siteEl     = document.getElementById('site');
const introFill  = document.getElementById('introLoaderFill');
const introText  = document.getElementById('introLoaderText');
let introClosed  = false;

function shouldShowIntro(){ return localStorage.getItem(INTRO_PREF_LS) !== '0'; }

function closeIntro(){
  if(introClosed) return;
  introClosed = true;
  introEl.classList.add('hide');
  siteEl.classList.add('reveal');
  try{ introVideo.pause(); }catch(e){}
  // libera memoria: su mobile tenere un mp4 da 8 MB in RAM è spreco
  setTimeout(()=> introEl.remove(), 900);
}

function dismissIntroImmediately(){
  introClosed = true;
  introEl.remove();
  siteEl.classList.add('reveal');
}

function setIntroProgress(pct, label){
  if(!introFill || introClosed) return;
  introFill.style.width = Math.min(100, Math.round(pct)) + '%';
  if(label && introText) introText.textContent = label;
}

document.getElementById('introSkip').addEventListener('click', closeIntro);
introVideo.addEventListener('ended', closeIntro);
// se il video non parte (autoplay bloccato, file mancante) non si resta bloccati
introVideo.addEventListener('error', closeIntro);
setTimeout(()=>{ if(!introClosed && introVideo.readyState === 0) closeIntro(); }, 2500);
// rete di sicurezza: l'intro non dura mai più di 15s
setTimeout(closeIntro, 15000);
