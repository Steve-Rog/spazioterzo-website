# Guida UI e UX del back office

Regole per modificare il back office di Spazio Terzo restando coerenti con quello che i visitatori vedono davvero.
Vale per chiunque tocchi `admin/`: sviluppatori, designer, assistenti automatici.

Ogni regola qui dentro nasce da un problema trovato sul campo, non da un manuale.

---

## 0. Prima di toccare una sezione: guarda la pagina pubblica

**Il back office non è un'applicazione a sé: è il pannello di comando di un sito che esiste.**
Ogni campo che compili finisce in un punto preciso di una pagina. Se il modulo è organizzato diversamente da come
appare la pagina, chi scrive non può prevedere il risultato — ed è il difetto più costoso che abbiamo dovuto
smontare.

Ogni volta che si mette mano a una sezione:

1. **Avvia i tre ambienti insieme.**
   ```bash
   npm run dev:worker   # API dei contenuti su :8787
   npm run dev:admin    # back office su :5173
   npm run dev          # sito pubblico su :5174
   ```
   Se una porta è occupata, chiudi il processo che la tiene invece di cambiarla: gli indirizzi sono cablati nella
   configurazione di sviluppo.

2. **Apri la pagina pubblica corrispondente** e leggila dall'alto in basso, segnando le sezioni nell'ordine in cui
   compaiono.

   | Sezione del back office | Pagina pubblica | File da leggere |
   |---|---|---|
   | Progetti → editor | `/progetti/<slug>` | `app/components/projects/ProjectDetail.tsx` |
   | Progetti → archivio | `/progetti` | `app/components/projects/ProjectsArchive.tsx` |
   | Persone | `/le-persone` | `app/routes/people.tsx` |
   | Sito → Identità del sito | intestazione di ogni pagina e piè di pagina della home | `app/components/ui/BrandLogo.tsx`, `app/components/home/Contact.tsx` |
   | Sito → Home | `/` | `app/components/home/` |
   | Sito → SEO | metadati di ogni pagina | `app/routes/*.tsx`, funzioni `meta` |

3. **Verifica tre cose per ogni campo** che stai spostando o rinominando:
   - *dove* finisce nella pagina (quale sezione, quale posizione);
   - *come* viene reso — un campo chiamato «Introduzione» può diventare un titolo da 57px: è successo davvero;
   - *se conta l'ordine* — `themes[0]` compare in copertina, gli altri temi no.

4. **Un gruppo del modulo = una sezione della pagina**, nello stesso ordine. Se un gruppo alimenta cinque sezioni
   diverse (era il caso di «Collegamenti»), va spezzato.

5. **Usa le stesse parole del sito.** Se la pagina dice «L'intenzione», il campo non si chiama «Obiettivo».
   Se la sezione pubblica è «Cosa abbiamo attivato», il gruppo non si chiama «Risultati».

6. **Alla fine ricontrolla a schermo**, non solo nel codice: apri la sezione modificata a 1440px e a 375px, con la
   pagina pubblica aperta di fianco.

---

## 1. Colori

Gli stessi del sito (`app/styles/global.css`), dichiarati in `admin/src/styles.css`:

| Variabile | Valore | Uso |
|---|---|---|
| `--ink` | `#132b35` | testo principale, barra laterale |
| `--paper` | `#f4f1e9` | fondo dell'applicazione |
| `--surface` | `#fffdf8` | schede, campi, superfici sollevate |
| `--surface-sunk` | `#efeadf` | passaggio del mouse, superfici incassate |
| `--line` / `--line-soft` | `#d5cec1` / `#ded7ca` | bordi e separatori |
| `--brand` | `#e4573d` | accenti non testuali (arancione del sito) |
| `--brand-strong` | `#c2402a` | testo arancione, pulsanti principali |
| `--st-muted` | `#5c6b6d` | testo secondario |

- Non introdurre colori nuovi: se serve una sfumatura, deriva da queste variabili.
- **Contrasto minimo 4.5:1** su qualsiasi testo. L'arancione del sito su fondo chiaro sta a 3.25:1, perciò testo e
  pulsanti usano `--brand-strong` (5.07:1). Verifica ogni coppia nuova.
