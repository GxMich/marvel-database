/* ============================================================
   BUILD CATALOG
   Prende la tassonomia curata (master-list.mjs), la incrocia con
   TMDB per i dati fattuali e scrive DUE file:

   - js/data/catalog.js  il minimo per disegnare la griglia e far
                         funzionare ricerca, filtri e ordinamenti.
                         Si carica all'avvio.
   - js/data/details.js  trama, cast, regia, trailer, tagline, logo.
                         Serve solo a chi apre una scheda, quindi
                         viene caricato al primo click e non pesa
                         sull'apertura della pagina.

   Uso:  node tools/build-catalog.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { MASTER } from './master-list.mjs';

const API_KEY = 'f48755194795d3e68c657d5262d7d17d';
const BASE = 'https://api.themoviedb.org/3';
const OUT = path.join(process.cwd(), 'js', 'data', 'catalog.js');
const OUT_DETAILS = path.join(process.cwd(), 'js', 'data', 'details.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function tmdb(endpoint, params = {}) {
  const qs = new URLSearchParams({ api_key: API_KEY, ...params });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE}${endpoint}?${qs}`);
    if (res.status === 429) { await sleep(1200); continue; }
    if (!res.ok) throw new Error(`${endpoint} -> HTTP ${res.status}`);
    return res.json();
  }
  throw new Error(`${endpoint} -> troppi 429`);
}

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const norm = s => (s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/* Quanto un risultato somiglia al titolo cercato: 3 = identico,
   2 = uno contiene l'altro, 1 = parole in comune, 0 = estraneo.
   Serve perché la sola popolarità sceglieva film omonimi sbagliati
   (es. "X2" -> "Cradle 2 the Grave"). */
function titleScore(result, wantTitle, isTv) {
  const target = norm(wantTitle);
  const cands = [isTv ? result.name : result.title, isTv ? result.original_name : result.original_title].map(norm);
  if (cands.some(c => c === target)) return 3;
  if (cands.some(c => c && (c.includes(target) || target.includes(c)))) return 2;
  const words = wantTitle.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const joined = cands.join(' ');
  if (words.length && words.every(w => joined.includes(w))) return 1;
  return 0;
}

/* Sceglie il risultato giusto: prima l'anno (±1), poi la somiglianza
   del titolo, e solo a parità la popolarità. */
function pickBest(results, wantYear, isTv, wantTitle) {
  if (!results || !results.length) return null;
  const yearOf = r => {
    const d = isTv ? r.first_air_date : r.release_date;
    return d ? Number(d.slice(0, 4)) : null;
  };
  const rank = (a, b) =>
    titleScore(b, wantTitle, isTv) - titleScore(a, wantTitle, isTv) ||
    b.popularity - a.popularity;

  const viable = list => list.filter(r => titleScore(r, wantTitle, isTv) > 0);

  const exact = viable(results.filter(r => yearOf(r) === wantYear));
  if (exact.length) return exact.sort(rank)[0];
  const near = viable(results.filter(r => { const y = yearOf(r); return y && Math.abs(y - wantYear) <= 1; }));
  if (near.length) return near.sort(rank)[0];
  return null;
}

/* Match per titolo esatto (usato per le stagioni successive alla prima,
   dove l'anno della stagione non coincide con il debutto della serie). */
function matchByTitle(results, wantTitle, isTv) {
  if (!results || !results.length) return null;
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(wantTitle);
  const exact = results.filter(r => {
    const t = norm(isTv ? r.name : r.title);
    const o = norm(isTv ? r.original_name : r.original_title);
    return t === target || o === target;
  });
  if (exact.length) return exact.sort((a, b) => b.popularity - a.popularity)[0];
  return null;
}

/* Normalizza lo stato TMDB nei valori usati dai filtri */
function normalizeStatus(raw, isTv, releaseDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (!releaseDate) return 'upcoming';
  if (releaseDate > today) return 'upcoming';
  if (isTv) {
    if (raw === 'Returning Series') return 'ongoing';
    if (raw === 'Ended') return 'ended';
    if (raw === 'Canceled') return 'cancelled';
    if (raw === 'In Production' || raw === 'Planned') return 'upcoming';
    return 'ended';
  }
  if (raw === 'Released') return 'released';
  if (raw === 'Canceled') return 'cancelled';
  if (raw === 'Post Production' || raw === 'In Production' || raw === 'Planned') return 'upcoming';
  return 'released';
}

