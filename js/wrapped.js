/* ==========================================================
   WRAPPED — le tue statistiche in card da condividere

   Tutto nasce da due sorgenti già presenti: il catalogo e lo stato
   salvato in localStorage. Nessuna rete, nessun server.

   Le card sono disegnate su <canvas> usando le locandine vere, già
   in cache dal catalogo: l'anteprima che vedi È l'immagine che
   condividi, quindi non c'è modo che le due divergano. Le miniature
   sono lo stesso disegno a scala ridotta.
   ========================================================== */

/* Tela di riferimento 4:5 — passa intera nel feed di Instagram e
   resta leggibile anche buttata in una storia. Il 1080x1920 nel
   feed verrebbe tagliato. */
const W_CANVAS_W = 1080;
const W_CANVAS_H = 1350;
const W_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/* Quanto grande decodificare le locandine, per tipo di composizione.
   Si chiede sempre il w342 (l'unico formato che il catalogo ha già in
   cache, quindi l'unico che funziona offline) e lo si rimpicciolisce
   in memoria: tenere 40 immagini a piena risoluzione costerebbe
   decine di MB su un telefono. */
const W_ART_SIZE = {
  collage: [216, 324],
  grid:    [112, 168],
  fan:     [312, 468],
  duo:     [352, 528],
  chips:   [ 76, 114],
  strips:  [124, 186],
};

/* ==========================================================
   1. I NUMERI
   ========================================================== */
function computeWrapped(){
  const watched = ITEMS.filter(it => getStatus(it.id) === 'watched');
  const todo    = ITEMS.filter(it => getStatus(it.id) === 'todo');

  /* I due titoli non ancora usciti non hanno durata: restano fuori dal
     monte ore invece di entrarci come zero silenzioso. */
  const sumMin = list => list.reduce((a, it) => a + (it.totalMinutes || 0), 0);

  const byUniverse = new Map();
  ITEMS.forEach(it => {
    if(!byUniverse.has(it.universe)) byUniverse.set(it.universe, { tot:0, seen:0, items:[] });
    const u = byUniverse.get(it.universe);
    u.tot++;
    u.items.push(it);
    if(getStatus(it.id) === 'watched') u.seen++;
  });

  const bySaga = new Map();
  ITEMS.filter(it => it.saga).forEach(it => {
    if(!bySaga.has(it.saga)) bySaga.set(it.saga, { tot:0, seen:0, items:[] });
    const s = bySaga.get(it.saga);
    s.tot++;
    s.items.push(it);
    if(getStatus(it.id) === 'watched') s.seen++;
  });

  const byYear = watched.slice().sort((a, b) =>
    (a.actualYear || a.year) - (b.actualYear || b.year));

  return {
    watched:  watched.length,
    skipped:  ITEMS.filter(it => getStatus(it.id) === 'skipped').length,
    todo:     todo.length,
    total:    ITEMS.length,
    minutes:  sumMin(watched),
    todoMin:  sumMin(todo),
    episodes: watched.reduce((a, it) => a + (it.episodes || 0), 0),
    watchedItems: watched,
    todoItems:    todo,
    oldest:   byYear[0] || null,
    newest:   byYear[byYear.length - 1] || null,
    byUniverse,
    bySaga,
  };
}

/* ---------- formattazione ---------- */
const wNum = n => Number(n).toLocaleString('it-IT');
const wPlural = (n, uno, molti) => (n === 1 ? uno : molti);
const wYear = it => (it ? (it.actualYear || it.year) : null);

/* Il monte ore raccontato in giorni: "525 ore" dice poco, "21 giorni
   filati" si capisce al volo. */
function wDurationCaption(min){
  const h = Math.round(min / 60);
  if(h < 24) return 'Meno di un giorno filato.';
  const d  = Math.floor(h / 24);
  const rh = h % 24;
  const giorni = `${d} ${wPlural(d, 'giorno', 'giorni')}`;
  if(rh === 0) return `${giorni} di fila, senza mai dormire.`;
  return `${giorni} e ${rh} ${wPlural(rh, 'ora', 'ore')} di fila, senza mai dormire.`;
}

