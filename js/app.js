/* ==========================================================
   AVVIO
   ========================================================== */
async function boot(){
  loadState();
  buildSearchIndex();
  buildCards();
  buildFilterPanel();
  syncFilterUI();
  render();

  const showIntro = shouldShowIntro();
  if(!showIntro){
    dismissIntroImmediately();
  }else{
    const p = introVideo.play();
    if(p && p.catch) p.catch(()=> closeIntro());
  }

  // le locandine sono già negli attributi src delle card: qui si
  // aspetta solo che i file arrivino, per mostrare l'avanzamento
  setIntroProgress(4, 'Caricamento locandine…');
  await preloadPosters(ITEMS, (done, total)=>{
    setIntroProgress(4 + (done/total)*96, `Locandine ${done}/${total}`);
  });
  setIntroProgress(100, 'Pronto');

  updateModalStatus();
}

boot();
