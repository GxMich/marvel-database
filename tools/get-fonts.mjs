/* ============================================================
   GET FONTS
   Scarica in assets/fonts/ i woff2 dei caratteri usati dal sito.

   I font NON si linkano da Google: il sito deve aprirsi con un
   doppio click e funzionare offline, e un @import verso una rete
   che non c'è lascerebbe l'interfaccia in un ripiego di sistema.
   Solo il sottoinsieme `latin`: gli altri alfabeti non servono e
   triplicherebbero il peso.

   Uso:  node tools/get-fonts.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'assets', 'fonts');

/* La CSS API restituisce woff2 solo se chi chiede sa leggerli:
   con uno user agent qualsiasi risponde con i vecchi ttf. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FAMILIES = [
  { css: 'Instrument+Serif:ital@0;1',  name: 'instrument-serif' },
  { css: 'Archivo:wght@400..700',      name: 'archivo' },
  { css: 'JetBrains+Mono:wght@400..700', name: 'jetbrains-mono' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

/* Il file arriva diviso per sottoinsiemi, ciascuno preceduto da un
   commento con il nome: si tiene solo il blocco `latin`. */
function latinBlocks(css) {
  const out = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css))) {
    if (m[1] === 'latin') out.push(m[2]);
  }
  return out;
}

let manifest = [];

for (const fam of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${fam.css}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const blocks = latinBlocks(css);

  if (!blocks.length) {
    console.error(`${fam.name}: nessun blocco latin trovato`);
    process.exit(1);
  }

  let i = 0;
  for (const block of blocks) {
    const src = /src:\s*url\((https:[^)]+\.woff2)\)/.exec(block);
    const style = /font-style:\s*(\w+)/.exec(block);
    const weight = /font-weight:\s*([\d\s]+)/.exec(block);
    if (!src) continue;

    const italic = style && style[1] === 'italic';
    const file = `${fam.name}${italic ? '-italic' : ''}${blocks.length > 2 ? '-' + (++i) : ''}.woff2`;
    const buf = Buffer.from(await (await fetch(src[1])).arrayBuffer());
    fs.writeFileSync(path.join(OUT_DIR, file), buf);

    manifest.push({
      file,
      family: fam.name,
      style: italic ? 'italic' : 'normal',
      weight: weight ? weight[1].trim() : '400',
      kb: (buf.length / 1024).toFixed(1),
    });
    console.log(`  ${file.padEnd(30)} ${(buf.length / 1024).toFixed(1)} KB  ${weight ? weight[1].trim() : '400'} ${italic ? 'italic' : ''}`);
  }
}

const total = manifest.reduce((a, m) => a + Number(m.kb), 0);
console.log(`\n${manifest.length} file, ${total.toFixed(1)} KB in totale.`);
console.log('\nDichiarazioni @font-face da incollare in css/base.css:\n');
console.log(manifest.map(m => `@font-face{
  font-family:"${m.family}";
  src:url("../assets/fonts/${m.file}") format("woff2");
  font-weight:${m.weight};
  font-style:${m.style};
  font-display:swap;
}`).join('\n'));