/* Campiona n elementi distribuiti su tutta la lista invece dei primi n:
   così una griglia di locandine racconta l'intero arco del catalogo e
   non solo gli anni Quaranta. */
function wPick(list, n){
  if(list.length <= n) return list.slice();
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
}

/* Il titolo più riconoscibile di un gruppo: quello con più voti su TMDB */
function wMostKnown(list){
  return list.slice().sort((a, b) => (b.votes || 0) - (a.votes || 0))[0] || null;
}

/* ==========================================================
   2. CARICAMENTO DELLE LOCANDINE
   ========================================================== */
const wPosterCache = new Map();

/* crossOrigin='anonymous' non serve a mostrare l'immagine, serve a
   poterla ridisegnare su un canvas esportabile: senza, il canvas
   risulta contaminato e toBlob() fallisce. */
function wDecodeCors(src){
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';
  img.src = src;
  return img.decode().then(() => img);
}

async function wLoadPoster(item, w, h){
  const url = posterUrl(item);          // w342: l'unico formato già in cache
  if(!url) return null;
  const key = `${url}@${w}`;
  if(wPosterCache.has(key)) return wPosterCache.get(key);

  let out = null;
  try{
    let img;
    try{
      img = await wDecodeCors(url);
    }catch(e){
      /* Chi ha già visitato il sito può avere in cache HTTP la stessa
         locandina scaricata senza CORS: riusata qui fa fallire la
         decodifica, e un URL diverso forza una richiesta pulita.
         Con un service worker attivo però il problema è già risolto a
         monte (POSTER_CACHE contiene solo risposte CORS), quindi un
         secondo tentativo non aggiungerebbe nulla e lascerebbe in cache
         una copia inutile di ogni locandina: qui l'errore è transitorio
         e si preferisce ripiegare sul gradiente. */
      if(navigator.serviceWorker && navigator.serviceWorker.controller) throw e;
      img = await wDecodeCors(url + (url.includes('?') ? '&' : '?') + 'cors=1');
    }
    out = img;
    // decodifica ridotta dove disponibile: stessa resa, memoria irrisoria
    if(window.createImageBitmap){
      try{
        out = await createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
      }catch(e){ /* si tiene l'immagine a piena risoluzione */ }
    }
  }catch(e){
    // locandina assente o rete caduta: si ripiega sul gradiente. Il
    // fallimento non si memorizza, così un nuovo tentativo più tardi
    // può riuscire invece di restare a vuoto per tutta la sessione.
    return null;
  }
  wPosterCache.set(key, out);
  return out;
}

/* Le locandine che una composizione deve caricare, appiattite in un
   unico elenco così il caricamento è una sola Promise.all. */
function wArtItems(art){
  switch(art.kind){
    case 'grid':   return art.tiles.map(t => t.item);
    case 'chips':  return art.rows.map(r => r.item).filter(Boolean);
    case 'strips': return art.rows.flatMap(r => r.items);
    case 'duo':    return [art.a, art.b].filter(Boolean);
    default:       return art.items || [];
  }
}

async function wLoadArt(art){
  if(!art) return art;
  const [w, h] = W_ART_SIZE[art.kind] || [216, 324];
  const items = wArtItems(art);
  const assets = new Map();
  await Promise.all(items.map(async it => {
    assets.set(it.id, await wLoadPoster(it, w, h));
  }));
  art.assets = assets;
  return art;
}

/* ==========================================================
   3. PRIMITIVE DI DISEGNO
   ========================================================== */

/* Maiuscolette spaziate. Dove il canvas conosce letterSpacing lo si usa,
   perché tiene conto della crenatura; il ripiego disegna carattere per
   carattere, ma arrotondando ogni avanzamento la spaziatura risulta
   visibilmente irregolare, quindi resta l'ultima scelta. */