- Rosso solo per azioni distruttive, verde solo per conferme, arancione per «serve la tua attenzione».

## 2. Caratteri e scala

Tre famiglie, le stesse del sito: **DM Sans** (testo), **Playfair Display** (titoli), **DM Mono** (etichette brevi
maiuscole), caricate in `admin/index.html`.

| Elemento | Regola |
|---|---|
| Titolo di schermata | Playfair 26–32px — orienta, non decora |
| Titolo di sezione | DM Sans 19px, peso 600 |
| Etichette dei campi | 13px, peso 600, colore `--ink` |
| Descrizioni sotto le etichette | 12px, colore `--st-muted` |
| Testo corrente | 14px |
| Etichette mono (`.eyebrow`, stati, gruppi) | DM Mono 10px, maiuscolo, spaziatura `.11em` |

Playfair grande (39–64px) resta solo dove serve richiamare l'aspetto pubblico: schermata di accesso e anteprima.

## 3. Spazio e contenitori

- **Una superficie per unità di contenuto.** Sezioni del modulo ed elenchi sono schede: bordo `--line-soft`,
  angoli 6px, fondo `--surface`. Gli elementi ripetibili dentro una scheda usano `--paper` per distinguersi.
- **Un separatore solo.** Se un blocco ha già una linea sotto il titolo, il successivo non ne aggiunge una sopra:
  due linee a meno di 30px sono un errore. Script di controllo al capitolo 15.
- **Ritmo verticale**: 4 · 8 · 14 · 26 · 30px.
- **Larghezze**: area di lavoro max 1640px, colonna dei contenuti max 1240px, campi entro 820px.
- **Le intestazioni non mangiano lo schermo.** Il primo campo compilabile sta entro il primo terzo dell'altezza
  della finestra. Se non ci sta, comprimi la testata, non il contenuto.
- **Niente spazio morto**: sopra i 1500px l'editor diventa a due colonne, con l'anteprima della bozza a destra
  (400px, agganciata) che si aggiorna mentre si scrive; sotto quella soglia l'anteprima torna nel pannello a
  scomparsa e il pulsante «Anteprima» ricompare nella testata. La visibilità è decisa da una media query, non
  da JavaScript: `useMediaQuery` dipende da un evento che non sempre arriva.
- **Oltre una certa larghezza non si allarga: si riempie.** I campi hanno un limite di leggibilità (820px per
  il testo): superato quello, lo spazio va usato per mostrare qualcosa di utile.

## 4. Pulsanti e icone

**Due misure, tre varianti. Nient'altro.**

| Variante | Quando | Mantine |
|---|---|---|
| Principale | l'azione attesa in quella schermata (una sola) | `color="orange"` |
| Secondaria | azioni di supporto | `variant="default"` |
| Testuale | azioni minori dentro una scheda | `variant="subtle"` |

- `size="sm"` (36px) per le azioni di schermata, `size="xs"` (30px) dentro schede ed elenchi. Le varianti
  `compact-*` non si usano.
- Icone-azione (`ActionIcon`) a 34px, una misura sola.
- **Le icone sono icone**: `@tabler/icons-react`, importate una per una. Mai caratteri come `↑ ↓ × ••• ▾ ⠿ + −`:
  cambiano forma su ogni sistema e fanno sembrare tutto un prototipo.
- **Mai due azioni principali nella stessa schermata.** Se ci sono «Salva» e «Continua» entrambi in evidenza,
  chi guarda non sa quale sia la strada.
- Ogni icona senza testo ha un `aria-label` che dice azione e oggetto («Sposta il blocco 2 più in alto»).

## 5. Campi

- Bordo `--line`, fondo `--surface`, angoli 3px, fuoco arancione: regole globali, non ridefinirle sul singolo campo.
- **Obbligatorio nel modulo = obbligatorio sul server.** I requisiti stanno in `admin/src/project-fields.ts`, con
  test che li confrontano con `validateProject`. Non duplicare la regola nel componente.
- **Gli errori stanno sul campo**: messaggio sotto l'input, scorrimento e fuoco sul primo mancante. La notifica è
  un rinforzo, mai l'unico avviso. Un pulsante che non fa niente perché la validazione fallisce in silenzio è un bug.
