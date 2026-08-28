# Backend Cloudflare

Il backend resta indipendente da Vercel. Il sito pubblico non viene spostato né
interrotto: finché `VITE_CONTENT_API_URL` non viene impostata su Vercel, continua
a usare i contenuti nel repository.

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

## Ambienti remoti

Le risorse sono già separate:

| Ambiente | Worker + back office | D1 | R2 |
| --- | --- | --- | --- |
| sviluppo | `spazioterzo-api-dev` | `spazioterzo-dev` | `spazioterzo-media-dev` |
| produzione | `spazioterzo-api` | `spazioterzo-production` | `spazioterzo-media-production` |

L’admin è un asset statico nello stesso Worker, ma viene servito solo da
`admin.dev.spazioterzo.it` / `admin.spazioterzo.it`. Le API pubbliche stanno su
`api…`, i media su `media…/media/`: questo rende l’admin same-origin con le sue API
e lascia l’API pubblica accessibile al sito Vercel. I domini vengono creati dal deploy
come Custom Domains; configurali solo dopo che la zona Cloudflare è **Active**.

## CI/CD GitHub

I workflow sono nella cartella `.github/workflows` e usano Node 22.

1. In GitHub, vai in **Settings → Environments** e crea `development` e `production`.
2. Per `production`, abilita **Required reviewers**: così un deploy manuale resta fermo finché non viene approvato.
3. In **Settings → Secrets and variables → Actions → Variables**, crea `CLOUDFLARE_ACCOUNT_ID` con l'ID dell'account Cloudflare dell'associazione.
4. Dentro a ciascun Environment, aggiungi il secret `CLOUDFLARE_API_TOKEN` con un token Cloudflare distinto.

Per ogni token Cloudflare, seleziona l’account dell’associazione e assegna solo:

- **Account → Workers Scripts → Edit**
- **Account → D1 → Edit**
- **Zone → Workers Routes → Edit** (solo sulla zona `spazioterzo.it`)

Non servono permessi DNS, Zone o accesso al sito Vercel per i workflow attuali.
Il token di produzione va conservato esclusivamente nell’Environment `production`.

Il branch `development` effettua il deploy automatico del solo backend di sviluppo.
`main` esegue soltanto le verifiche. Il workflow di produzione si può avviare
manualmente da **Actions → Deploy API to production** e richiede di digitare
`DEPLOY`; non collegarlo a `main` fino alla migrazione esplicita del frontend.

## Segreti del Worker

I segreti runtime non vanno mai in GitHub, in `.dev.vars` o in `wrangler.jsonc`.
Vanno inseriti nel Worker corretto con `wrangler secret put <NOME> --env <ambiente>`
oppure dal dashboard Cloudflare. I deploy usano `--keep-vars`, quindi non cancellano
variabili configurate nel dashboard.

Per Access servono, in entrambi gli ambienti remoti:

- `ACCESS_TEAM_DOMAIN`
- `ACCESS_AUDIENCE`

Non servono segreti per la cache: la cache del Worker si abilita da `wrangler.jsonc`
(`"cache": { "enabled": true }`) e si invalida dal codice.

## Produzione

- Configurare Cloudflare Access con OTP e allow-list di email.
- Inserire `ACCESS_TEAM_DOMAIN` e `ACCESS_AUDIENCE` come secrets del Worker.
- Configurare `PUBLIC_MEDIA_BASE_URL` sul dominio `media` dell'associazione.
- Configurare `PUBLIC_API_BASE_URL` con il dominio API definitivo.
- La cache delle risposte pubbliche è quella del Worker, non della zona: le Cache Rules, le Page Rules e le altre impostazioni di zona **non hanno effetto** sui Worker, che girano prima della cache. Si abilita con `"cache": { "enabled": true }` e obbedisce al `Cache-Control` che il Worker già invia (`s-maxage=300`). A ogni pubblicazione il Worker svuota il prefisso `/v1/public/` con `cache.purge`; se fallisce, registra `public_cache_purge_failed` negli eventi e la cache scade comunque entro cinque minuti.
- D1 e R2 sono già separati dall'ambiente dev; non riusare mai quelli di sviluppo in produzione.
- Inserire il primo amministratore nel D1 di produzione con `INSERT INTO admin_users (email, role) VALUES ('email@associazione.it', 'admin')`; l'email deve essere anche nella allow-list Access.
- Applicare le migrazioni solo con `--remote` nell'ambiente corretto.
- Conservare un export D1 periodico fuori dal database di produzione.

Gli endpoint admin validano il JWT Access; non abilitare `workers.dev` in produzione.

## Copiare i contenuti fra ambienti

Per lavorare in sviluppo sui testi veri, senza toccarli:

```bash
npm run content:prod-to-dev
```

Copia revisioni, entità e file R2 da produzione a sviluppo, riscrivendo gli indirizzi dei media
sul dominio giusto — altrimenti le immagini resterebbero puntate al bucket dell'altro ambiente.
Lo stesso lo fa il workflow **Copy production content to development**, che non dipende dal
wrangler installato sulla propria macchina.

`admin_users` e `audit_events` non vengono mai copiati: chi può entrare e cosa ha fatto
appartengono all'ambiente, non ai contenuti.

La direzione opposta cancella il lavoro dell'associazione e non sta nei workflow. Va lanciata a
mano e chiede una conferma scritta, dopo avere mostrato il punto di ripristino di Time Travel:

```bash
npm run content:dev-to-prod -- --conferma SOVRASCRIVI
```

Se qualcosa va storto, D1 conserva la storia del database (7 giorni sul piano gratuito, 30 su
quello a pagamento): `wrangler d1 time-travel restore spazioterzo-production --bookmark=…`.
