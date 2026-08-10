# Marvel Database

Archivio dei film, delle serie TV e dell'animazione Marvel — **184 titoli** dal 1944 al 2027,
non solo MCU: Sony, Fox, le serie Netflix, i film TV storici e tutta l'animazione.
Segna cosa hai visto o vuoi saltare, filtra per universo/franchise/personaggio, apri la scheda
di ogni titolo con trama, cast, regia e trailer, esporta un backup JSON.

Nessuna installazione, nessun server: **apri `index.html` con un doppio click**.

## Struttura

```
marvel/
├── index.html                  # markup della pagina
├── manifest.json               # PWA: nome, icone, colori
├── sw.js                       # service worker: cache e funzionamento offline
├── assets/
│   ├── fonts/                  # woff2 — GENERATI da tools/get-fonts.mjs
│   ├── icons/                  # icone PWA — GENERATE da tools/make-icons.mjs
│   └── video/                  # video di intro
├── css/
│   ├── base.css                # design system: colori, spazio, tipografia, grana
│   ├── intro.css               # schermata di apertura
│   ├── layout.css              # testata, barra comandi, colonna filtri, piede
│   ├── components.css          # card, scheda, dialoghi, toast
│   ├── facets.css              # filtri (colonna desktop + drawer mobile)
│   └── responsive.css          # adattamento e prestazioni
├── js/
│   ├── data/
│   │   ├── catalog.js          # i 184 titoli, dati per la griglia — GENERATO
│   │   └── details.js          # trama, cast, trailer, logo — GENERATO
│   ├── icons.js                # icone SVG inline
│   ├── storage.js              # stato visto/saltato in localStorage
│   ├── posters.js              # URL locandine + precaricamento
│   ├── render.js               # filtri, ricerca, ordinamenti, card
│   ├── details.js              # caricamento a richiesta di data/details.js
│   ├── controls.js             # filtri, ordinamento, export/import
│   ├── ui.js                   # scheda, modale, toast, icone
│   ├── intro.js                # video di apertura
│   ├── legal.js                # informative e banner
│   └── app.js                  # avvio + registrazione service worker
└── tools/
    ├── master-list.mjs         # tassonomia curata a mano
    ├── build-catalog.mjs       # genera catalog.js e details.js da TMDB
    ├── get-fonts.mjs           # scarica i woff2 in assets/fonts/
    └── make-icons.mjs          # genera le icone PWA (PNG, senza dipendenze)
```

## Il catalogo è diviso in due file

I dati stanno in due file con vite diverse, e la divisione è il motivo per cui la
pagina si apre in fretta pur avendo trame e cast di 184 titoli:

| File | Peso | Quando si carica | Cosa contiene |
|---|---|---|---|
| `js/data/catalog.js` | 150 KB | all'avvio | titolo, anno, locandina, universo, fase, tipo, voto, durata, franchise, personaggi |
| `js/data/details.js` | 269 KB | alla prima scheda aperta | trama, tagline, cast con foto, regia, sceneggiatura, trailer, logo, sfondo |

Chi si limita a scorrere la griglia non scarica mai il secondo file. Chi apre una scheda
lo riceve una volta sola e poi tutte le altre sono immediate.

`js/details.js` lo carica **iniettando un `<script>`**, non con `fetch`: su `file://` le
richieste sono bloccate dal CORS e il sito deve continuare ad aprirsi con un doppio click.
Il caricamento parte comunque in sottofondo con `requestIdleCallback` appena le locandine
hanno finito, quindi al primo click il file di solito è già lì.

> **Attenzione ai `const` negli script classici.** `const DETAILS = …` crea un binding
> lessicale globale, **non** una proprietà di `window`: `window.DETAILS` resta `undefined`.
> L'unico modo di sapere se il file è arrivato è `typeof DETAILS !== 'undefined'`.

## PWA e funzionamento offline

Il service worker tiene tre cache separate, perché i contenuti hanno vite diverse:

- **`marvel-shell-<versione>`** — HTML, CSS, JS, caratteri, icone. Si svuota quando cambia
  `VERSION` in `sw.js`. Strategia *stale-while-revalidate*: la pagina si apre dalla
  cache e la versione nuova arriva in sottofondo.
- **`marvel-media`** — video di intro. Non cambia mai e pesa 8 MB, quindi sopravvive
  ai rilasci. Strategia *cache-first*.
- **`marvel-posters-v2`** — immagini TMDB: locandine, sfondi e foto del cast. Stessa
  logica del video, ma con una versione propria: dalla v2 si richiedono in modalità CORS
  e quelle salvate prima non sono più utilizzabili. Tenendole separate dal video si
  invalidano solo loro, senza far riscaricare 8 MB.

`js/data/details.js` è nell'elenco della shell anche se la pagina non lo carica all'avvio:
senza, l'archivio offline avrebbe le locandine ma non le schede, e ogni click aprirebbe
un pannello vuoto.

Dopo la prima visita l'archivio funziona **completamente offline**, immagini incluse.

## Caratteri