/* Durata media di un episodio, in minuti. TMDB la espone in tre modi di
   affidabilità decrescente: le durate reali episodio per episodio, il campo
   episode_run_time della serie, o niente — e in quel caso si guarda la
   stagione 1, che quasi sempre ce l'ha. Senza questo dato il monte ore
   delle statistiche sarebbe inventato, perché gli episodi sono la gran
   parte del catalogo. */
async function episodeRuntime(details, tmdbId, seasonInfo) {
  const avg = list => Math.round(list.reduce((a, b) => a + b, 0) / list.length);
  if (seasonInfo?.runtimes?.length) return avg(seasonInfo.runtimes);
  if (details.episode_run_time?.length) return details.episode_run_time[0];
  try {
    const s1 = await tmdb(`/tv/${tmdbId}/season/1`, {});
    const rt = (s1.episodes || []).map(e => e.runtime).filter(r => r > 0);
    if (rt.length) return avg(rt);
  } catch { /* la stagione 1 può non esistere: si resta senza durata */ }
  return null;
}

/* Minuti totali del titolo. Per le stagioni tracciate a parte, se TMDB dà la
   durata di ogni episodio, si sommano quelle vere invece di moltiplicare. */
function totalMinutes(isTv, details, seasonInfo, epRuntime, episodes) {
  if (!isTv) return details.runtime || null;
  if (seasonInfo?.runtimes?.length && seasonInfo.runtimes.length === seasonInfo.episodes) {
    return seasonInfo.runtimes.reduce((a, b) => a + b, 0);
  }
  if (epRuntime && episodes) return epRuntime * episodes;
  return null;
}

/* ------------------------------------------------------------
   ESTRAZIONE DEI DATI DI SCHEDA
   Tutto quello che segue vive in details.js, non in catalog.js.
   ------------------------------------------------------------ */

/* Il trailer ufficiale, se c'è; altrimenti un trailer qualsiasi;
   altrimenti il primo video YouTube (di solito una clip o un teaser).
   `include_video_language` porta italiano e inglese in una sola
   chiamata: chiedere le due lingue separatamente raddoppierebbe le
   richieste per tutti i 184 titoli. */
function pickTrailer(videos) {
  const yt = (videos?.results || []).filter(v => v.site === 'YouTube' && v.key);
  const best =
    yt.find(v => v.type === 'Trailer' && v.official && v.iso_639_1 === 'it') ||
    yt.find(v => v.type === 'Trailer' && v.official) ||
    yt.find(v => v.type === 'Trailer') ||
    yt.find(v => v.type === 'Teaser') ||
    yt[0];
  return best ? { key: best.key, name: best.name || null } : null;
}

/* Il logo del titolo: è quello che TMDB chiama "logo", cioè il
   lettering del film su fondo trasparente. In testa alla scheda
   dice il titolo meglio di qualunque font. */
function pickLogo(images) {
  const logos = (images?.logos || []).filter(l => l.file_path);
  const best =
    logos.filter(l => l.iso_639_1 === 'it').sort((a, b) => b.vote_average - a.vote_average)[0] ||
    logos.filter(l => l.iso_639_1 === 'en').sort((a, b) => b.vote_average - a.vote_average)[0] ||
    logos[0];
  return best ? best.file_path : null;
}

function pickCast(credits) {
  return (credits?.cast || []).slice(0, 10).map(c => ({
    n: c.name,
    c: c.character || null,
    p: c.profile_path || null,
  }));
}

function pickCrew(credits, details) {
  const crew = credits?.crew || [];
  const names = job => [...new Set(crew.filter(c => job.includes(c.job)).map(c => c.name))].slice(0, 3);
  return {
    directors: names(['Director']),
    writers: names(['Screenplay', 'Writer', 'Story']),
    creators: (details.created_by || []).map(c => c.name).slice(0, 3),
  };
}