function wTracked(ctx, text, x, y, spacing, align){
  const centered = align === 'center';
  if('letterSpacing' in ctx){
    const prevSpacing = ctx.letterSpacing;
    const prevAlign = ctx.textAlign;
    ctx.letterSpacing = spacing + 'px';
    ctx.textAlign = centered ? 'center' : 'left';
    // lo spazio viene aggiunto anche dopo l'ultimo carattere: senza
    // questa correzione il testo centrato risulta spostato a sinistra
    ctx.fillText(text, centered ? x + spacing / 2 : x, y);
    ctx.textAlign = prevAlign;
    ctx.letterSpacing = prevSpacing;
    return;
  }
  const chars = [...text];
  const width = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = centered ? x - width / 2 : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach(c => {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  });
  ctx.textAlign = prevAlign;
}

function wRoundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function wWrapLines(ctx, text, maxW){
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if(ctx.measureText(test).width > maxW && line){ lines.push(line); line = word; }
    else line = test;
  });
  if(line) lines.push(line);
  return lines;
}

/* Grana: un riquadro di rumore generato una volta e ripetuto. Toglie
   alle campiture piatte quell'aria di gradiente CSS. */
let wGrainTile = null;
function wGrain(ctx){
  if(!wGrainTile){
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const data = g.createImageData(128, 128);
    for(let i = 0; i < data.data.length; i += 4){
      const v = 110 + Math.random() * 90;
      data.data[i] = data.data[i+1] = data.data[i+2] = v;
      data.data[i+3] = 255;
    }
    g.putImageData(data, 0, 0);
    wGrainTile = c;
  }
  ctx.save();
  ctx.globalAlpha = .055;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(wGrainTile, 'repeat');
  ctx.fillRect(0, 0, W_CANVAS_W, W_CANVAS_H);
  ctx.restore();
}

/* Una locandina con angoli tondi. Se manca (offline, o titolo senza
   poster) si ripiega sul gradiente del franchise già usato dalle card
   del sito, così il buco non si nota. */
function wPosterTile(ctx, art, item, x, y, w, h, r, opts){
  opts = opts || {};
  const asset = art.assets ? art.assets.get(item.id) : null;

  if(opts.shadow){
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.72)';
    ctx.shadowBlur = opts.shadow;
    ctx.shadowOffsetY = opts.shadow * .32;
    ctx.fillStyle = '#000';
    wRoundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  wRoundRect(ctx, x, y, w, h, r);
  ctx.clip();
  if(asset){
    if(opts.alpha != null) ctx.globalAlpha = opts.alpha;
    ctx.drawImage(asset, x, y, w, h);
    ctx.globalAlpha = 1;
  }else{
    const st = styleFor(item);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, st.from);
    g.addColorStop(1, st.to);
    ctx.fillStyle = g;
    ctx.globalAlpha = opts.alpha != null ? opts.alpha : 1;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }
  if(opts.dim){
    ctx.fillStyle = `rgba(0,0,0,${opts.dim})`;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  if(opts.stroke){
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.5;
    wRoundRect(ctx, x + .75, y + .75, w - 1.5, h - 1.5, r);
    ctx.stroke();
  }
}

function wRotatedPoster(ctx, art, item, cx, cy, w, h, deg){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(deg * Math.PI / 180);
  wPosterTile(ctx, art, item, -w/2, -h/2, w, h, 20, { shadow: 46, stroke: true });
  ctx.restore();
}