Tre voci con tre compiti: **Instrument Serif** per i titoli (dice "collezione curata",
non "cinecomic"), **JetBrains Mono** per i metadati (fa leggere la griglia come un
registro d'archivio), **Archivo** per il resto.

Sono ospitati nel progetto, non presi da Google: il sito deve funzionare offline e con
un doppio click, e un link a una rete che non c'è lascerebbe tutto in un ripiego di
sistema. Solo il sottoinsieme latino, e Archivo e JetBrains Mono in versione variabile:
un file invece di quattro. **107 KB in tutto.**

```bash
node tools/get-fonts.mjs
```

Per rigenerare le icone PWA dopo un cambio di logo:

```bash
node tools/make-icons.mjs
```

## Come si aggiorna il catalogo

I dati fattuali (ID TMDB, date, voti, immagini, durata, stato, trama, cast, trailer)
**non si scrivono a mano**: si prendono da TMDB. La classificazione editoriale (universo,
franchise, fase, personaggi, tipo di contenuto) sta invece in `tools/master-list.mjs`.

Per aggiungere un titolo: inseriscilo in `master-list.mjs`, poi rigenera **entrambi** i file:

```bash
node tools/build-catalog.mjs
```

Lo script segnala titoli non trovati, accoppiamenti sospetti, duplicati, poster mancanti,
titoli senza durata, senza trailer e senza cast.

Cast, video e immagini arrivano nella stessa richiesta dei dati principali
(`append_to_response=credits,videos,images`): non costano chiamate in più.
`include_video_language=it,en,null` evita una seconda chiamata per i trailer in inglese.

**Traduzioni parziali.** In `it-IT` alcuni titoli non hanno poster, trama o tagline: lo
script scarica una volta la versione in lingua originale e tappa i buchi. Meglio una
trama in inglese che una scheda vuota.

**Durate.** Per i film `runtime` è la durata del film; per le serie è la durata di un
episodio, presa dalle durate reali degli episodi quando TMDB le espone e altrimenti da
`episode_run_time`. `totalMinutes` è il monte minuti complessivo del titolo, ed è quello
che alimenta le statistiche. Serve perché gli episodi sono l'88% del catalogo: stimarli
con una durata fissa gonfiava il totale del 37% (1.696 ore contro 1.238 reali), soprattutto
per l'animazione, dove un episodio dura in mediana 26 minuti contro i 50 del live action.

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

Il catalogo copre **1.238 ore** di visione: 203 di film e il resto di episodi.

I contenuti non ancora usciti sono marcati **In arrivo** e non hanno voto inventato.

## Funzionalità

- **Scheda del titolo** — trama, tagline, cast con foto, regia o creatori, sceneggiatura,
  voto, durata, episodi, generi, personaggi e link al trailer su YouTube
- **Visto / Saltato** — due stati distinti, contati separatamente
- **Ricerca** — per titolo, personaggio, franchise, universo, anno o genere; ignora trattini
  e punteggiatura (`xmen` trova X-Men, `2019` trova i titoli di quell'anno). `/` porta il
  cursore nel campo
- **Filtri** — colonna sempre visibile su desktop, drawer dal basso sotto i 1180px, con
  contatore dei filtri attivi, conteggio risultati e reset
- **Ordinamenti** — anno, ordine narrativo MCU, voto, titolo, stato visione
- **Backup JSON** — esporta/importa; legge anche i backup dei formati precedenti
- **Intro video** — disattivabile dal pannello Info

## I tre stati di una card

La regola che governa la griglia: **lo spegnimento è riservato ai saltati.**

- **Da vedere** — colore pieno, nessun segno. È la normalità, ed è la gran parte del
  catalogo: è su queste locandine che si decide cosa guardare, quindi riconoscerle deve
  restare il compito più facile della pagina.
- **Saltato** — desaturato e al 50%, l'unico stato smorzato. Al passaggio del mouse torna
  leggibile, così si vede sempre di cosa si tratta.
- **Visto** — due segni: il bollo verde in alto a destra e il filo verde sotto la
  locandina. Nessuno dei due copre l'immagine, e lo spazio del filo è **riservato anche
  quando è trasparente**: segnare un titolo non muove mai la griglia.

Il verde è cupo, da pellicola (`--seen: #2F8A5B`), non quello di sistema: accanto al rosso
e all'osso `#30D158` sembra arrivato da un'altra applicazione. È **una variabile sola**,
quindi cambiare idea non è un rifacimento.

## Note tecniche

- Gli script sono `<script defer>` classici, **non ES modules**: i moduli vengono bloccati
  dal protocollo `file://` e il sito non si aprirebbe più con un doppio click. Con `defer`
  il download parte subito ma l'esecuzione attende la fine del parsing, quindi non bloccano
  mai il rendering. Per lo stesso motivo non c'è nessun `fetch` nel codice di pagina.
- **Quando modifichi CSS o JS aggiorna tre numeri**: il `?v=N` nei link dentro `index.html`
  (cache del browser), la costante `VERSION` in `sw.js` (cache del service worker) e
  `DETAILS_SRC` in `js/details.js` (che carica il suo file a mano e non passa dall'HTML).
  Altrimenti chi ha già visitato il sito continuerà a vedere la versione vecchia.
- **Niente scorrimento laterale.** `overflow-x` va solo su `<html>`, mai su `<body>`: su
  body il body diventa il contenitore di scorrimento e la barra comandi `position: sticky`
  smette di agganciarsi. E nessun elemento può essere più largo del 100% — uno sfondo "a
  tutta pagina" con inset negativi in percentuale riapre il problema, ed è già successo.
- Il foglio di stile dei filtri si chiama `facets.css` e non `filters.css` perché gli
  ad-blocker bloccano i file con quel nome.
- `crossorigin="anonymous"` sulle immagini TMDB non serve più a nessuna funzione, ma resta:
  le cache confrontano per URL e non per modalità, quindi togliendolo le immagini già
  salvate in modalità CORS convivrebbero con nuove risposte opache per lo stesso indirizzo.
  Costa zero e non obbliga a invalidare 184 immagini già sui dispositivi.

## Crediti

Dati e immagini da [TMDB](https://www.themoviedb.org/). Questo prodotto usa le API di TMDB
ma non è approvato o certificato da TMDB.

Fasi MCU, ordine narrativo e tag "Essenziale" sono una curatela editoriale, non un dato
ufficiale Marvel.

Progetto fan non ufficiale. Marvel e i personaggi correlati sono marchi Marvel/Disney.
