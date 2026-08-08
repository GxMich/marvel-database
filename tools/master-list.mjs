/* ============================================================
   MASTER LIST — la tassonomia curata a mano.
   Qui NON ci sono dati fattuali (rating, date, poster): quelli
   arrivano da TMDB in fase di generazione (build-catalog.mjs).
   Qui c'è solo la classificazione editoriale: universo, franchise,
   fase, personaggi, tipo di contenuto.

   Campi:
     q   titolo di ricerca su TMDB (inglese/originale)
     y   anno di riferimento per disambiguare la ricerca
     tv  true se è una serie (endpoint /search/tv)
     it  titolo italiano da mostrare (se diverso, altrimenti TMDB)
     ty  movie | series | animated-movie | animated-series | special | tv-movie | short
     u   universo
     f   franchise (uno o più)
     ph  fase MCU (solo per contenuti MCU)
     ch  personaggi principali
     s   stagione (per le serie con più stagioni tracciate separatamente)
     pl  dove vederlo
     e   essenziale per la trama principale MCU
     co  ordine narrativo interno (solo MCU)
     cl  etichetta temporale mostrata in card
   ============================================================ */

export const U = {
  MCU:      'MCU',
  SONY:     "Sony's Spider-Man Universe",
  FOX:      'X-Men / Fox',
  NETFLIX:  'Marvel Television / Netflix',
  MTV:      'Marvel Television',
  ANIM:     'Marvel Animation',
  PRE:      'Pre-MCU',
  INDIE:    'Independent Marvel',
};