/* Barra di avanzamento rossa→oro, usata da più composizioni */
function wBar(ctx, x, y, w, h, pct){
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  wRoundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if(pct > 0){
    const fw = Math.max(h, w * pct);
    const g = ctx.createLinearGradient(x, 0, x + fw, 0);
    g.addColorStop(0, '#ED1D24');
    g.addColorStop(1, '#F5B942');
    ctx.fillStyle = g;
    wRoundRect(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

/* Pannello scuro traslucido: dà al testo un fondo su cui restare
   leggibile anche sopra le locandine. */
function wPanel(ctx, x, y, w, h, r){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = 'rgba(7,7,9,.88)';
  wRoundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.11)';
  ctx.lineWidth = 1.5;
  wRoundRect(ctx, x + .75, y + .75, w - 1.5, h - 1.5, r);
  ctx.stroke();
}

/* ==========================================================
   4. LE COMPOSIZIONI DI LOCANDINE
   ========================================================== */
function wArtCollage(ctx, art){
  const cols = 6, rows = 5;
  const tw = W_CANVAS_W / cols, th = W_CANVAS_H / rows;
  art.items.forEach((it, i) => {
    if(i >= cols * rows) return;
    const x = (i % cols) * tw, y = Math.floor(i / cols) * th;
    wPosterTile(ctx, art, it, x, y, tw, th, 0, { alpha: .42 });
  });
  // scurita generale: le locandine devono restare texture, non soggetto
  const g = ctx.createLinearGradient(0, 0, 0, W_CANVAS_H);
  g.addColorStop(0,   'rgba(0,0,0,.72)');
  g.addColorStop(.42, 'rgba(0,0,0,.52)');
  g.addColorStop(1,   'rgba(0,0,0,.86)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W_CANVAS_W, W_CANVAS_H);
}

function wArtGrid(ctx, art){
  const cols = 8, rows = 5, gap = 10, x0 = 100, y0 = 252;
  const tw = (880 - gap * (cols - 1)) / cols;
  const th = tw * 1.5;
  art.tiles.forEach((t, i) => {
    if(i >= cols * rows) return;
    const x = x0 + (i % cols) * (tw + gap);
    const y = y0 + Math.floor(i / cols) * (th + gap);
    // i non visti restano in filigrana: la differenza si legge a colpo d'occhio
    wPosterTile(ctx, art, t.item, x, y, tw, th, 8,
      t.seen ? { stroke: true } : { alpha: .20, dim: .35 });
  });
}

function wArtChips(ctx, art){
  const rows = art.rows.length;
  const rowH = 100, x0 = 100, right = 980;
  let y = 292;
  art.rows.forEach(r => {
    if(r.item) wPosterTile(ctx, art, r.item, x0, y + 2, 60, 90, 8, { stroke: true });

    ctx.textAlign = 'left';
    ctx.fillStyle = '#F5F5F7';
    ctx.font = `600 34px ${W_FONT}`;
    ctx.fillText(r.label, x0 + 82, y + 38);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(235,235,245,.62)';
    ctx.font = `600 32px ${W_FONT}`;
    ctx.fillText(`${r.seen}/${r.tot}`, right, y + 38);

    wBar(ctx, x0 + 82, y + 56, right - x0 - 82, 16, r.tot ? r.seen / r.tot : 0);
    y += rowH;
  });
  return y;
}

function wArtStrips(ctx, art){
  let y = 300;
  art.rows.forEach(r => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F5F5F7';
    ctx.font = `700 46px ${W_FONT}`;
    ctx.fillText(r.label, 100, y + 44);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#F5B942';
    ctx.font = `700 44px ${W_FONT}`;
    ctx.fillText(`${r.seen}/${r.tot}`, 980, y + 44);

    wBar(ctx, 100, y + 70, 880, 22, r.tot ? r.seen / r.tot : 0);

    const n = r.items.length;
    const pw = 124, ph = 186, gap = 20;
    const total = n * pw + (n - 1) * gap;
    let x = (W_CANVAS_W - total) / 2;
    r.items.forEach(it => {
      const seen = getStatus(it.id) === 'watched';
      wPosterTile(ctx, art, it, x, y + 124, pw, ph, 12,
        seen ? { stroke: true, shadow: 24 } : { alpha: .22, dim: .4 });
      x += pw + gap;
    });
    y += 380;
  });
}

function wArtFan(ctx, art){
  const pw = 312, ph = 468;
  const spread = [-2, -1, 0, 1, 2];
  const n = Math.min(art.items.length, 5);
  const use = art.items.slice(0, n);
  // si disegna dai bordi verso il centro, così la locandina centrale
  // resta sopra tutte le altre
  const order = use.map((it, i) => i).sort((a, b) =>
    Math.abs(spread[b] || 0) - Math.abs(spread[a] || 0));
  order.forEach(i => {
    const k = spread[i] != null ? spread[i] : 0;
    wRotatedPoster(ctx, art, use[i], 540 + k * 152, 520 + Math.abs(k) * 22, pw, ph, k * 7);
  });
}

function wArtDuo(ctx, art){
  const pw = 352, ph = 528;
  if(art.a) wPosterTile(ctx, art, art.a, 104, 296, pw, ph, 20, { shadow: 46, stroke: true });
  if(art.b) wPosterTile(ctx, art, art.b, 624, 296, pw, ph, 20, { shadow: 46, stroke: true });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F5B942';
  ctx.font = `700 44px ${W_FONT}`;
  if(art.a) ctx.fillText(wYear(art.a), 104 + pw / 2, 888);
  if(art.b) ctx.fillText(wYear(art.b), 624 + pw / 2, 888);

  ctx.fillStyle = 'rgba(235,235,245,.34)';
  ctx.font = `600 26px ${W_FONT}`;
  if(art.a) wTracked(ctx, 'IL PIÙ VECCHIO', 104 + pw / 2, 932, 4, 'center');
  if(art.b) wTracked(ctx, 'IL PIÙ RECENTE', 624 + pw / 2, 932, 4, 'center');
}

/* ==========================================================
   5. LE CARD
   ========================================================== */
const WRAP_CARDS = [
  {
    id: 'ore',
    label: 'Ore guardate',
    ok: s => s.minutes > 0,
    spec: s => ({
      kicker: 'Ho guardato',
      value:  wNum(Math.round(s.minutes / 60)),
      unit:   'ore di Marvel',
      caption: wDurationCaption(s.minutes),
      panel: [90, 418, 900, 560],
      kickerY: 508, captionY: 926,
      art: { kind: 'collage', items: wPick(s.watchedItems, 30) },
    }),
    share: s => `Ho guardato ${wNum(Math.round(s.minutes/60))} ore di Marvel.`,
  },
  {
    id: 'completamento',
    label: 'Completamento',
    ok: s => s.watched > 0,
    spec: s => ({
      kicker:  'Archivio completato',
      value:   Math.round((s.watched / s.total) * 100) + '%',
      unit:    `${wNum(s.watched)} titoli su ${wNum(s.total)}`,
      caption: s.watched === s.total
        ? 'Archivio completo. Non manca più niente.'
        : 'In chiaro quelli visti, in ombra quelli che mancano.',
      panel: [190, 520, 700, 296],
      valueY: 700, unitY: 772, valueSize: 150, captionY: 1152,
      art: { kind: 'grid', tiles: wPick(ITEMS, 40).map(it => ({ item: it, seen: getStatus(it.id) === 'watched' })) },
    }),
    share: s => `Ho visto ${s.watched} titoli Marvel su ${s.total}.`,
  },
  {
    id: 'universi',
    label: 'Per universo',
    ok: s => s.watched > 0,
    spec: s => ({
      kicker: 'I miei universi',
      caption: `${wNum(s.watched)} titoli su ${wNum(s.total)}, in tutto l'archivio.`,
      captionY: 1180,
      art: {
        kind: 'chips',
        rows: [...s.byUniverse.entries()]
          .map(([name, v]) => ({
            label: UNIVERSE_SHORT[name] || name,
            seen:  v.seen,
            tot:   v.tot,
            item:  wMostKnown(v.items),
          }))
          .sort((a, b) => (b.seen / b.tot) - (a.seen / a.tot)),
      },
    }),
    share: () => 'Il mio archivio Marvel, universo per universo.',
  },
  {
    id: 'episodi',
    label: 'Episodi',
    ok: s => s.episodes > 0,
    spec: s => ({
      kicker:  'Ho visto',
      value:   wNum(s.episodes),
      unit:    wPlural(s.episodes, 'episodio di serie Marvel', 'episodi di serie Marvel'),
      caption: 'Contando ogni stagione, una per una.',
      valueY: 990, unitY: 1058, captionY: 1148, valueSize: 190,
      art: { kind: 'fan', items: wPick(s.watchedItems.filter(it => it.episodes > 0), 5) },
    }),
    share: s => `Ho visto ${wNum(s.episodes)} episodi di serie Marvel.`,
  },
  {
    id: 'saghe',
    label: 'Saghe MCU',
    // due barre a zero non raccontano niente: serve almeno un titolo visto
    ok: s => [...s.bySaga.values()].some(v => v.seen > 0),
    spec: s => ({
      kicker:  'Le saghe',
      caption: 'Infinity e Multiverse, titolo per titolo.',
      captionY: 1150,
      art: {
        kind: 'strips',
        rows: ['Infinity Saga', 'Multiverse Saga']
          .filter(name => s.bySaga.has(name))
          .map(name => ({
            label: name.replace(' Saga', ''),
            seen:  s.bySaga.get(name).seen,
            tot:   s.bySaga.get(name).tot,
            items: wPick(s.bySaga.get(name).items, 6),
          })),
      },
    }),
    share: () => "A che punto sono con le saghe dell'MCU.",
  },
  {
    id: 'arco',
    label: 'Arco temporale',
    ok: s => s.oldest && s.newest && wYear(s.newest) > wYear(s.oldest),
    spec: s => ({
      kicker: `Dal ${wYear(s.oldest)} al ${wYear(s.newest)}`,
      value:  wNum(wYear(s.newest) - wYear(s.oldest)),
      unit:   'anni di Marvel',
      valueY: 1080, unitY: 1146, valueSize: 170,
      art: { kind: 'duo', a: s.oldest, b: s.newest },
    }),
    share: s => `Dal ${wYear(s.oldest)} al ${wYear(s.newest)}: ${wYear(s.newest) - wYear(s.oldest)} anni di Marvel.`,
  },
  {
    id: 'manca',
    label: 'Quanto manca',
    // "mi restano 184 titoli" da chi non ha segnato niente non è una statistica
    ok: s => s.watched > 0 && s.todo > 0,
    spec: s => ({
      kicker:  'Mi restano',
      value:   wNum(s.todo),
      unit:    wPlural(s.todo, 'titolo da vedere', 'titoli da vedere'),
      caption: s.todoMin > 0
        ? `Circa ${wNum(Math.round(s.todoMin / 60))} ore. Il tempo c'è.`
        : "Il tempo c'è.",
      valueY: 990, unitY: 1058, captionY: 1148, valueSize: 190,
      art: { kind: 'fan', items: wPick(s.todoItems, 5) },
    }),
    share: s => `Mi restano ${wNum(s.todo)} titoli Marvel da vedere.`,
  },
];

/* ==========================================================
   6. DISEGNO DELLA CARD
   Tutto è pensato in uno spazio 1080x1350 e poi scalato: miniature
   e immagine finale usano lo stesso identico codice.
   ========================================================== */
function wDrawCard(canvas, spec, scale){
  const ctx = canvas.getContext('2d');
  canvas.width  = Math.round(W_CANVAS_W * scale);
  canvas.height = Math.round(W_CANVAS_H * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const CX = W_CANVAS_W / 2;
  const art = spec.art;

  /* ---------- fondo ---------- */
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W_CANVAS_W, W_CANVAS_H);

  if(art && art.kind === 'collage') wArtCollage(ctx, art);

  // alone rosso in alto, oro in basso: profondità senza schiarire i bordi
  const g1 = ctx.createRadialGradient(CX, 180, 0, CX, 180, 940);
  g1.addColorStop(0,   'rgba(237,29,36,.30)');
  g1.addColorStop(.55, 'rgba(168,18,26,.09)');
  g1.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W_CANVAS_W, W_CANVAS_H);

  const g2 = ctx.createRadialGradient(CX, W_CANVAS_H, 0, CX, W_CANVAS_H, 720);
  g2.addColorStop(0, 'rgba(245,185,66,.14)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W_CANVAS_W, W_CANVAS_H);

  /* ---------- composizione di locandine ---------- */
  if(art){
    if(art.kind === 'grid')   wArtGrid(ctx, art);
    if(art.kind === 'chips')  wArtChips(ctx, art);
    if(art.kind === 'strips') wArtStrips(ctx, art);
    if(art.kind === 'fan')    wArtFan(ctx, art);
    if(art.kind === 'duo')    wArtDuo(ctx, art);
  }

  wGrain(ctx);

  /* ---------- pannello di leggibilità ---------- */
  if(spec.panel) wPanel(ctx, spec.panel[0], spec.panel[1], spec.panel[2], spec.panel[3], 40);

  /* ---------- cornice ---------- */
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 2;
  wRoundRect(ctx, 28, 28, W_CANVAS_W - 56, W_CANVAS_H - 56, 44);
  ctx.stroke();

  /* ---------- intestazione ---------- */
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#F5B942';
  ctx.font = `700 26px ${W_FONT}`;
  wTracked(ctx, 'MARVEL DATABASE', CX, 122, 7, 'center');

  /* ---------- occhiello ---------- */
  ctx.fillStyle = 'rgba(235,235,245,.72)';
  ctx.font = `600 34px ${W_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(spec.kicker, CX, spec.kickerY || 214);

  /* ---------- numero gigante ---------- */
  if(spec.value){
    const len  = spec.value.length;
    const auto = len <= 2 ? 280 : len === 3 ? 240 : len === 4 ? 200 : 165;
    const size = spec.valueSize || auto;
    const vy   = spec.valueY || 738;

    ctx.fillStyle = '#F5F5F7';
    ctx.font = `800 ${size}px ${W_FONT}`;
    ctx.fillText(spec.value, CX, vy);

    ctx.fillStyle = '#F5B942';
    ctx.font = `600 38px ${W_FONT}`;
    ctx.fillText(spec.unit, CX, spec.unitY || (vy + 74));
  }

  /* ---------- didascalia ---------- */
  if(spec.caption){
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(235,235,245,.60)';
    ctx.font = `500 32px ${W_FONT}`;
    const baseY = spec.captionY || 1160;
    const lines = wWrapLines(ctx, spec.caption, W_CANVAS_W - 260);
    lines.forEach((line, i) => ctx.fillText(line, CX, baseY + i * 44 - (lines.length - 1) * 44));
  }

  /* ---------- piede ---------- */
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(235,235,245,.40)';
  ctx.font = `500 26px ${W_FONT}`;
  ctx.fillText(wSiteUrl(), CX, 1272);
}

/* L'indirizzo scritto sulla card: quello vero se il sito è pubblicato,
   altrimenti quello di GitHub Pages (aprendo il file col doppio click
   `location.host` è vuoto). */
function wSiteUrl(){
  if(location.protocol.startsWith('http') && location.host){
    return (location.host + location.pathname).replace(/\/index\.html$/, '/').replace(/\/$/, '');
  }
  return 'gxmich.github.io/marvel-database';
}

/* ==========================================================
   7. INTERFACCIA
   ========================================================== */
const wrapBackdrop = document.getElementById('wrapBackdrop');
const wrapPicker   = document.getElementById('wrapPicker');
const wrapStage    = document.getElementById('wrapStage');
const wrapHolder   = document.getElementById('wrapCanvasHolder');
const wrapEmpty    = document.getElementById('wrapEmpty');
const wrapNote     = document.getElementById('wrapNote');
const wrapIntro    = document.getElementById('wrapIntro');
const wrapLoading  = document.getElementById('wrapLoading');

/* Il file dell'immagine si prepara appena si apre l'anteprima, non al
   clic su Condividi: Safari considera scaduto il gesto dell'utente se
   nel mezzo c'è un'attesa, e rifiuterebbe la condivisione. */
let wrapCurrent = null;   // { card, spec, file }
let wrapToken = 0;        // annulla il lavoro in corso se si riapre il pannello

async function openWrapped(){
  const token = ++wrapToken;
  const stats = computeWrapped();
  const usable = WRAP_CARDS.filter(c => c.ok(stats));

  wrapStage.hidden   = true;
  wrapEmpty.hidden   = usable.length > 0;
  wrapIntro.hidden   = usable.length === 0;
  wrapPicker.hidden  = true;
  wrapLoading.hidden = usable.length === 0;
  wrapPicker.innerHTML = '';
  wrapBackdrop.classList.add('show');

  if(!usable.length) return;

  const specs = usable.map(card => card.spec(stats));
  await Promise.all(specs.map(sp => wLoadArt(sp.art)));
  if(token !== wrapToken) return;         // pannello richiuso nel frattempo

  usable.forEach((card, i) => {
    const btn = document.createElement('button');
    btn.className = 'wrap-thumb';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Anteprima card: ${card.label}`);

    const cv = document.createElement('canvas');
    // miniature disegnate piccole: sette tele a piena risoluzione
    // occuperebbero decine di MB di memoria su un telefono
    wDrawCard(cv, specs[i], 0.26);
    btn.appendChild(cv);

    const cap = document.createElement('span');
    cap.className = 'wrap-thumb-label';
    cap.textContent = card.label;
    btn.appendChild(cap);

    btn.addEventListener('click', () => selectWrapCard(card, specs[i]));
    wrapPicker.appendChild(btn);
  });

  wrapLoading.hidden = true;
  wrapPicker.hidden  = false;
}

