#!/usr/bin/env node
/**
 * Copia i contenuti pubblicati da un ambiente all'altro: revisioni, entità e media.
 *
 * Non tocca `admin_users` né `audit_events`: chi può entrare e cosa ha fatto appartengono
 * all'ambiente, non ai contenuti. I file in R2 vengono copiati uno a uno partendo dalla
 * tabella `assets`, che contiene già la chiave di ogni oggetto, e gli indirizzi dei media
 * vengono riscritti perché puntano al dominio dell'ambiente di origine.
 *
 *   node cloudflare/scripts/copia-contenuti.mjs --da production --a development
 *   node cloudflare/scripts/copia-contenuti.mjs --da development --a production --conferma SOVRASCRIVI
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ambienti = {
  development: { d1: "spazioterzo-dev", r2: "spazioterzo-media-dev", media: "media.dev.spazioterzo.it" },
  production: { d1: "spazioterzo-production", r2: "spazioterzo-media-production", media: "media.spazioterzo.it" },
};

/** Le tabelle dei contenuti. L'ordine conta: le revisioni sono referenziate dalle entità. */
const tabelle = ["content_revisions", "content_entities", "assets"];

const argomenti = new Map();
for (let i = 2; i < process.argv.length; i += 2) argomenti.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);

const da = argomenti.get("da");
const a = argomenti.get("a");
if (!ambienti[da] || !ambienti[a] || da === a) {
  console.error("Uso: --da <development|production> --a <development|production> (ambienti diversi)");
  process.exit(1);
}

const origine = ambienti[da];
const destinazione = ambienti[a];
const config = ["--config", "cloudflare/wrangler.jsonc"];

function wrangler(argomentiComando, opzioni = {}) {
  return execFileSync("npx", ["wrangler", ...argomentiComando], { encoding: "utf8", stdio: opzioni.silenzioso ? ["ignore", "pipe", "pipe"] : "inherit" });
}

function interroga(database, sql) {
  const uscita = execFileSync("npx", ["wrangler", "d1", "execute", database, "--remote", ...config, "--json", "--command", sql], { encoding: "utf8" });
  return JSON.parse(uscita)[0]?.results ?? [];
}

// Verso la produzione si cancellano contenuti veri: serve una conferma scritta a mano.
if (a === "production" && argomenti.get("conferma") !== "SOVRASCRIVI") {
  console.error("Questa copia sovrascrive i contenuti di produzione.");
  console.error("Prendi nota del punto di ripristino e ripeti il comando con --conferma SOVRASCRIVI:\n");
  wrangler(["d1", "time-travel", "info", destinazione.d1, ...config]);
  process.exit(1);
}

const cartella = mkdtempSync(join(tmpdir(), "copia-contenuti-"));
try {
  console.log(`\n1/4 Esporto i contenuti da ${da}`);
  const esportazione = join(cartella, "contenuti.sql");
  wrangler(["d1", "export", origine.d1, "--remote", ...config, "--no-schema", "--output", esportazione, ...tabelle.flatMap((tabella) => ["--table", tabella])]);

  console.log(`\n2/4 Copio i file dei media in ${destinazione.r2}`);
  const file = interroga(origine.d1, "SELECT object_key, content_type FROM assets");
  for (const [indice, { object_key: chiave, content_type: tipo }] of file.entries()) {
    const locale = join(cartella, chiave.replaceAll("/", "_"));
    wrangler(["r2", "object", "get", `${origine.r2}/${chiave}`, "--remote", "--file", locale, ...config], { silenzioso: true });
    wrangler(["r2", "object", "put", `${destinazione.r2}/${chiave}`, "--remote", "--file", locale, "--content-type", tipo, ...config], { silenzioso: true });
    console.log(`   ${indice + 1}/${file.length} ${chiave}`);
  }
  if (file.length === 0) console.log("   nessun file caricato da copiare");

  console.log(`\n3/4 Riscrivo gli indirizzi dei media per ${a}`);
  // senza questo passaggio le immagini resterebbero puntate al dominio dell'altro ambiente
  const sql = readFileSync(esportazione, "utf8").replaceAll(origine.media, destinazione.media);
  const importazione = join(cartella, "importazione.sql");
  writeFileSync(importazione, [...tabelle].reverse().map((tabella) => `DELETE FROM ${tabella};`).join("\n") + "\n" + sql);

  console.log(`\n4/4 Importo in ${a}`);
  wrangler(["d1", "execute", destinazione.d1, "--remote", ...config, "--file", importazione, "-y"]);

  const conteggio = interroga(destinazione.d1, "SELECT (SELECT COUNT(*) FROM content_entities) AS entita, (SELECT COUNT(*) FROM content_revisions) AS revisioni, (SELECT COUNT(*) FROM assets) AS media");
  console.log(`\nFatto: ${JSON.stringify(conteggio[0])} in ${a}`);
} finally {
  rmSync(cartella, { recursive: true, force: true });
}
