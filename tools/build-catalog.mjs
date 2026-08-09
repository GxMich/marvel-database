/* ============================================================
   BUILD CATALOG
   Prende la tassonomia curata (master-list.mjs), la incrocia con
   TMDB per i dati fattuali e scrive js/data/catalog.js.

   Uso:  node tools/build-catalog.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { MASTER } from './master-list.mjs';

const API_KEY = 'f48755194795d3e68c657d5262d7d17d';
const BASE = 'https://api.themoviedb.org/3';
const OUT = path.join(process.cwd(), 'js', 'data', 'catalog.js');

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

const report = { ok: [], missing: [], yearMismatch: [], suspicious: [], noDuration: [] };

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

  const details = await tmdb(`/${isTv ? 'tv' : 'movie'}/${best.id}`, { language: 'it-IT' });

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

  // in it-IT alcuni titoli non hanno poster: si ripiega sulla lingua originale
  if (!poster) {
    const fallback = await tmdb(`/${isTv ? 'tv' : 'movie'}/${best.id}`, {});
    poster = fallback.poster_path || null;
  }

  const releaseDate = isTv ? details.first_air_date : details.release_date;
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : entry.y;

  const epRuntime = isTv ? await episodeRuntime(details, best.id, seasonInfo) : null;
  const episodes = seasonInfo ? seasonInfo.episodes : (isTv ? details.number_of_episodes || null : null);
  const minutes = totalMinutes(isTv, details, seasonInfo, epRuntime, episodes);

  report.ok.push(entry.q);
  if (!minutes) report.noDuration.push(`${entry.q} (${entry.y})`);

  return {
    id: slugify(`${entry.it || details.title || details.name}-${entry.y}${entry.s ? '-s' + entry.s : ''}`),
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
    overview: details.overview || '',
    // per i film è la durata del film, per le serie quella di un episodio
    runtime: isTv ? epRuntime : (details.runtime || null),
    totalMinutes: minutes,
    seasons: isTv ? (details.number_of_seasons || null) : null,
    episodes,
    season: entry.s || null,
    poster: poster || null,
    backdrop: details.backdrop_path || null,
    platform: entry.pl || '',
    essential: !!entry.e,
    chronoOrder: entry.co ?? null,
    chronoLabel: entry.cl || null,
  };
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

  const catalog = out.filter(Boolean);

  // controllo duplicati
  const seen = new Map();
  const dups = [];
  catalog.forEach(c => {
    const key = `${c.tmdbType}:${c.tmdbId}:${c.season || ''}`;
    if (seen.has(key)) dups.push(`${c.title} (${c.year}) == ${seen.get(key)}`);
    else seen.set(key, `${c.title} (${c.year})`);
  });

  const header = `/* ============================================================
   CATALOGO MARVEL — generato da tools/build-catalog.mjs
   NON modificare a mano: rigenera con \`node tools/build-catalog.mjs\`.
   Tassonomia curata in tools/master-list.mjs, dati fattuali da TMDB.
   Generato il ${new Date().toISOString().slice(0, 10)} — ${catalog.length} titoli.
   ============================================================ */
const CATALOG = `;

  fs.writeFileSync(OUT, header + JSON.stringify(catalog, null, 1) + ';\n', 'utf8');

  console.log(`\n\n=== RISULTATO ===`);
  console.log(`Risolti : ${catalog.length}/${MASTER.length}`);
  console.log(`Duplicati: ${dups.length ? '\n  - ' + dups.join('\n  - ') : 'nessuno'}`);
  if (report.missing.length) console.log(`\nNON TROVATI (${report.missing.length}):\n  - ` + report.missing.join('\n  - '));
  if (report.yearMismatch.length) console.log(`\nDA VERIFICARE (${report.yearMismatch.length}):\n  - ` + report.yearMismatch.join('\n  - '));
  if (report.noDuration.length) console.log(`\nSENZA DURATA (${report.noDuration.length}) — escluse dal monte ore:\n  - ` + report.noDuration.join('\n  - '));

  const byType = catalog.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {});
  const byUni = catalog.reduce((a, c) => { a[c.universe] = (a[c.universe] || 0) + 1; return a; }, {});
  const noPoster = catalog.filter(c => !c.poster).map(c => `${c.title} (${c.year})`);
  console.log(`\nPer tipo:`, byType);
  console.log(`Per universo:`, byUni);
  console.log(`Senza poster: ${noPoster.length ? noPoster.join(', ') : 'nessuno'}`);
  console.log(`\nScritto in ${OUT}`);
}

run().catch(e => { console.error(e); process.exit(1); });