const report = { ok: [], missing: [], yearMismatch: [], suspicious: [], noDuration: [], noTrailer: [], noCast: [] };

/* tmdbId della stagione 1 di ogni serie, per riusarlo nelle stagioni successive */
const seriesIdByQuery = new Map();

async function resolve(entry) {
  const isTv = !!entry.tv;
  // Per le stagioni successive alla prima l'anno indicato è quello della
  // stagione, non del debutto della serie: cercare per anno (o anche solo per
  // titolo) rischia di agganciare una produzione omonima diversa. Si riusa
  // quindi la serie già risolta per la stagione 1.
  const laterSeason = isTv && entry.s && entry.s > 1;
  let best = null;

  if (laterSeason && seriesIdByQuery.has(entry.q)) {
    best = { id: seriesIdByQuery.get(entry.q) };
  }

  if (!best) {
    const search = await tmdb(`/search/${isTv ? 'tv' : 'movie'}`, {
      query: entry.q,
      language: 'it-IT',
      ...(laterSeason ? {} : (isTv ? { first_air_date_year: entry.y } : { year: entry.y })),
    });
    best = laterSeason
      ? matchByTitle(search.results, entry.q, isTv)
      : pickBest(search.results, entry.y, isTv, entry.q);

    // secondo tentativo senza vincolo d'anno (utile per titoli molto vecchi)
    if (!best) {
      const wide = await tmdb(`/search/${isTv ? 'tv' : 'movie'}`, { query: entry.q, language: 'it-IT' });
      best = pickBest(wide.results, entry.y, isTv, entry.q) || matchByTitle(wide.results, entry.q, isTv);
      if (!best && wide.results?.length) {
        report.yearMismatch.push(`${entry.q} (${entry.y}) -> primo risultato: ${wide.results[0].title || wide.results[0].name}`);
      }
    }
  }

  if (!best) { report.missing.push(`${entry.q} (${entry.y})`); return null; }
  if (isTv && (!entry.s || entry.s === 1)) seriesIdByQuery.set(entry.q, best.id);

  /* Una sola chiamata porta anche cast, video e immagini: `append_to_response`
     non costa richieste in più, e `include_video_language` evita di doverne
     fare una seconda per i trailer in inglese. */
  const details = await tmdb(`/${isTv ? 'tv' : 'movie'}/${best.id}`, {
    language: 'it-IT',
    append_to_response: 'credits,videos,images',
    include_video_language: 'it,en,null',
    include_image_language: 'it,en,null',
  });

  // controllo di sanità: se il titolo risolto non somiglia a quello cercato
  // è probabile un aggancio sbagliato, va verificato a mano
  if (!laterSeason && titleScore(details, entry.q, isTv) === 0) {
    report.suspicious.push(
      `${entry.q} (${entry.y}) -> "${details.title || details.name}" [${details.original_title || details.original_name}] tmdb:${best.id}`
    );
  }

  let poster = details.poster_path;
  let seasonInfo = null;

  // per le stagioni tracciate a parte si usa il poster della stagione
  if (isTv && entry.s) {
    try {
      const season = await tmdb(`/tv/${best.id}/season/${entry.s}`, { language: 'it-IT' });
      if (season.poster_path) poster = season.poster_path;
      seasonInfo = {
        number: entry.s,
        episodes: season.episodes?.length || null,
        // durate reali episodio per episodio: è il dato più preciso che TMDB dia
        runtimes: (season.episodes || []).map(e => e.runtime).filter(r => r > 0),
      };
    } catch { /* la stagione può non esistere: si tiene il poster della serie */ }
  }

  /* In it-IT alcuni titoli sono tradotti a metà: manca il poster, o la trama,
     o la tagline. Si scarica una volta sola la versione in lingua originale e
     si tappano i buchi — meglio una trama in inglese che una scheda vuota. */
  let overview = details.overview || '';
  let tagline = details.tagline || '';
  if (!poster || !overview || !tagline) {
    const fallback = await tmdb(`/${isTv ? 'tv' : 'movie'}/${best.id}`, {});
    poster = poster || fallback.poster_path || null;
    overview = overview || fallback.overview || '';
    tagline = tagline || fallback.tagline || '';
  }

  const releaseDate = isTv ? details.first_air_date : details.release_date;
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : entry.y;

  const epRuntime = isTv ? await episodeRuntime(details, best.id, seasonInfo) : null;
  const episodes = seasonInfo ? seasonInfo.episodes : (isTv ? details.number_of_episodes || null : null);
  const minutes = totalMinutes(isTv, details, seasonInfo, epRuntime, episodes);

  const id = slugify(`${entry.it || details.title || details.name}-${entry.y}${entry.s ? '-s' + entry.s : ''}`);
  const trailer = pickTrailer(details.videos);
  const cast = pickCast(details.credits);
  const crew = pickCrew(details.credits, details);

  report.ok.push(entry.q);
  if (!minutes) report.noDuration.push(`${entry.q} (${entry.y})`);
  if (!trailer) report.noTrailer.push(`${entry.q} (${entry.y})`);
  if (!cast.length) report.noCast.push(`${entry.q} (${entry.y})`);

  /* Il taglio fra i due file passa qui: in `light` sta solo ciò che serve
     a disegnare una card e a farla trovare da ricerca, filtri e ordinamenti.
     Tutto il resto è roba da scheda aperta, e viaggia in `detail`. */
  const light = {
    id,
    tmdbId: best.id,
    tmdbType: isTv ? 'tv' : 'movie',
    title: entry.it || details.title || details.name,
    originalTitle: details.original_title || details.original_name || null,
    q: entry.q,
    year: entry.y,
    releaseDate: releaseDate || null,
    actualYear: year,
    type: entry.ty,
    medium: entry.ty.startsWith('animated') ? 'animation' : 'live-action',
    universe: entry.u,
    franchise: entry.f || [],
    phase: entry.ph || null,
    saga: entry.ph ? (entry.ph <= 3 ? 'Infinity Saga' : 'Multiverse Saga') : null,
    characters: entry.ch || [],
    genres: (details.genres || []).map(g => g.name),
    status: normalizeStatus(details.status, isTv, releaseDate),
    rating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
    votes: details.vote_count || 0,
    // per i film è la durata del film, per le serie quella di un episodio
    runtime: isTv ? epRuntime : (details.runtime || null),
    totalMinutes: minutes,
    seasons: isTv ? (details.number_of_seasons || null) : null,
    episodes,
    season: entry.s || null,
    poster: poster || null,
    platform: entry.pl || '',
    essential: !!entry.e,
    chronoOrder: entry.co ?? null,
    chronoLabel: entry.cl || null,
  };

  const detail = {
    overview,
    tagline: tagline || null,
    backdrop: details.backdrop_path || null,
    logo: pickLogo(details.images),
    trailer,
    cast,
    directors: crew.directors,
    writers: crew.writers,
    creators: crew.creators,
  };

  return { light, detail };
}

