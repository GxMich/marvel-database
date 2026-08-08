# Marvel Database

Archivio dei film, delle serie TV e dell'animazione Marvel — **184 titoli** dal 1944 al 2027,
non solo MCU: Sony, Fox, le serie Netflix, i film TV storici e tutta l'animazione.
Segna cosa hai visto o vuoi saltare, filtra per universo/franchise/personaggio, esporta un backup JSON.

Nessuna installazione, nessun server: **apri `index.html` con un doppio click**.

## Struttura

```
marvel/
├── index.html                  # markup della pagina
├── manifest.json               # PWA: nome, icone, colori
├── sw.js                       # service worker: cache e funzionamento offline
├── assets/
│   ├── icons/                  # icone PWA — GENERATE da tools/make-icons.mjs
│   └── video/                  # video di intro
├── css/
│   ├── base.css                # design system: colori, spazio, tipografia, ombre, movimento
│   ├── intro.css               # schermata di apertura
│   ├── layout.css              # hero, barra appiccicata in vetro, controlli
│   ├── components.css          # card, badge, skeleton, modale, toast
│   ├── facets.css              # pannello filtri (desktop + drawer mobile)
│   └── responsive.css          # performance e adattamento mobile
├── js/
│   ├── data/
│   │   ├── catalog.js          # i 184 titoli — GENERATO, non modificare a mano
│   │   └── franchises.js       # icone/colori di riserva + etichette
│   ├── icons.js                # icone SVG inline
│   ├── storage.js              # stato visto/saltato in localStorage
│   ├── posters.js              # URL locandine + precaricamento
│   ├── render.js               # filtri, ricerca, ordinamenti, card
│   ├── controls.js             # pannello filtri, export/import
│   ├── ui.js                   # modale, toast, torna-su, icone
│   ├── intro.js                # video di apertura
│   └── app.js                  # avvio + registrazione service worker
└── tools/
    ├── master-list.mjs         # tassonomia curata a mano
    ├── build-catalog.mjs       # genera catalog.js incrociando con TMDB
    └── make-icons.mjs          # genera le icone PWA (PNG, senza dipendenze)
```

## PWA e funzionamento offline

Il service worker tiene due cache separate, perché i contenuti hanno vite diverse:

- **`marvel-shell-<versione>`** — HTML, CSS, JS, icone. Si svuota quando cambia
  `VERSION` in `sw.js`. Strategia *stale-while-revalidate*: la pagina si apre dalla
  cache e la versione nuova arriva in sottofondo.
- **`marvel-media`** — locandine TMDB e video di intro. Non cambiano mai e pesano
  molto, quindi sopravvivono ai rilasci. Strategia *cache-first*.

Dopo la prima visita l'archivio funziona **completamente offline**, locandine incluse.

Per rigenerare le icone dopo un cambio di logo:

```bash
node tools/make-icons.mjs
```

## Come si aggiorna il catalogo

I dati fattuali (ID TMDB, date, voti, locandine, durata, stato) **non si scrivono a mano**:
si prendono da TMDB. La classificazione editoriale (universo, franchise, fase, personaggi,
tipo di contenuto) sta invece in `tools/master-list.mjs`.

Per aggiungere un titolo: inseriscilo in `master-list.mjs`, poi rigenera:

```bash
node tools/build-catalog.mjs
```

Lo script segnala titoli non trovati, accoppiamenti sospetti, duplicati e poster mancanti.

## Tassonomia

Ogni titolo è classificato su più assi, e può appartenere a più categorie:

| Asse | Valori |
|---|---|
| **Universo** | MCU · Sony's Spider-Man Universe · X-Men/Fox · Marvel Television · Marvel TV/Netflix · Marvel Animation · Pre-MCU · Independent |
| **Tipo** | Film · Serie TV · Film animato · Serie animata · Special · Film TV |
| **Formato** | Live action · Animazione |
| **Stato** | Uscito · In corso · Concluso · In arrivo · Cancellato |
| **Franchise** | 35 (Avengers, Spider-Man, X-Men, Defenders…) |
| **Personaggi** | 59 |
| **Fase MCU** | 1–6, con saga Infinity/Multiverse — solo per i titoli MCU |

I contenuti non ancora usciti sono marcati **In arrivo** e non hanno voto inventato.

## Funzionalità

- **Visto / Saltato** — due stati distinti, contati separatamente
- **Ricerca** — per titolo, personaggio, franchise, universo, anno o genere; ignora trattini
  e punteggiatura (`xmen` trova X-Men, `2019` trova i titoli di quell'anno)
- **Filtri** — pannello laterale su desktop, drawer dal basso su mobile, con contatore
  dei filtri attivi, conteggio risultati e reset
- **Ordinamenti** — anno, ordine narrativo MCU, voto, titolo, stato visione
- **Backup JSON** — esporta/importa; legge anche i backup dei formati precedenti
- **Intro video** — disattivabile dal pannello Info

## Note tecniche

- Gli script sono `<script defer>` classici, **non ES modules**: i moduli vengono bloccati
  dal protocollo `file://` e il sito non si aprirebbe più con un doppio click. Con `defer`
  il download parte subito ma l'esecuzione attende la fine del parsing, quindi non bloccano
  mai il rendering.
- **Quando modifichi CSS o JS aggiorna due numeri**: il `?v=N` nei link dentro `index.html`
  (cache del browser) e la costante `VERSION` in `sw.js` (cache del service worker).
  Altrimenti chi ha già visitato il sito continuerà a vedere la versione vecchia.
- Il foglio di stile dei filtri si chiama `facets.css` e non `filters.css` perché gli
  ad-blocker bloccano i file con quel nome.

## Crediti

Dati e locandine da [TMDB](https://www.themoviedb.org/). Questo prodotto usa le API di TMDB
ma non è approvato o certificato da TMDB.

Fasi MCU, ordine narrativo e tag "Essenziale" sono una curatela editoriale, non un dato
ufficiale Marvel.

Progetto fan non ufficiale. Marvel e i personaggi correlati sono marchi Marvel/Disney.
