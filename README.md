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
