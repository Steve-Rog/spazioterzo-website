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

Solo in produzione, dopo avere impostato la Cache Rule, servono anche:

- `CF_ZONE_ID`
- `CF_CACHE_PURGE_TOKEN`

## Produzione

- Configurare Cloudflare Access con OTP e allow-list di email.
- Inserire `ACCESS_TEAM_DOMAIN` e `ACCESS_AUDIENCE` come secrets del Worker.
- Configurare `PUBLIC_MEDIA_BASE_URL` sul dominio `media` dell'associazione.
- Configurare `PUBLIC_API_BASE_URL` con il dominio API definitivo e creare una Cache Rule che memorizzi `/v1/public/*` per cinque minuti.
- Salvare `CF_ZONE_ID` e `CF_CACHE_PURGE_TOKEN` come secrets: il token deve poter purgare soltanto la zona dell'associazione. A ogni pubblicazione il Worker invalida gli URL pubblici interessati; se il purge fallisce, registra l'errore e la cache scade comunque entro cinque minuti.
- D1 e R2 sono già separati dall'ambiente dev; non riusare mai quelli di sviluppo in produzione.
- Inserire il primo amministratore nel D1 di produzione con `INSERT INTO admin_users (email, role) VALUES ('email@associazione.it', 'admin')`; l'email deve essere anche nella allow-list Access.
- Applicare le migrazioni solo con `--remote` nell'ambiente corretto.
- Conservare un export D1 periodico fuori dal database di produzione.

Gli endpoint admin validano il JWT Access; non abilitare `workers.dev` in produzione.