/* --- esecuzione con concorrenza limitata --- */
async function run() {
  console.log(`Risoluzione di ${MASTER.length} voci su TMDB...\n`);
  const out = [];
  const CONCURRENCY = 6;

  // Due passate: prima film e stagioni 1 (che popolano seriesIdByQuery),
  // poi le stagioni successive che riusano quell'id.
  const isLater = e => e.tv && e.s && e.s > 1;
  const pass1 = MASTER.map((e, i) => ({ e, i })).filter(({ e }) => !isLater(e));
  const pass2 = MASTER.map((e, i) => ({ e, i })).filter(({ e }) => isLater(e));

  async function runPass(list) {
    let idx = 0;
    async function worker() {
      while (idx < list.length) {
        const { e, i } = list[idx++];
        try {
          const rec = await resolve(e);
          if (rec) out[i] = rec;
        } catch (err) {
          report.missing.push(`${e.q} (${e.y}) -> ${err.message}`);
        }
        const done = report.ok.length + report.missing.length;
        if (done % 25 === 0) process.stdout.write(`  ${done}/${MASTER.length}\r`);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  await runPass(pass1);
  await runPass(pass2);

  const resolved = out.filter(Boolean);
  const catalog = resolved.map(r => r.light);
  const details = Object.fromEntries(resolved.map(r => [r.light.id, r.detail]));

  // controllo duplicati
  const seen = new Map();
  const dups = [];
  catalog.forEach(c => {
    const key = `${c.tmdbType}:${c.tmdbId}:${c.season || ''}`;
    if (seen.has(key)) dups.push(`${c.title} (${c.year}) == ${seen.get(key)}`);
    else seen.set(key, `${c.title} (${c.year})`);
  });

  const today = new Date().toISOString().slice(0, 10);

  const header = `/* ============================================================
   CATALOGO MARVEL — generato da tools/build-catalog.mjs
   NON modificare a mano: rigenera con \`node tools/build-catalog.mjs\`.
   Tassonomia curata in tools/master-list.mjs, dati fattuali da TMDB.
   Generato il ${today} — ${catalog.length} titoli.

   Qui sta solo ciò che serve alla griglia: trama, cast, regia,
   trailer e logo stanno in details.js, che si carica alla prima
   scheda aperta invece che all'avvio.
   ============================================================ */
const CATALOG = `;

  const detailsHeader = `/* ============================================================
   SCHEDE — generato da tools/build-catalog.mjs
   NON modificare a mano: rigenera con \`node tools/build-catalog.mjs\`.
   Generato il ${today} — ${Object.keys(details).length} titoli.

   Questo file NON è nell'HTML: lo carica js/details.js alla prima
   apertura di una scheda. Tenerlo fuori dall'avvio è tutto il punto
   della divisione — chi scorre soltanto la griglia non lo scarica.

   Chiavi del cast abbreviate (n/c/p = nome/personaggio/foto) perché
   sono 10 per titolo per 184 titoli: i nomi estesi peserebbero
   qualche decina di KB in più senza aggiungere nulla.
   ============================================================ */
const DETAILS = `;

  fs.writeFileSync(OUT, header + JSON.stringify(catalog, null, 1) + ';\n', 'utf8');
  fs.writeFileSync(OUT_DETAILS, detailsHeader + JSON.stringify(details) + ';\n', 'utf8');

  console.log(`\n\n=== RISULTATO ===`);
  console.log(`Risolti : ${catalog.length}/${MASTER.length}`);
  console.log(`Duplicati: ${dups.length ? '\n  - ' + dups.join('\n  - ') : 'nessuno'}`);
  if (report.missing.length) console.log(`\nNON TROVATI (${report.missing.length}):\n  - ` + report.missing.join('\n  - '));
  if (report.yearMismatch.length) console.log(`\nDA VERIFICARE (${report.yearMismatch.length}):\n  - ` + report.yearMismatch.join('\n  - '));
  if (report.noDuration.length) console.log(`\nSENZA DURATA (${report.noDuration.length}) — escluse dal monte ore:\n  - ` + report.noDuration.join('\n  - '));
  if (report.noTrailer.length) console.log(`\nSENZA TRAILER (${report.noTrailer.length}) — la scheda non mostra il pulsante:\n  - ` + report.noTrailer.join('\n  - '));
  if (report.noCast.length) console.log(`\nSENZA CAST (${report.noCast.length}):\n  - ` + report.noCast.join('\n  - '));

  const byType = catalog.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {});
  const byUni = catalog.reduce((a, c) => { a[c.universe] = (a[c.universe] || 0) + 1; return a; }, {});
  const noPoster = catalog.filter(c => !c.poster).map(c => `${c.title} (${c.year})`);
  console.log(`\nPer tipo:`, byType);
  console.log(`Per universo:`, byUni);
  console.log(`Senza poster: ${noPoster.length ? noPoster.join(', ') : 'nessuno'}`);
  const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
  console.log(`\nScritto ${OUT} (${kb(OUT)}) — caricato all'avvio`);
  console.log(`Scritto ${OUT_DETAILS} (${kb(OUT_DETAILS)}) — caricato alla prima scheda`);
}

run().catch(e => { console.error(e); process.exit(1); });
