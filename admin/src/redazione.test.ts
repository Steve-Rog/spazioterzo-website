import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Difetti trovati leggendo il back office: questi controlli servono a non ritrovarseli.
 * Sono letture del sorgente perché il codice sta dentro i componenti; quando qualcuno
 * li estrarrà in funzioni pure, questi test vanno riscritti come test veri.
 */

const pannello = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
const archivio = readFileSync(join(import.meta.dirname, "components", "ArchiveView.tsx"), "utf8");
const editorProgetti = readFileSync(join(import.meta.dirname, "editors", "ProjectEditor.tsx"), "utf8");
const editorPersone = readFileSync(join(import.meta.dirname, "editors", "TeamEditor.tsx"), "utf8");
const editorSito = readFileSync(join(import.meta.dirname, "editors", "SiteEditor.tsx"), "utf8");
const frameEditor = readFileSync(join(import.meta.dirname, "components", "EditorFrame.tsx"), "utf8");
const campiRipetibili = readFileSync(join(import.meta.dirname, "components", "RepeatableFields.tsx"), "utf8");
const client = readFileSync(join(import.meta.dirname, "api.ts"), "utf8");
const worker = readFileSync(join(import.meta.dirname, "..", "..", "cloudflare", "src", "index.ts"), "utf8");

describe("ripristino di una revisione", () => {
  it("ricarica i contenuti e fa ripartire l'editor", () => {
    // senza, l'editor resta sui valori di prima e il salvataggio successivo cancella il ripristino
    expect(frameEditor).toContain("await onRestored?.()");
    expect(pannello).toContain("const restored = async () => { setDirty(false); await reload(); setVersioneEditor");
    for (const editor of ["ProjectEditor", "TeamEditor", "SiteEditor"]) {
      expect(pannello, `${editor} non riparte dopo un ripristino`).toContain(`<${editor} onRestored={restored} key={`);
    }
  });
});

describe("ordine dei contenuti", () => {
  it("sposta rispetto a quello che l'utente vede, non alla lista intera", () => {
    expect(archivio).toContain("onMove(item, visible[index - 1])");
    expect(archivio).toContain("onMove(item, visible[index + 1])");
  });

  it("scambia le posizioni in una richiesta sola", () => {
    // due chiamate separate lasciano due contenuti con lo stesso ordine se la seconda fallisce
    expect(pannello).toContain("adminApi.swap(resource, item.id, neighbour.id)");
    expect(pannello).not.toContain("Promise.all([adminApi.order");
    expect(worker).toContain("async function swapDisplayOrder");
    expect(worker).toContain("env.DB.batch([");
  });
});

describe("scritture concorrenti", () => {
  it("il salvataggio dichiara da quale versione parte", () => {
    expect(client).toContain("expectedUpdatedAt");
    const salvataggi = [...`${editorProgetti}\n${editorPersone}\n${editorSito}`.matchAll(/adminApi\.save\((.*?)\);/g)].map((match) => match[1]);
    expect(salvataggi.length).toBeGreaterThan(0);
    for (const salvataggio of salvataggi) expect(salvataggio, `un salvataggio non manda la versione: ${salvataggio}`).toContain("entity?.updatedAt");
  });

  it("il server rifiuta chi parte da una versione superata", () => {
    expect(worker).toContain("entity.updatedAt !== expectedUpdatedAt");
    expect(worker).toContain("status: 409");
  });
});

describe("sessione scaduta", () => {
  it("in produzione non propone il modulo dell'ambiente locale", () => {
    expect(client).toContain("export class AccessoNegato");
    expect(client).toContain("response.status === 401 || response.status === 403");
    expect(pannello).toContain("error instanceof AccessoNegato && !import.meta.env.DEV");
    expect(pannello).toContain("function SessionExpiredScreen");
  });
});

describe("le risposte del back office non finiscono in cache", () => {
  it("viaggiano con private, no-store", () => {
    // con la cache del Worker attiva, una risposta conservata mostra contenuti già modificati:
    // il salvataggio sembra non funzionare e il controllo di versione va in conflitto per sempre
    expect(worker).toContain('headers.set("Cache-Control", "private, no-store")');
  });
});

describe("elenchi scritti una riga per voce", () => {
  it("non ripuliscono il testo mentre si scrive", () => {
    // ripulendo a ogni battitura, lo spazio sparisce appena digitato e l'a capo non si può fare
    expect(campiRipetibili).toContain("function LinesField");
    expect(campiRipetibili).toContain('const [text, setText] = useState(() => values.join("\\n"))');
    expect(campiRipetibili).not.toContain('value={values.join("\\n")}');
  });
});
