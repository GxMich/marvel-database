# Marvel Database

Archivio dei film, delle serie TV e dell'animazione Marvel — **184 titoli** dal 1944 al 2027,
non solo MCU: Sony, Fox, le serie Netflix, i film TV storici e tutta l'animazione.
Segna cosa hai visto o vuoi saltare, filtra per universo/franchise/personaggio, esporta un backup JSON.

Nessuna installazione, nessun server: **apri `index.html` con un doppio click**.

## Struttura

```
marvel/
├── index.html                  # markup della pagina
├── assets/video/               # video di intro
├── css/
│   ├── base.css                # reset, variabili colore, safe-area iOS
│   ├── intro.css               # schermata di apertura
│   ├── layout.css              # hero, statistiche, controlli
│   ├── components.css          # card, badge, modale, toast
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
│   └── app.js                  # sequenza di avvio
└── tools/
    ├── master-list.mjs         # tassonomia curata a mano
    └── build-catalog.mjs       # genera catalog.js incrociando con TMDB
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

- Gli script sono `<script>` classici, **non ES modules**: i moduli vengono bloccati dal
  protocollo `file://` e il sito non si aprirebbe più con un doppio click.
- I link a CSS e JS hanno un `?v=N`: se modifichi un file e il browser mostra ancora la
  versione vecchia, incrementa quel numero in `index.html` (oppure ricarica con Ctrl+Shift+R).
- Il foglio di stile dei filtri si chiama `facets.css` e non `filters.css` perché gli
  ad-blocker bloccano i file con quel nome.

## Crediti

Dati e locandine da [TMDB](https://www.themoviedb.org/). Questo prodotto usa le API di TMDB
ma non è approvato o certificato da TMDB.

Fasi MCU, ordine narrativo e tag "Essenziale" sono una curatela editoriale, non un dato
ufficiale Marvel.

Progetto fan non ufficiale. Marvel e i personaggi correlati sono marchi Marvel/Disney.