export const MASTER = [

/* ==================== MCU — FASE 1 ==================== */
{q:"Iron Man", y:2008, ty:'movie', u:U.MCU, f:['Iron Man','Avengers'], ph:1, ch:['Iron Man'], pl:'Disney+', e:true, co:4,  cl:'2010'},
{q:"The Incredible Hulk", y:2008, ty:'movie', u:U.MCU, f:['Hulk','Avengers'], ph:1, ch:['Hulk'], pl:'Disney+', e:false, co:6, cl:'2011'},
{q:"Iron Man 2", y:2010, ty:'movie', u:U.MCU, f:['Iron Man','Avengers'], ph:1, ch:['Iron Man','Black Widow'], pl:'Disney+', e:false, co:5, cl:'2011'},
{q:"Thor", y:2011, ty:'movie', u:U.MCU, f:['Thor','Avengers'], ph:1, ch:['Thor','Loki'], pl:'Disney+', e:true, co:7, cl:'2011'},
{q:"Captain America: The First Avenger", y:2011, ty:'movie', u:U.MCU, f:['Captain America','Avengers'], ph:1, ch:['Captain America'], pl:'Disney+', e:true, co:2, cl:'1943'},
{q:"The Avengers", y:2012, ty:'movie', u:U.MCU, f:['Avengers'], ph:1, ch:['Iron Man','Captain America','Thor','Hulk','Black Widow','Hawkeye','Loki'], pl:'Disney+', e:true, co:8, cl:'2012'},

/* ==================== MCU — FASE 2 ==================== */
{q:"Iron Man 3", y:2013, ty:'movie', u:U.MCU, f:['Iron Man','Avengers'], ph:2, ch:['Iron Man'], pl:'Disney+', e:false, co:10, cl:'2013'},
{q:"Thor: The Dark World", y:2013, ty:'movie', u:U.MCU, f:['Thor','Avengers'], ph:2, ch:['Thor','Loki'], pl:'Disney+', e:false, co:9, cl:'2013'},
{q:"Captain America: The Winter Soldier", y:2014, ty:'movie', u:U.MCU, f:['Captain America','Avengers','S.H.I.E.L.D.'], ph:2, ch:['Captain America','Black Widow'], pl:'Disney+', e:true, co:12, cl:'2014'},
{q:"Guardians of the Galaxy", y:2014, ty:'movie', u:U.MCU, f:['Guardians of the Galaxy'], ph:2, ch:['Guardians of the Galaxy'], pl:'Disney+', e:true, co:13, cl:'2014'},
{q:"Avengers: Age of Ultron", y:2015, ty:'movie', u:U.MCU, f:['Avengers'], ph:2, ch:['Iron Man','Captain America','Thor','Hulk','Black Widow','Hawkeye','Scarlet Witch','Vision'], pl:'Disney+', e:true, co:15, cl:'2015'},
{q:"Ant-Man", y:2015, ty:'movie', u:U.MCU, f:['Ant-Man','Avengers'], ph:2, ch:['Ant-Man'], pl:'Disney+', e:true, co:16, cl:'2015'},

/* ==================== MCU — FASE 3 ==================== */
{q:"Captain America: Civil War", y:2016, ty:'movie', u:U.MCU, f:['Captain America','Avengers'], ph:3, ch:['Captain America','Iron Man','Black Panther','Spider-Man','Ant-Man'], pl:'Disney+', e:true, co:23, cl:'2016'},
{q:"Doctor Strange", y:2016, ty:'movie', u:U.MCU, f:['Doctor Strange'], ph:3, ch:['Doctor Strange'], pl:'Disney+', e:true, co:28, cl:'2016'},
{q:"Guardians of the Galaxy Vol. 2", y:2017, ty:'movie', u:U.MCU, f:['Guardians of the Galaxy'], ph:3, ch:['Guardians of the Galaxy'], pl:'Disney+', e:true, co:14, cl:'2014'},
{q:"Spider-Man: Homecoming", y:2017, ty:'movie', u:U.MCU, f:['Spider-Man','Avengers'], ph:3, ch:['Spider-Man','Iron Man'], pl:'Disney+', e:true, co:26, cl:'2016'},
{q:"Thor: Ragnarok", y:2017, ty:'movie', u:U.MCU, f:['Thor','Avengers'], ph:3, ch:['Thor','Loki','Hulk'], pl:'Disney+', e:true, co:30, cl:'2017'},
{q:"Black Panther", y:2018, ty:'movie', u:U.MCU, f:['Black Panther'], ph:3, ch:['Black Panther'], pl:'Disney+', e:true, co:25, cl:'2016'},
{q:"Avengers: Infinity War", y:2018, ty:'movie', u:U.MCU, f:['Avengers'], ph:3, ch:['Iron Man','Captain America','Thor','Doctor Strange','Spider-Man','Black Panther','Guardians of the Galaxy'], pl:'Disney+', e:true, co:31, cl:'2018'},
{q:"Ant-Man and the Wasp", y:2018, ty:'movie', u:U.MCU, f:['Ant-Man'], ph:3, ch:['Ant-Man','Wasp'], pl:'Disney+', e:true, co:32, cl:'2018'},
{q:"Captain Marvel", y:2019, ty:'movie', u:U.MCU, f:['Captain Marvel'], ph:3, ch:['Captain Marvel'], pl:'Disney+', e:true, co:1, cl:'1995'},
{q:"Avengers: Endgame", y:2019, ty:'movie', u:U.MCU, f:['Avengers'], ph:3, ch:['Iron Man','Captain America','Thor','Hulk','Black Widow','Hawkeye','Ant-Man'], pl:'Disney+', e:true, co:33, cl:'2018–2023'},
{q:"Spider-Man: Far From Home", y:2019, ty:'movie', u:U.MCU, f:['Spider-Man','Avengers'], ph:3, ch:['Spider-Man'], pl:'Disney+', e:false, co:39, cl:'2024'},

/* ==================== MCU — FASE 4 ==================== */
{q:"Black Widow", y:2021, ty:'movie', u:U.MCU, f:['Avengers'], ph:4, ch:['Black Widow'], pl:'Disney+', e:true, co:24, cl:'2016'},
{q:"Shang-Chi and the Legend of the Ten Rings", y:2021, ty:'movie', u:U.MCU, f:['Shang-Chi'], ph:4, ch:['Shang-Chi'], pl:'Disney+', e:true, co:38, cl:'2024'},
{q:"Eternals", y:2021, ty:'movie', u:U.MCU, f:['Eternals'], ph:4, ch:['Eternals'], pl:'Disney+', e:false, co:40, cl:'Fino al 2024'},
{q:"Spider-Man: No Way Home", y:2021, ty:'movie', u:U.MCU, f:['Spider-Man','Spider-Verse'], ph:4, ch:['Spider-Man','Doctor Strange'], pl:'Disney+ / Netflix', e:true, co:42, cl:'2024'},
{q:"Doctor Strange in the Multiverse of Madness", y:2022, ty:'movie', u:U.MCU, f:['Doctor Strange'], ph:4, ch:['Doctor Strange','Scarlet Witch'], pl:'Disney+', e:true, co:43, cl:'2024'},
{q:"Thor: Love and Thunder", y:2022, ty:'movie', u:U.MCU, f:['Thor'], ph:4, ch:['Thor'], pl:'Disney+', e:false, co:48, cl:'2025'},
{q:"Black Panther: Wakanda Forever", y:2022, ty:'movie', u:U.MCU, f:['Black Panther'], ph:4, ch:['Black Panther'], pl:'Disney+', e:true, co:49, cl:'2025'},

/* ==================== MCU — FASE 5 ==================== */
{q:"Ant-Man and the Wasp: Quantumania", y:2023, ty:'movie', u:U.MCU, f:['Ant-Man'], ph:5, ch:['Ant-Man','Wasp'], pl:'Disney+', e:true, co:52, cl:'2025'},
{q:"Guardians of the Galaxy Vol. 3", y:2023, ty:'movie', u:U.MCU, f:['Guardians of the Galaxy'], ph:5, ch:['Guardians of the Galaxy'], pl:'Disney+', e:false, co:53, cl:'2025'},
{q:"The Marvels", y:2023, ty:'movie', u:U.MCU, f:['Captain Marvel'], ph:5, ch:['Captain Marvel'], pl:'Disney+', e:false, co:54, cl:'2025'},
{q:"Deadpool & Wolverine", y:2024, ty:'movie', u:U.MCU, f:['Deadpool','Wolverine','X-Men'], ph:5, ch:['Deadpool','Wolverine'], pl:'Disney+', e:true, co:57, cl:'2024, Vuoto/Earth-10005'},
{q:"Captain America: Brave New World", y:2025, ty:'movie', u:U.MCU, f:['Captain America'], ph:5, ch:['Captain America'], pl:'Disney+', e:true, co:60, cl:'2026'},
{q:"Thunderbolts", y:2025, ty:'movie', u:U.MCU, f:['Avengers'], ph:5, ch:['Black Widow'], pl:'Disney+', e:true, co:62, cl:'2027'},

/* ==================== MCU — FASE 6 ==================== */
{q:"The Fantastic Four: First Steps", y:2025, ty:'movie', u:U.MCU, f:['Fantastic Four'], ph:6, ch:['Fantastic Four'], pl:'Disney+', e:true, co:63, cl:'1964 (Earth-828)'},
{q:"Spider-Man: Brand New Day", y:2026, ty:'movie', u:U.MCU, f:['Spider-Man'], ph:6, ch:['Spider-Man'], pl:'Al cinema', e:true, co:61.9, cl:'2026'},
{q:"Avengers: Doomsday", y:2026, ty:'movie', u:U.MCU, f:['Avengers'], ph:6, ch:['Doctor Doom'], pl:'Prossimamente', e:true, co:64, cl:'2027'},
{q:"Avengers: Secret Wars", y:2027, ty:'movie', u:U.MCU, f:['Avengers'], ph:6, ch:['Doctor Doom'], pl:'Prossimamente', e:true, co:65, cl:'2027'},

/* ==================== MCU — SERIE (Disney+) ==================== */
{q:"WandaVision", y:2021, tv:true, s:1, ty:'series', u:U.MCU, f:['Avengers'], ph:4, ch:['Scarlet Witch','Vision'], pl:'Disney+', e:true, co:34, cl:'2023'},
{q:"The Falcon and the Winter Soldier", y:2021, tv:true, s:1, ty:'series', u:U.MCU, f:['Captain America','Avengers'], ph:4, ch:['Captain America'], pl:'Disney+', e:true, co:35, cl:'2023'},
{q:"Loki", y:2021, tv:true, s:1, ty:'series', u:U.MCU, f:['Thor','Avengers'], ph:4, ch:['Loki'], pl:'Disney+', e:true, co:36, cl:'Fuori dal tempo'},
{q:"Loki", y:2023, tv:true, s:2, ty:'series', u:U.MCU, f:['Thor','Avengers'], ph:5, ch:['Loki'], pl:'Disney+', e:true, co:55, cl:'Fuori dal tempo'},
{q:"Hawkeye", y:2021, tv:true, s:1, ty:'series', u:U.MCU, f:['Avengers'], ph:4, ch:['Hawkeye'], pl:'Disney+', e:true, co:41, cl:'2024'},
{q:"Moon Knight", y:2022, tv:true, s:1, ty:'series', u:U.MCU, f:['Moon Knight'], ph:4, ch:['Moon Knight'], pl:'Disney+', e:false, co:45, cl:'2025'},
{q:"Ms. Marvel", y:2022, tv:true, s:1, ty:'series', u:U.MCU, f:['Captain Marvel'], ph:4, ch:['Ms. Marvel'], pl:'Disney+', e:true, co:46, cl:'2025'},
{q:"She-Hulk: Attorney at Law", y:2022, tv:true, s:1, ty:'series', u:U.MCU, f:['Hulk'], ph:4, ch:['She-Hulk'], pl:'Disney+', e:false, co:47, cl:'2025'},
{q:"Secret Invasion", y:2023, tv:true, s:1, ty:'series', u:U.MCU, f:['S.H.I.E.L.D.','Avengers'], ph:5, ch:['Nick Fury'], pl:'Disney+', e:true, co:51, cl:'2025'},
{q:"Echo", y:2024, tv:true, s:1, ty:'series', u:U.MCU, f:['Daredevil'], ph:5, ch:['Echo','Daredevil'], pl:'Disney+', e:false, co:44, cl:'2025'},
{q:"Agatha All Along", y:2024, tv:true, s:1, ty:'series', u:U.MCU, f:['Avengers'], ph:5, ch:['Agatha Harkness','Scarlet Witch'], pl:'Disney+', e:false, co:58, cl:'2025'},
{q:"Daredevil: Born Again", y:2025, tv:true, s:1, ty:'series', u:U.MCU, f:['Daredevil'], ph:5, ch:['Daredevil','Kingpin'], pl:'Disney+', e:false, co:61, cl:'2026'},
{q:"Daredevil: Born Again", y:2026, tv:true, s:2, ty:'series', u:U.MCU, f:['Daredevil'], ph:6, ch:['Daredevil','Kingpin'], pl:'Disney+', e:false, co:61.3, cl:'2026'},
{q:"Ironheart", y:2025, tv:true, s:1, ty:'series', u:U.MCU, f:['Iron Man'], ph:5, ch:['Ironheart'], pl:'Disney+', e:false, co:50, cl:'2025'},
{q:"Wonder Man", y:2026, tv:true, s:1, ty:'series', u:U.MCU, f:['Avengers'], ph:6, ch:['Wonder Man'], pl:'Disney+', e:false, co:64.5, cl:'2026'},
{q:"VisionQuest", y:2026, tv:true, s:1, ty:'series', u:U.MCU, f:['Avengers'], ph:6, ch:['Vision'], pl:'Disney+', e:false, co:63.5, cl:'2026'},

/* ==================== MCU — ANIMAZIONE (Disney+) ==================== */
{q:"What If...?", y:2021, tv:true, s:1, ty:'animated-series', u:U.MCU, f:['Avengers'], ph:4, ch:['Captain Carter','Doctor Strange'], pl:'Disney+', e:false, co:37, cl:'Multiverso'},
{q:"What If...?", y:2023, tv:true, s:2, ty:'animated-series', u:U.MCU, f:['Avengers'], ph:4, ch:['Captain Carter'], pl:'Disney+', e:false, co:56, cl:'Multiverso'},
{q:"What If...?", y:2024, tv:true, s:3, ty:'animated-series', u:U.MCU, f:['Avengers'], ph:5, ch:['Captain Carter'], pl:'Disney+', e:false, co:59, cl:'Multiverso'},
{q:"I Am Groot", y:2022, tv:true, s:1, ty:'animated-series', u:U.MCU, f:['Guardians of the Galaxy'], ph:4, ch:['Guardians of the Galaxy'], pl:'Disney+', e:false, co:13.5, cl:'2014'},
{q:"X-Men '97", y:2024, tv:true, s:1, ty:'animated-series', u:U.ANIM, f:['X-Men'], ch:['Wolverine','Professor X','Magneto','Storm','Cyclops'], pl:'Disney+'},
{q:"Your Friendly Neighborhood Spider-Man", y:2025, tv:true, s:1, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"Marvel Zombies", y:2025, tv:true, s:1, ty:'animated-series', u:U.MCU, f:['Avengers'], ph:5, ch:['Scarlet Witch'], pl:'Disney+', e:false, co:59.5, cl:'Realtà alternativa'},
{q:"Eyes of Wakanda", y:2025, tv:true, s:1, ty:'animated-series', u:U.MCU, f:['Black Panther'], ph:5, ch:['Black Panther'], pl:'Disney+', e:false, co:0.5, cl:'Antichità'},

/* ==================== MCU — SPECIAL ==================== */
{q:"Werewolf by Night", y:2022, ty:'special', u:U.MCU, f:['Avengers'], ph:4, ch:['Werewolf by Night'], pl:'Disney+', e:false, co:47.5, cl:'2025'},
{q:"The Guardians of the Galaxy Holiday Special", y:2022, ty:'special', u:U.MCU, f:['Guardians of the Galaxy'], ph:4, ch:['Guardians of the Galaxy'], pl:'Disney+', e:false, co:49.5, cl:'2025'},
{q:"The Punisher: One Last Kill", y:2026, ty:'special', u:U.MCU, f:['Punisher','Daredevil'], ph:6, ch:['Punisher'], pl:'Disney+', e:false, co:61.6, cl:'2026'},

/* ==================== MARVEL TELEVISION (ABC / Hulu / Freeform) ==================== */
{q:"Agents of S.H.I.E.L.D.", y:2013, tv:true, ty:'series', u:U.MTV, f:['S.H.I.E.L.D.'], ch:['Nick Fury'], pl:'Disney+'},
{q:"Agent Carter", y:2015, tv:true, ty:'series', u:U.MTV, f:['Captain America','S.H.I.E.L.D.'], ch:['Peggy Carter'], pl:'Disney+'},
{q:"Inhumans", y:2017, tv:true, ty:'series', u:U.MTV, f:['Inhumans'], ch:['Black Bolt'], pl:'Disney+'},
{q:"Runaways", y:2017, tv:true, ty:'series', u:U.MTV, f:['Runaways'], ch:[], pl:'Disney+'},
{q:"Cloak & Dagger", y:2018, tv:true, ty:'series', u:U.MTV, f:['Cloak & Dagger'], ch:[], pl:'Disney+'},
{q:"Helstrom", y:2020, tv:true, ty:'series', u:U.MTV, f:['Altri'], ch:[], pl:'Hulu'},

/* ==================== MARVEL / NETFLIX ==================== */
{q:"Daredevil", y:2015, tv:true, s:1, ty:'series', u:U.NETFLIX, f:['Daredevil','Defenders'], ch:['Daredevil','Kingpin'], pl:'Disney+ (ex Netflix)'},
{q:"Daredevil", y:2016, tv:true, s:2, ty:'series', u:U.NETFLIX, f:['Daredevil','Defenders','Punisher'], ch:['Daredevil','Punisher','Elektra'], pl:'Disney+ (ex Netflix)'},
{q:"Daredevil", y:2018, tv:true, s:3, ty:'series', u:U.NETFLIX, f:['Daredevil','Defenders'], ch:['Daredevil','Kingpin'], pl:'Disney+ (ex Netflix)'},
{q:"Jessica Jones", y:2015, tv:true, s:1, ty:'series', u:U.NETFLIX, f:['Jessica Jones','Defenders'], ch:['Jessica Jones'], pl:'Disney+ (ex Netflix)'},
{q:"Jessica Jones", y:2018, tv:true, s:2, ty:'series', u:U.NETFLIX, f:['Jessica Jones','Defenders'], ch:['Jessica Jones'], pl:'Disney+ (ex Netflix)'},
{q:"Jessica Jones", y:2019, tv:true, s:3, ty:'series', u:U.NETFLIX, f:['Jessica Jones','Defenders'], ch:['Jessica Jones'], pl:'Disney+ (ex Netflix)'},
{q:"Luke Cage", y:2016, tv:true, s:1, ty:'series', u:U.NETFLIX, f:['Luke Cage','Defenders'], ch:['Luke Cage'], pl:'Disney+ (ex Netflix)'},
{q:"Luke Cage", y:2018, tv:true, s:2, ty:'series', u:U.NETFLIX, f:['Luke Cage','Defenders'], ch:['Luke Cage'], pl:'Disney+ (ex Netflix)'},
{q:"Iron Fist", y:2017, tv:true, s:1, ty:'series', u:U.NETFLIX, f:['Iron Fist','Defenders'], ch:['Iron Fist'], pl:'Disney+ (ex Netflix)'},
{q:"Iron Fist", y:2018, tv:true, s:2, ty:'series', u:U.NETFLIX, f:['Iron Fist','Defenders'], ch:['Iron Fist'], pl:'Disney+ (ex Netflix)'},
{q:"The Defenders", y:2017, tv:true, ty:'series', u:U.NETFLIX, f:['Defenders'], ch:['Daredevil','Jessica Jones','Luke Cage','Iron Fist'], pl:'Disney+ (ex Netflix)'},
{q:"The Punisher", y:2017, tv:true, s:1, ty:'series', u:U.NETFLIX, f:['Punisher','Defenders'], ch:['Punisher'], pl:'Disney+ (ex Netflix)'},
{q:"The Punisher", y:2019, tv:true, s:2, ty:'series', u:U.NETFLIX, f:['Punisher','Defenders'], ch:['Punisher'], pl:'Disney+ (ex Netflix)'},

/* ==================== SONY'S SPIDER-MAN UNIVERSE ==================== */
{q:"Venom", y:2018, ty:'movie', u:U.SONY, f:['Venom','Spider-Man'], ch:['Venom'], pl:'Noleggio/Acquisto'},
{q:"Venom: Let There Be Carnage", y:2021, ty:'movie', u:U.SONY, f:['Venom'], ch:['Venom'], pl:'Noleggio/Acquisto'},
{q:"Morbius", y:2022, ty:'movie', u:U.SONY, f:['Altri'], ch:['Morbius'], pl:'Noleggio/Acquisto'},
{q:"Madame Web", y:2024, ty:'movie', u:U.SONY, f:['Spider-Man'], ch:['Madame Web'], pl:'Noleggio/Acquisto'},
{q:"Kraven the Hunter", y:2024, ty:'movie', u:U.SONY, f:['Spider-Man'], ch:['Kraven'], pl:'Noleggio/Acquisto'},
{q:"Venom: The Last Dance", y:2024, ty:'movie', u:U.SONY, f:['Venom'], ch:['Venom'], pl:'Noleggio/Acquisto'},

/* ==================== SPIDER-MAN — SONY LIVE ACTION (pre-MCU) ==================== */
{q:"Spider-Man", y:2002, ty:'movie', u:U.PRE, f:['Spider-Man'], ch:['Spider-Man','Green Goblin'], pl:'Noleggio/Acquisto'},
{q:"Spider-Man 2", y:2004, ty:'movie', u:U.PRE, f:['Spider-Man'], ch:['Spider-Man','Doctor Octopus'], pl:'Noleggio/Acquisto'},
{q:"Spider-Man 3", y:2007, ty:'movie', u:U.PRE, f:['Spider-Man','Venom'], ch:['Spider-Man','Venom'], pl:'Noleggio/Acquisto'},
{q:"The Amazing Spider-Man", y:2012, ty:'movie', u:U.PRE, f:['Spider-Man'], ch:['Spider-Man','Lizard'], pl:'Noleggio/Acquisto'},
{q:"The Amazing Spider-Man 2", y:2014, ty:'movie', u:U.PRE, f:['Spider-Man'], ch:['Spider-Man','Electro'], pl:'Noleggio/Acquisto'},
{q:"Spider-Man", y:1977, ty:'tv-movie', u:U.INDIE, f:['Spider-Man'], ch:['Spider-Man'], pl:'Rara/Archivio'},
{q:"The Amazing Spider-Man", y:1977, tv:true, ty:'series', u:U.INDIE, f:['Spider-Man'], ch:['Spider-Man'], pl:'Rara/Archivio'},

/* ==================== SPIDER-VERSE (animazione Sony) ==================== */
{q:"Spider-Man: Into the Spider-Verse", y:2018, ty:'animated-movie', u:U.SONY, f:['Spider-Man','Spider-Verse'], ch:['Spider-Man','Miles Morales'], pl:'Noleggio/Acquisto'},
{q:"Spider-Man: Across the Spider-Verse", y:2023, ty:'animated-movie', u:U.SONY, f:['Spider-Man','Spider-Verse'], ch:['Spider-Man','Miles Morales','Spider-Gwen'], pl:'Netflix / Noleggio'},

/* ==================== X-MEN / FOX ==================== */
{q:"X-Men", y:2000, ty:'movie', u:U.FOX, f:['X-Men','Wolverine'], ch:['Wolverine','Professor X','Magneto','Storm','Cyclops'], pl:'Disney+'},
{q:"X2", y:2003, it:"X-Men 2", ty:'movie', u:U.FOX, f:['X-Men','Wolverine'], ch:['Wolverine','Professor X','Magneto','Storm'], pl:'Disney+'},
{q:"X-Men: The Last Stand", y:2006, ty:'movie', u:U.FOX, f:['X-Men','Wolverine'], ch:['Wolverine','Professor X','Magneto','Storm'], pl:'Disney+'},
{q:"X-Men Origins: Wolverine", y:2009, ty:'movie', u:U.FOX, f:['Wolverine','X-Men','Deadpool'], ch:['Wolverine','Deadpool'], pl:'Disney+'},
{q:"X-Men: First Class", y:2011, ty:'movie', u:U.FOX, f:['X-Men'], ch:['Professor X','Magneto'], pl:'Disney+'},
{q:"The Wolverine", y:2013, ty:'movie', u:U.FOX, f:['Wolverine','X-Men'], ch:['Wolverine'], pl:'Disney+'},
{q:"X-Men: Days of Future Past", y:2014, ty:'movie', u:U.FOX, f:['X-Men','Wolverine'], ch:['Wolverine','Professor X','Magneto'], pl:'Disney+'},
{q:"Deadpool", y:2016, ty:'movie', u:U.FOX, f:['Deadpool','X-Men'], ch:['Deadpool'], pl:'Disney+'},
{q:"X-Men: Apocalypse", y:2016, ty:'movie', u:U.FOX, f:['X-Men'], ch:['Professor X','Magneto','Storm','Cyclops'], pl:'Disney+'},
{q:"Logan", y:2017, ty:'movie', u:U.FOX, f:['Wolverine','X-Men'], ch:['Wolverine','Professor X'], pl:'Disney+'},
{q:"Deadpool 2", y:2018, ty:'movie', u:U.FOX, f:['Deadpool','X-Men'], ch:['Deadpool'], pl:'Disney+'},
{q:"Dark Phoenix", y:2019, ty:'movie', u:U.FOX, f:['X-Men'], ch:['Professor X','Magneto','Storm','Cyclops'], pl:'Disney+'},
{q:"The New Mutants", y:2020, ty:'movie', u:U.FOX, f:['X-Men'], ch:[], pl:'Disney+'},
{q:"Legion", y:2017, tv:true, ty:'series', u:U.FOX, f:['X-Men'], ch:['Professor X'], pl:'Disney+'},
{q:"The Gifted", y:2017, tv:true, ty:'series', u:U.FOX, f:['X-Men'], ch:[], pl:'Disney+'},
{q:"Generation X", y:1996, ty:'tv-movie', u:U.INDIE, f:['X-Men'], ch:[], pl:'Rara/Archivio'},
{q:"Mutant X", y:2001, tv:true, ty:'series', u:U.INDIE, f:['X-Men'], ch:[], pl:'Rara/Archivio'},

/* ==================== FANTASTIC FOUR (pre-MCU) ==================== */
{q:"The Fantastic Four", y:1994, ty:'movie', u:U.INDIE, f:['Fantastic Four'], ch:['Fantastic Four'], pl:'Mai distribuito ufficialmente'},
{q:"Fantastic Four", y:2005, ty:'movie', u:U.FOX, f:['Fantastic Four'], ch:['Fantastic Four'], pl:'Disney+'},
{q:"Fantastic Four: Rise of the Silver Surfer", y:2007, ty:'movie', u:U.FOX, f:['Fantastic Four'], ch:['Fantastic Four','Silver Surfer'], pl:'Disney+'},
{q:"Fantastic Four", y:2015, ty:'movie', u:U.FOX, f:['Fantastic Four'], ch:['Fantastic Four'], pl:'Disney+'},

/* ==================== BLADE / GHOST RIDER / STREET LEVEL (pre-MCU) ==================== */
{q:"Blade", y:1998, ty:'movie', u:U.PRE, f:['Blade'], ch:['Blade'], pl:'Noleggio/Acquisto'},
{q:"Blade II", y:2002, ty:'movie', u:U.PRE, f:['Blade'], ch:['Blade'], pl:'Noleggio/Acquisto'},
{q:"Blade: Trinity", y:2004, ty:'movie', u:U.PRE, f:['Blade'], ch:['Blade'], pl:'Noleggio/Acquisto'},
{q:"Blade: The Series", y:2006, tv:true, ty:'series', u:U.INDIE, f:['Blade'], ch:['Blade'], pl:'Rara/Archivio'},
{q:"Ghost Rider", y:2007, ty:'movie', u:U.PRE, f:['Ghost Rider'], ch:['Ghost Rider'], pl:'Noleggio/Acquisto'},
{q:"Ghost Rider: Spirit of Vengeance", y:2011, ty:'movie', u:U.PRE, f:['Ghost Rider'], ch:['Ghost Rider'], pl:'Noleggio/Acquisto'},
{q:"Daredevil", y:2003, ty:'movie', u:U.PRE, f:['Daredevil'], ch:['Daredevil','Kingpin'], pl:'Disney+'},
{q:"Elektra", y:2005, ty:'movie', u:U.PRE, f:['Daredevil'], ch:['Elektra'], pl:'Disney+'},
{q:"The Punisher", y:1989, ty:'movie', u:U.INDIE, f:['Punisher'], ch:['Punisher'], pl:'Noleggio/Acquisto'},
{q:"The Punisher", y:2004, ty:'movie', u:U.PRE, f:['Punisher'], ch:['Punisher'], pl:'Noleggio/Acquisto'},
{q:"Punisher: War Zone", y:2008, ty:'movie', u:U.PRE, f:['Punisher'], ch:['Punisher'], pl:'Noleggio/Acquisto'},
{q:"Hulk", y:2003, ty:'movie', u:U.PRE, f:['Hulk'], ch:['Hulk'], pl:'Noleggio/Acquisto'},
{q:"Man-Thing", y:2005, ty:'tv-movie', u:U.INDIE, f:['Altri'], ch:[], pl:'Noleggio/Acquisto'},
{q:"Howard the Duck", y:1986, ty:'movie', u:U.INDIE, f:['Altri'], ch:[], pl:'Noleggio/Acquisto'},
{q:"Captain America", y:1990, ty:'movie', u:U.INDIE, f:['Captain America'], ch:['Captain America'], pl:'Rara/Archivio'},
{q:"Captain America", y:1944, ty:'movie', u:U.INDIE, f:['Captain America'], ch:['Captain America'], pl:'Rara/Archivio'},
{q:"Nick Fury: Agent of Shield", y:1998, ty:'tv-movie', u:U.INDIE, f:['S.H.I.E.L.D.'], ch:['Nick Fury'], pl:'Rara/Archivio'},
{q:"The Incredible Hulk Returns", y:1988, ty:'tv-movie', u:U.INDIE, f:['Hulk','Thor'], ch:['Hulk','Thor'], pl:'Rara/Archivio'},
{q:"The Trial of the Incredible Hulk", y:1989, ty:'tv-movie', u:U.INDIE, f:['Hulk','Daredevil'], ch:['Hulk','Daredevil'], pl:'Rara/Archivio'},
{q:"The Incredible Hulk", y:1977, tv:true, ty:'series', u:U.INDIE, f:['Hulk'], ch:['Hulk'], pl:'Rara/Archivio'},

/* ==================== MARVEL ANIMATION — FILM ==================== */
{q:"Ultimate Avengers", y:2006, ty:'animated-movie', u:U.ANIM, f:['Avengers'], ch:['Captain America','Iron Man','Thor','Hulk'], pl:'Noleggio/Acquisto'},
{q:"Ultimate Avengers 2", y:2006, ty:'animated-movie', u:U.ANIM, f:['Avengers','Black Panther'], ch:['Captain America','Black Panther'], pl:'Noleggio/Acquisto'},
{q:"The Invincible Iron Man", y:2007, ty:'animated-movie', u:U.ANIM, f:['Iron Man'], ch:['Iron Man'], pl:'Noleggio/Acquisto'},
{q:"Doctor Strange: The Sorcerer Supreme", y:2007, ty:'animated-movie', u:U.ANIM, f:['Doctor Strange'], ch:['Doctor Strange'], pl:'Noleggio/Acquisto'},
{q:"Next Avengers: Heroes of Tomorrow", y:2008, ty:'animated-movie', u:U.ANIM, f:['Avengers'], ch:[], pl:'Noleggio/Acquisto'},
{q:"Hulk Vs.", y:2009, ty:'animated-movie', u:U.ANIM, f:['Hulk','Wolverine','Thor'], ch:['Hulk','Wolverine','Thor'], pl:'Noleggio/Acquisto'},
{q:"Planet Hulk", y:2010, ty:'animated-movie', u:U.ANIM, f:['Hulk'], ch:['Hulk'], pl:'Noleggio/Acquisto'},
{q:"Thor: Tales of Asgard", y:2011, ty:'animated-movie', u:U.ANIM, f:['Thor'], ch:['Thor','Loki'], pl:'Noleggio/Acquisto'},
{q:"Iron Man: Rise of Technovore", y:2013, ty:'animated-movie', u:U.ANIM, f:['Iron Man'], ch:['Iron Man','Punisher'], pl:'Noleggio/Acquisto'},
{q:"Iron Man & Hulk: Heroes United", y:2013, ty:'animated-movie', u:U.ANIM, f:['Iron Man','Hulk'], ch:['Iron Man','Hulk'], pl:'Noleggio/Acquisto'},
{q:"Avengers Confidential", y:2014, ty:'animated-movie', u:U.ANIM, f:['Avengers','Punisher'], ch:['Black Widow','Punisher'], pl:'Noleggio/Acquisto'},
{q:"Iron Man & Captain America: Heroes United", y:2014, ty:'animated-movie', u:U.ANIM, f:['Iron Man','Captain America'], ch:['Iron Man','Captain America'], pl:'Noleggio/Acquisto'},
{q:"Big Hero 6", y:2014, ty:'animated-movie', u:U.ANIM, f:['Big Hero 6'], ch:[], pl:'Disney+'},
{q:"Hulk: Where Monsters Dwell", y:2016, ty:'animated-movie', u:U.ANIM, f:['Hulk','Doctor Strange'], ch:['Hulk','Doctor Strange'], pl:'Noleggio/Acquisto'},
{q:"Marvel Rising: Secret Warriors", y:2018, ty:'animated-movie', u:U.ANIM, f:['Marvel Rising'], ch:['Ms. Marvel'], pl:'Noleggio/Acquisto'},

/* ==================== MARVEL ANIMATION — SERIE ==================== */
{q:"Spider-Man", y:1967, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"Spider-Man and His Amazing Friends", y:1981, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man','X-Men'], ch:['Spider-Man','Iceman'], pl:'Disney+'},
{q:"X-Men", y:1992, tv:true, ty:'animated-series', u:U.ANIM, f:['X-Men'], ch:['Wolverine','Professor X','Magneto','Storm','Cyclops'], pl:'Disney+'},
{q:"Iron Man", y:1994, tv:true, ty:'animated-series', u:U.ANIM, f:['Iron Man'], ch:['Iron Man'], pl:'Disney+'},
{q:"Fantastic Four", y:1994, tv:true, ty:'animated-series', u:U.ANIM, f:['Fantastic Four'], ch:['Fantastic Four'], pl:'Disney+'},
{q:"Spider-Man", y:1994, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"The Incredible Hulk", y:1996, tv:true, ty:'animated-series', u:U.ANIM, f:['Hulk'], ch:['Hulk'], pl:'Disney+'},
{q:"Silver Surfer", y:1998, tv:true, ty:'animated-series', u:U.ANIM, f:['Fantastic Four'], ch:['Silver Surfer'], pl:'Rara/Archivio'},
{q:"Spider-Man Unlimited", y:1999, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Rara/Archivio'},
{q:"Avengers: United They Stand", y:1999, tv:true, ty:'animated-series', u:U.ANIM, f:['Avengers'], ch:['Ant-Man','Wasp'], pl:'Rara/Archivio'},
{q:"X-Men: Evolution", y:2000, tv:true, ty:'animated-series', u:U.ANIM, f:['X-Men'], ch:['Wolverine','Professor X','Magneto'], pl:'Rara/Archivio'},
{q:"Spider-Man: The New Animated Series", y:2003, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Rara/Archivio'},
{q:"Fantastic Four: World's Greatest Heroes", y:2006, tv:true, ty:'animated-series', u:U.ANIM, f:['Fantastic Four'], ch:['Fantastic Four'], pl:'Rara/Archivio'},
{q:"The Spectacular Spider-Man", y:2008, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"Wolverine and the X-Men", y:2008, tv:true, ty:'animated-series', u:U.ANIM, f:['X-Men','Wolverine'], ch:['Wolverine','Professor X'], pl:'Disney+'},
{q:"Iron Man: Armored Adventures", y:2009, tv:true, ty:'animated-series', u:U.ANIM, f:['Iron Man'], ch:['Iron Man'], pl:'Rara/Archivio'},
{q:"The Super Hero Squad Show", y:2009, tv:true, ty:'animated-series', u:U.ANIM, f:['Avengers'], ch:[], pl:'Rara/Archivio'},
{q:"The Avengers: Earth's Mightiest Heroes", y:2010, tv:true, ty:'animated-series', u:U.ANIM, f:['Avengers'], ch:['Captain America','Iron Man','Thor','Hulk'], pl:'Disney+'},
{q:"Ultimate Spider-Man", y:2012, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"Avengers Assemble", y:2013, tv:true, ty:'animated-series', u:U.ANIM, f:['Avengers'], ch:['Captain America','Iron Man','Thor','Hulk'], pl:'Disney+'},
{q:"Hulk and the Agents of S.M.A.S.H.", y:2013, tv:true, ty:'animated-series', u:U.ANIM, f:['Hulk'], ch:['Hulk','She-Hulk'], pl:'Disney+'},
{q:"Guardians of the Galaxy", y:2015, tv:true, ty:'animated-series', u:U.ANIM, f:['Guardians of the Galaxy'], ch:['Guardians of the Galaxy'], pl:'Disney+'},
{q:"Big Hero 6: The Series", y:2017, tv:true, ty:'animated-series', u:U.ANIM, f:['Big Hero 6'], ch:[], pl:'Disney+'},
{q:"Spider-Man", y:2017, tv:true, ty:'animated-series', u:U.ANIM, f:['Spider-Man'], ch:['Spider-Man'], pl:'Disney+'},
{q:"M.O.D.O.K.", y:2021, tv:true, ty:'animated-series', u:U.ANIM, f:['Altri'], ch:[], pl:'Hulu'},
{q:"Hit-Monkey", y:2021, tv:true, ty:'animated-series', u:U.ANIM, f:['Altri'], ch:[], pl:'Hulu'},
{q:"Moon Girl and Devil Dinosaur", y:2023, tv:true, ty:'animated-series', u:U.ANIM, f:['Altri'], ch:[], pl:'Disney+'},
];
