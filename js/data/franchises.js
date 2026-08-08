/* ==========================================================
   FRANCHISE -> icona + gradiente, usati come copertina di
   riserva finché la locandina TMDB non è stata caricata.
   Le chiavi sono i nomi di franchise usati in catalog.js.
   ========================================================== */
const FRANCHISE_STYLE = {
  'Avengers':                {icon:'⭐', from:'#7f1d1d', to:'#0b0b0f'},
  'Spider-Man':              {icon:'🕷️', from:'#a8121a', to:'#1e3a8a'},
  'Spider-Verse':            {icon:'🕸️', from:'#7c3aed', to:'#a8121a'},
  'X-Men':                   {icon:'🧬', from:'#1e3a8a', to:'#f5b942'},
  'Wolverine':               {icon:'🗡️', from:'#f5b942', to:'#1e3a8a'},
  'Deadpool':                {icon:'🔴', from:'#a8121a', to:'#0b0b0f'},
  'Iron Man':                {icon:'🤖', from:'#8a1210', to:'#f5b942'},
  'Captain America':         {icon:'🛡️', from:'#1d4ed8', to:'#a8121a'},
  'Thor':                    {icon:'⚡', from:'#1e3a8a', to:'#f5b942'},
  'Hulk':                    {icon:'💚', from:'#1a5c1a', to:'#0b0b0f'},
  'Guardians of the Galaxy': {icon:'🌌', from:'#6d28d9', to:'#f97316'},
  'Ant-Man':                 {icon:'🐜', from:'#a8121a', to:'#0b0b0f'},
  'Doctor Strange':          {icon:'🔮', from:'#7c2d92', to:'#a8121a'},
  'Black Panther':           {icon:'🐾', from:'#0b0b0f', to:'#7c3aed'},
  'Captain Marvel':          {icon:'✨', from:'#1e3a8a', to:'#a8121a'},
  'Fantastic Four':          {icon:'🔷', from:'#2563eb', to:'#f97316'},
  'Blade':                   {icon:'🩸', from:'#1e1e1e', to:'#7f1d1d'},
  'Ghost Rider':             {icon:'🔥', from:'#7c2d12', to:'#0b0b0f'},
  'Daredevil':               {icon:'😈', from:'#7f1d1d', to:'#0b0b0f'},
  'Punisher':                {icon:'💀', from:'#1e1e1e', to:'#a8121a'},
  'Venom':                   {icon:'🖤', from:'#0b0b0f', to:'#1e1e1e'},
  'Eternals':                {icon:'🌟', from:'#0b0b0f', to:'#f5b942'},
  'Shang-Chi':               {icon:'🐉', from:'#a8121a', to:'#059669'},
  'Inhumans':                {icon:'👽', from:'#7c3aed', to:'#059669'},
  'Runaways':                {icon:'🏃', from:'#7c3aed', to:'#0b0b0f'},
  'Cloak & Dagger':          {icon:'🌗', from:'#0b0b0f', to:'#7c3aed'},
  'S.H.I.E.L.D.':            {icon:'🦅', from:'#1e3a8a', to:'#0b0b0f'},
  'Marvel Rising':           {icon:'💫', from:'#a8121a', to:'#059669'},
  'Defenders':               {icon:'🛡️', from:'#0b0b0f', to:'#a8121a'},
  'Jessica Jones':           {icon:'🥃', from:'#1e293b', to:'#7c3aed'},
  'Luke Cage':               {icon:'✊', from:'#f5b942', to:'#0b0b0f'},
  'Iron Fist':               {icon:'👊', from:'#059669', to:'#f5b942'},
  'Moon Knight':             {icon:'🌙', from:'#4b4b57', to:'#0b0b0f'},
  'Big Hero 6':              {icon:'🎈', from:'#dc2626', to:'#0891b2'},
  'Altri':                   {icon:'🎬', from:'#333340', to:'#0b0b0f'},
};

/* etichette leggibili per i tipi di contenuto */
const TYPE_LABEL = {
  'movie':           'Film',
  'series':          'Serie TV',
  'animated-movie':  'Film animato',
  'animated-series': 'Serie animata',
  'special':         'Special',
  'tv-movie':        'Film TV',
  'short':           'Corto',
};

const STATUS_LABEL = {
  'released':  'Uscito',
  'ongoing':   'In corso',
  'ended':     'Concluso',
  'upcoming':  'In arrivo',
  'cancelled': 'Cancellato',
};

const UNIVERSE_SHORT = {
  'MCU':                          'MCU',
  "Sony's Spider-Man Universe":   'Sony',
  'X-Men / Fox':                  'Fox',
  'Marvel Television / Netflix':  'Netflix',
  'Marvel Television':            'Marvel TV',
  'Marvel Animation':             'Animation',
  'Pre-MCU':                      'Pre-MCU',
  'Independent Marvel':           'Indie',
};

function styleFor(item){
  for(const f of item.franchise){
    if(FRANCHISE_STYLE[f]) return FRANCHISE_STYLE[f];
  }
  return FRANCHISE_STYLE['Altri'];
}