function closeWrapped(){
  wrapBackdrop.classList.remove('show');
  wrapToken++;
  wrapCurrent = null;
}

function backToPicker(){
  wrapStage.hidden  = true;
  wrapPicker.hidden = false;
  wrapIntro.hidden  = false;
  wrapCurrent = null;
}

async function selectWrapCard(card, spec){
  wrapPicker.hidden = true;
  wrapIntro.hidden  = true;
  wrapStage.hidden  = false;
  wrapNote.textContent = '';

  wrapHolder.innerHTML = '';
  const cv = document.createElement('canvas');
  cv.className = 'wrap-canvas';
  wDrawCard(cv, spec, 1);
  wrapHolder.appendChild(cv);

  wrapCurrent = { card, spec, file: null };
  const mine = wrapCurrent;

  // il PNG si prepara subito, così il tasto Condividi è istantaneo
  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if(!blob || wrapCurrent !== mine) return;
  wrapCurrent.file = new File([blob], `marvel-${card.id}.png`, { type: 'image/png' });
}

function wrapShareText(){
  return `${wrapCurrent.card.share(computeWrapped())}\n${wSiteUrl()}`;
}

async function shareWrapCard(){
  if(!wrapCurrent || !wrapCurrent.file){
    wrapNote.textContent = 'Immagine ancora in preparazione, riprova tra un istante.';
    return;
  }
  const data = { files: [wrapCurrent.file], text: wrapShareText() };

  /* navigator.share con i file c'è solo su mobile e solo in HTTPS.
     Altrove si scarica il PNG: il risultato per l'utente è lo stesso,
     cambia solo il numero di passaggi. */
  if(navigator.canShare && navigator.canShare({ files: data.files })){
    try{
      await navigator.share(data);
      return;
    }catch(err){
      if(err.name === 'AbortError') return;   // annullato: nessun errore da mostrare
    }
  }
  downloadWrapCard();
  wrapNote.textContent = 'Su questo dispositivo la condivisione diretta non è disponibile: la card è stata scaricata.';
}

function downloadWrapCard(){
  if(!wrapCurrent || !wrapCurrent.file) return;
  const url = URL.createObjectURL(wrapCurrent.file);
  const a = document.createElement('a');
  a.href = url;
  a.download = wrapCurrent.file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Card salvata tra i download.');
}

/* ---------- collegamenti ---------- */
document.getElementById('wrapOpenBtn').addEventListener('click', openWrapped);
document.getElementById('wrapCloseBtn').addEventListener('click', closeWrapped);
document.getElementById('wrapBackBtn').addEventListener('click', backToPicker);
document.getElementById('wrapShareBtn').addEventListener('click', shareWrapCard);
document.getElementById('wrapDownloadBtn').addEventListener('click', downloadWrapCard);
wrapBackdrop.addEventListener('click', e => { if(e.target === wrapBackdrop) closeWrapped(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeWrapped(); });
