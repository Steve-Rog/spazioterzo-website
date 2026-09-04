# spazioterzo-website

Sito React + TypeScript, basato su Vite e React Router in Framework Mode.

## Comandi

```bash
npm run dev
npm run build
npm run typecheck
```

Il progetto richiede **Node 22.12+**. Con `nvm`, dalla root del repository basta
eseguire `nvm use`: il file `.nvmrc` seleziona la versione corretta.

Le rotte sono dichiarate in `app/routes.ts`; ogni voce punta al rispettivo route module in `app/routes/`.

## Deploy su Cloudflare

Il sito pubblico, le API, il back office e i media vivono tutti su Cloudflare.
React Router viene renderizzato da un Cloudflare Worker, mentre gli asset statici
sono serviti dalla stessa infrastruttura: non esistono configurazioni, redirect o
variabili d'ambiente da mantenere su piattaforme esterne.

- `development` pubblica il sito su `dev.spazioterzo.it` e l'API su
  `api.dev.spazioterzo.it`.
- La produzione pubblica il sito su `spazioterzo.it`; `www.spazioterzo.it`
  reindirizza in modo permanente all'indirizzo canonico.
- I dettagli di ambienti, domini, segreti e deploy sono in
  [cloudflare/README.md](cloudflare/README.md).

## Aggiungere pagine

Le nuove pagine si definiscono in `app/routes.ts` e ricevono metadata e rendering
server-side automaticamente. Ad esempio:

```ts
import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chi-siamo", "routes/chi-siamo.tsx"),
] satisfies RouteConfig;
```

Ogni route module può esportare `meta`, `loader`, `action` e `headers` quando sarà
necessario aggiungere contenuti dinamici, form o regole di caching.

## Back office e contenuti

Il back office è una parte separata dell'applicazione Cloudflare, con API,
database e media nello stesso ecosistema. Senza `VITE_CONTENT_API_URL` il sito
mantiene i contenuti presenti nel repository; quando l'API è configurata legge
esclusivamente le revisioni pubblicate.

### Avvio locale

In tre terminali distinti:

```bash
npm run db:migrate:local
npm run dev:worker
npm run dev:admin
```

Una volta avviato il Worker, importa i contenuti attuali nel database locale:

```bash
curl -X POST http://127.0.0.1:8787/v1/development/seed -H 'x-spazioterzo-seed: local-only'
```

Per vedere sul sito i contenuti del database — e non le copie di esempio del
repository — avvialo indicandogli l'API locale:

```bash
VITE_CONTENT_API_URL=http://127.0.0.1:8787 npm run dev
```

Apri l'admin all'indirizzo indicato da Vite. L'utente locale iniziale è
`editor@spazioterzo.test`; in produzione questo accesso viene sostituito da
Cloudflare Access con codice monouso e JWT validato dal Worker.

Prima del deploy l'associazione deve creare le risorse D1/R2, configurare le
variabili Access indicate in [cloudflare/README.md](cloudflare/README.md).

## Automazioni GitHub e ambienti

- Pull request e push su `main`: verifiche automatiche (tipi, test, build sito e build admin).
- Push sul branch `development`: applica le migrazioni al D1 di sviluppo e pubblica sito, API e back office Cloudflare.
- Produzione: non parte mai da un push. Si avvia manualmente da GitHub Actions,
  richiede la parola `DEPLOY` e va protetta con approvazione GitHub Environment.

Prima di attivare il deploy di sviluppo, in GitHub apri **Settings → Secrets and
variables → Actions** e crea la variabile `CLOUDFLARE_ACCOUNT_ID`. Poi crea gli
Environment `development` e `production`: in ciascuno salva il relativo secret
`CLOUDFLARE_API_TOKEN`. Le autorizzazioni minime del token e i passaggi di
attivazione sono descritti in [cloudflare/README.md](cloudflare/README.md).
