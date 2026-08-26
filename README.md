# spazioterzo-website

Sito React + TypeScript, basato su Vite e React Router in Framework Mode.

## Comandi

```bash
npm run dev
npm run build
npm run typecheck
```

Le rotte sono dichiarate in `app/routes.ts`; ogni voce punta al rispettivo route module in `app/routes/`.

## Deploy su Vercel

Il progetto usa il preset ufficiale `@vercel/react-router` con rendering server-side.
Vercel rileva React Router automaticamente: non servono `vercel.json`, rewrite manuali
o una cartella di output configurata a mano.

- Usa Node `20.19+` oppure `22.12+`, già dichiarato in `package.json`.
- Collega il repository a Vercel e lascia il Framework Preset su **React Router**.
- Il comando di build è `npm run build`; Vercel genera autonomamente le funzioni e
  gli asset pubblici.
- Le variabili d'ambiente future vanno configurate nel dashboard Vercel per
  Development, Preview e Production: non inserire segreti nel repository.

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

Il back office è sviluppato separatamente dal sito pubblico: Vercel continua a
servire l'interfaccia esistente, mentre API, database e media usano Cloudflare.
Senza `VITE_CONTENT_API_URL` il sito mantiene i contenuti presenti nel repository;
quando l'API è configurata legge esclusivamente le revisioni pubblicate.

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

Apri l'admin all'indirizzo indicato da Vite. L'utente locale iniziale è
`editor@spazioterzo.test`; in produzione questo accesso viene sostituito da
Cloudflare Access con codice monouso e JWT validato dal Worker.

Prima del deploy l'associazione deve creare le risorse D1/R2, configurare le
variabili Access indicate in [cloudflare/README.md](cloudflare/README.md) e
impostare `VITE_CONTENT_API_URL` nel progetto Vercel.
