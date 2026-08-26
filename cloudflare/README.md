# Backend Cloudflare

Il backend resta indipendente da Vercel. Prima del primo deploy, l'associazione crea D1 e R2 e sostituisce gli identificativi nel file Wrangler oppure usa le variabili del dashboard per l'ambiente di produzione.

## Sviluppo locale

```bash
npm run dev:worker
npm run db:migrate:local
```

Wrangler crea D1 e R2 locali. Per effettuare richieste admin locali aggiungi l'header `x-spazioterzo-dev-email`; inserisci l'email e il ruolo nella tabella `admin_users` tramite Local Explorer o SQL locale.

Per caricare una volta i contenuti già presenti nel sito e l'utente di sviluppo `editor@spazioterzo.test` con ruolo admin:

```bash
curl -X POST http://127.0.0.1:8787/v1/development/seed -H 'x-spazioterzo-seed: local-only'
```

## Produzione

- Configurare Cloudflare Access con OTP e allow-list di email.
- Inserire `ACCESS_TEAM_DOMAIN` e `ACCESS_AUDIENCE` come secrets del Worker.
- Configurare `PUBLIC_MEDIA_BASE_URL` sul dominio `media` dell'associazione.
- Sostituire tutti gli ID e nomi placeholder nell'ambiente `production` di `wrangler.jsonc`; creare D1 e R2 separati dall'ambiente dev.
- Inserire il primo amministratore nel D1 di produzione con `INSERT INTO admin_users (email, role) VALUES ('email@associazione.it', 'admin')`; l'email deve essere anche nella allow-list Access.
- Applicare le migrazioni solo con `--remote` nell'ambiente corretto.
- Conservare un export D1 periodico fuori dal database di produzione.

Gli endpoint admin validano il JWT Access; non abilitare `workers.dev` in produzione.