- **Impedisci l'input invalido invece di rifiutarlo dopo**: limite di caratteri applicato alla digitazione,
  all'incolla e come rete di sicurezza sul valore finale; contatore visibile, arancione oltre il 90%.
- **L'interfaccia non espone il modello dati.** Il testo formattato si scrive in un editor, non spezzandolo in
  «segmenti» con una tendina per ognuno. Se un campo obbliga a ragionare come il database, è progettato male.
- **I campi derivati non sembrano modificabili.** Se un valore si costruisce da un altro (il testo alternativo di
  un ritratto dal nome), mostralo in sola lettura con la spiegazione: un campo che accetta la digitazione e poi la
  scarta è peggio di un campo assente.
- Liste di valori: chip (`TagsInput`) invece di testo separato da virgole; scelte fra contenuti esistenti con
  `MultiSelect` e le etichette vere, mai slug da ricordare a memoria.
- **Segnaposto d'esempio** sui campi liberi (`2025 — in corso`, `Catania`): dicono il formato atteso senza spiegarlo.

## 6. Navigazione e indirizzi

- **Ogni schermata ha un indirizzo.** Sezione, contenuto aperto e pannello attivo stanno nell'URL
  (`#/progetti/<id>`, `#/sito/home`): ricaricare non deve far perdere il posto, il link si deve poter mandare a un
  collega, e il tasto indietro del browser deve fare l'unica cosa sensata.
- Gli indirizzi sono **in italiano** come le etichette: `#/progetti/nuovo`, non `#/projects/new`.
- **Uscire da un editor con modifiche non salvate chiede conferma** — da menu laterale, da «Archivio», dal tasto
  indietro e alla chiusura della scheda. Se si annulla, l'indirizzo torna dov'era: barra e schermata non devono
  mai divergere.
- **Un indirizzo che punta a un contenuto sparito** non lascia la pagina vuota: avviso e ritorno all'archivio.
- **Niente menu che appaiono e spariscono.** Le voci di una sezione (le pagine del sito) stanno sempre in vista,
  non solo dopo aver aperto quella sezione.
- **Non ripetere il titolo.** Se la linguetta attiva dice «Il racconto», la scheda sotto non lo ripete.

## 7. Elenchi e archivi

- **Densità**: righe da ~78px con miniatura, titolo, sottotitolo e riga di contesto (data, indirizzo, stato). In
  una finestra da 900px se ne devono vedere almeno otto.
- **Le azioni frequenti si raggiungono dall'elenco** (apri, duplica, pubblica, archivia) senza entrare nel
  contenuto.
- **Ogni stato è raggiungibile.** Se un contenuto può essere archiviato, ci deve essere un filtro che lo mostra e
  un modo per riportarlo indietro: uno stato senza via d'uscita equivale a una cancellazione.
- **L'evidenziazione segue tutta la riga**, non solo la parte cliccabile.
- **Elenchi lunghi si comprimono**: gli elementi ripetibili (blocchi del racconto) si aprono e chiudono e da
  chiusi mostrano un riassunto che basta a riconoscerli («3. Elenco — Come lavoriamo · 3 voci»).
- **Riordinare si può in due modi**: trascinamento con maniglia dedicata (il resto della riga resta selezionabile)
  e frecce per la tastiera.

## 8. Azioni sicure

- **Le conferme dicono la conseguenza**, non fanno una domanda generica: «Il contenuto va perso», «Non sarà più
  visibile sul sito. Potrai ripristinarlo dal filtro Archiviati».
- **Le azioni rischiose mostrano cosa cambia prima di eseguire.** Ripristinare una revisione senza vedere il
  confronto campo per campo è un salto nel buio.
- **Nessuna azione può bloccare fuori chi la compie**: non si disattiva né si declassa il proprio accesso; il
  proprio profilo è segnato («Tu») e i controlli sono spenti. Il server rifiuta comunque, l'interfaccia lo dice prima.
- **Non si cancella ciò che è in uso.** Prima di eliminare un'immagine si controlla se qualche bozza o versione
  online la cita, e in caso si spiega dove: «Immagine ancora usata in: bozza-test».
- **Nessun vicolo cieco.** Una schermata che dice «non puoi fare questo» offre la via d'uscita («Vai all'archivio
  persone» accanto a «Il team è completo»).
