/* ============================================================
   GENERATORE ICONE PWA
   Scrive PNG veri (niente dipendenze: solo zlib di Node) partendo
   da una rasterizzazione a mano del logo: quadrato nero stondato
   con la stella rossa dell'intestazione.

   Uso:  node tools/make-icons.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT_DIR = path.join(process.cwd(), 'assets', 'icons');

/* ---------- PNG minimo ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* rgba: Uint8Array di size*size*4 */
function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colore RGBA
  // 10,11,12 restano 0: deflate, filtro standard, non interlacciato

  // ogni riga è preceduta dal byte di filtro (0 = nessuno)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy
      ? rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
      : Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, rowStart + 1);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- disegno ---------- */
/* stella a 5 punte: la si costruisce come poligono e si riempie
   con il test punto-dentro-poligono */
function starPolygon(cx, cy, rOuter, rInner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* opts.padding: margine interno (per l'icona "maskable", che viene
   ritagliata a cerchio dai launcher Android) */
function drawIcon(size, opts = {}) {
  const pad = opts.padding ?? 0;
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;                 // stondatura del quadrato
  const inner = size - pad * 2;
  const star = starPolygon(size / 2, size / 2 + inner * 0.012, inner * 0.30, inner * 0.135);

  // antialiasing per campionamento: 3x3 sotto-pixel
  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0, st = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          // quadrato stondato
          const dx = Math.max(pad + radius - px, 0, px - (size - pad - radius));
          const dy = Math.max(pad + radius - py, 0, py - (size - pad - radius));
          if (Math.hypot(dx, dy) <= radius) bg++;
          if (inPolygon(px, py, star)) st++;
        }
      }
      const total = SS * SS;
      const aBg = bg / total;
      const aSt = st / total;

      // fondo quasi nero, stella rossa Marvel
      const r = Math.round(10 * (1 - aSt) + 237 * aSt);
      const g = Math.round(10 * (1 - aSt) + 29 * aSt);
      const b = Math.round(12 * (1 - aSt) + 36 * aSt);
      const a = Math.round(255 * Math.max(aBg, aSt * aBg));

      const i = (y * size + x) * 4;
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
    }
  }
  return encodePNG(size, rgba);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const jobs = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  // maskable: il launcher ritaglia i bordi, quindi il soggetto sta più al centro
  { file: 'icon-maskable-512.png', size: 512, padding: 52 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0 },
];

for (const j of jobs) {
  const png = drawIcon(j.size, { padding: j.padding });
  fs.writeFileSync(path.join(OUT_DIR, j.file), png);
  console.log(`  ${j.file.padEnd(26)} ${j.size}x${j.size}  ${(png.length / 1024).toFixed(1)} KB`);
}
console.log(`\nScritte ${jobs.length} icone in ${OUT_DIR}`);
