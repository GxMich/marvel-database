/* ==========================================================
   STATE: stato visione (todo | watched | skipped)
   ========================================================== */
const LS_KEY = 'marvelWatchlistState_v1';
let state = { status:{} };

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed.status){
        state = parsed;
      }else if(parsed.watched){
        // migrazione dal vecchio formato (solo visto/non visto)
        state = { status:{} };
        Object.keys(parsed.watched).forEach(id=>{ state.status[id] = 'watched'; });
      }
    }
  }catch(e){ state = { status:{} }; }
  if(!state.status) state.status = {};
}
function saveState(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function getStatus(id){ return state.status[id] || 'todo'; }
function setStatus(id, target){
  const current = getStatus(id);
  if(current === target) delete state.status[id];
  else state.status[id] = target;
  saveState();
}