- **Il lavoro non si perde per una svista**: guard sulle modifiche non salvate, Cmd+S, stato di salvataggio sempre
  leggibile.

## 9. Mostrare il risultato, non solo il campo

- **L'anteprima usa i componenti veri del sito**, non una riproduzione. `PreviewFrame` monta i componenti di
  `app/components/` dentro un iframe con i fogli di stile pubblici: se cambia il sito cambia l'anteprima, senza
  che nessuno debba ricordarsene. L'iframe serve a isolare i CSS globali del sito da quelli del back office.
  Due accortezze: `MotionConfig reducedMotion="always"`, altrimenti le animazioni d'ingresso lasciano il
  contenuto invisibile in un riquadro piccolo; e **altezza fissa dell'iframe**, perché adattarla al contenuto
  crea un circolo vizioso con le sezioni alte `100svh` (la pagina arrivava a 14.586px).
- **Anteprima nel contesto reale.** Un logo per fondo scuro si guarda su fondo scuro; una favicon si guarda
  quadrata, non stirata in un banner 16:8.
- **Anteprima del risultato pubblico** dove esiste una resa nota: lo snippet di ricerca per la SEO, con titolo e
  descrizione composti secondo le stesse regole del sito.
- **Dichiara i ripieghi.** Se un campo vuoto viene sostituito da un altro valore, scrivilo: «Il titolo arriva dal
  contenuto: compila questo campo solo se vuoi un testo diverso».
- **Mostra dove si sta scrivendo**: accanto al titolo di sezione, una miniatura della fascia di pagina che si sta
  compilando.

## 10. Stati

Ogni schermata che carica dati ne prevede quattro:

1. **In caricamento** — scheletri che ricalcano la forma della pagina (`LoadingScreen` in `App.tsx`), non una
   scritta al centro del vuoto.
2. **Vuoto** — dice cosa manca e offre l'azione per rimediare.
3. **Errore** — se il server non risponde, schermata dedicata con spiegazione e **Riprova**. Tutte le chiamate
   hanno una scadenza di 12 secondi (`admin/src/api.ts`): senza, la pagina resta in caricamento per sempre.
4. **Pieno** — il caso normale.

Inoltre: **Cmd+S / Ctrl+S salva** ovunque ci sia una bozza, e lo stato di salvataggio resta leggibile nella
testata («salvato il 27 ago, 07:39»), perché le notifiche spariscono dopo pochi secondi.

## 11. Mobile

- Sotto 768px la navigazione è raggiungibile: il pulsante Menu vive in una barra fissa sempre presente.
- Le azioni dell'editor si spostano in una barra fissa in fondo, a portata di pollice.
- Aree toccabili ≥ 34px.
- Le schede di navigazione scorrono in orizzontale invece di andare a capo.
- Gli elenchi passano a una colonna: contenuto sopra, azioni sotto allineate a destra.
- I separatori scritti nei testi («·») spariscono quando gli elementi vanno a capo.

## 12. Testi

- Italiano, del lettore: «Indirizzo della pagina», non «Slug URL».
- Le etichette dei tipi non restano in inglese tecnico: «Testo», «Citazione», «Elenco», non `paragraph`, `quote`, `list`.
- Niente gergo negli errori: dire quale campo e cosa fare.
- Le azioni si chiamano con un verbo: «Crea il progetto», «Ripristina», «Pubblica modifiche».
- I messaggi di stato dicono la verità: una bozza mai salvata non è «Tutto salvato».

## 13. Accessibilità (minimo non negoziabile)

- Contrasto 4.5:1 sul testo.
- Ogni controllo raggiungibile da tastiera, con fuoco visibile.
- Icone con `aria-label`; contatori e messaggi di stato con `aria-live="polite"`.
- Il trascinamento ha sempre un'alternativa da tastiera.
- Il testo alternativo delle immagini è obbligatorio e si compila dove si sceglie l'immagine, non altrove.

## 14. Trappole già incontrate

Cose che hanno fatto perdere tempo una volta: non serve perderlo due.

- **Token Mantine**: le override vanno su `:root[data-mantine-color-scheme="light"]`, perché Mantine li dichiara
  con quel selettore e un `:root` semplice perde per specificità. Se metti le variabili su una classe (es.
  `.admin-app-shell`), modali e pannelli — che vivono in un portale — non le vedono.
- **Mantine Stepper**: accetta come figli solo `Stepper.Step` e `Stepper.Completed`. Qualsiasi altro elemento
  riceve le proprietà dei passi e finisce nella riga delle icone, con avvisi React sulle prop sconosciute.
- **React**: un valore che deve cambiare l'interfaccia sta in uno stato, non in una `ref`. Con una `ref` la
  maniglia di trascinamento non attivava mai `draggable`.
- **Aggiornamento a caldo**: dopo aver modificato import o hook, gli errori in console possono essere residui.
  Verifica sempre in una scheda appena aperta prima di dare la caccia a un bug che non esiste.
- **D1**: `LIKE` con pattern lunghi come un URL fallisce con *«pattern too complex»*. Per cercare dentro i
  contenuti, carica le revisioni correnti e confronta in JavaScript.
- **Media in sviluppo**: gli indirizzi sono `http://localhost:8787/media/…`; lo schema li accetta solo per
  `localhost` e `127.0.0.1`. Altrove servono percorsi relativi o `https://`.
- **Verifica visiva**: se il riquadro del browser non è in primo piano, `requestAnimationFrame` non gira e le
  transizioni Mantine non completano — pannelli e modali restano vuoti. Non è un bug dell'applicazione: fai uno
  screenshot per forzare un fotogramma prima di interagire.

## 15. Prima di dire che è finito

```bash
npm test                    # logica condivisa e conversioni
npm run build:admin         # il pacchetto si costruisce
npx tsc --noEmit --jsx react-jsx --target es2022 --module esnext \
  --moduleResolution bundler --strict --skipLibCheck \
  admin/src/vite-env.d.ts admin/src/*.tsx admin/src/*.ts
```

E a schermo, sulla sezione toccata:

- desktop 1440px e mobile 375px;
- percorso completo: creare, modificare, salvare, pubblicare, archiviare, ripristinare;
- console pulita in una scheda appena aperta;
- confronto affiancato con la pagina pubblica.

Per scovare i separatori doppi, incolla nella console:

```js
const linee = [];
for (const el of document.querySelectorAll('.admin-workspace *')) {
  const s = getComputedStyle(el), r = el.getBoundingClientRect();
  if (r.height === 0 || r.width < 380) continue;
  const nome = el.className.toString().split(' ').filter((c) => !c.startsWith('m_') && !c.startsWith('mantine-')).join('.') || el.tagName.toLowerCase();
  if (s.borderBottomWidth !== '0px' && s.borderBottomStyle !== 'none') linee.push({ n: nome + '(sotto)', y: Math.round(r.bottom + scrollY) });
  if (s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none') linee.push({ n: nome + '(sopra)', y: Math.round(r.top + scrollY) });
}
linee.sort((a, b) => a.y - b.y);
linee.forEach((l, i) => { if (i && l.y - linee[i - 1].y <= 30 && l.n !== linee[i - 1].n) console.warn(`${linee[i - 1].n} + ${l.n} → ${l.y - linee[i - 1].y}px`); });
```

Per contare le varianti di pulsante (devono restare due misure più le icone-azione):

```js
const varianti = new Map();
for (const b of document.querySelectorAll('.admin-workspace button')) {
  const h = Math.round(b.getBoundingClientRect().height);
  if (!h) continue;
  const tipo = b.className.includes('ActionIcon') ? 'icona' : b.className.includes('Tabs-tab') ? 'scheda' : 'pulsante';
  varianti.set(`${tipo} ${h}px`, (varianti.get(`${tipo} ${h}px`) ?? 0) + 1);
}
console.table([...varianti.entries()]);
```

---

## Dati di sviluppo

L'accesso locale usa `localStorage.spazioterzo-dev-email` (`editor@spazioterzo.test` è amministratore).

Il database di sviluppo è condiviso con chi lavora in parallelo: se provi un flusso di creazione, **archivia i
contenuti di prova** e riporta al valore originale quello che hai modificato. Le immagini caricate per prova si
eliminano dall'archivio media, che rifiuta la cancellazione se sono ancora usate da un contenuto.
