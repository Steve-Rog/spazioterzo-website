import { describe as group, expect, it } from "vitest";
import { describe, diffContent, labelFor } from "./diff";

group("describe", () => {
  it("riassume i tipi che compaiono nei contenuti", () => {
    expect(describe("Parole in comune")).toBe("Parole in comune");
    expect(describe("")).toBe("vuoto");
    expect(describe(undefined)).toBe("vuoto");
    expect(describe(["Ascolto", "Cura"])).toBe("Ascolto, Cura");
    expect(describe([])).toBe("nessun elemento");
    expect(describe([{ id: "1" }, { id: "2" }])).toBe("2 elementi");
    expect(describe([{ id: "1" }])).toBe("1 elemento");
  });

  it("legge il testo dentro i campi formattati", () => {
    expect(describe([{ text: "Un gruppo " }, { text: "in ascolto", marks: ["italic"] }])).toBe("Un gruppo in ascolto");
    expect(describe([{ text: "" }])).toBe("vuoto");
  });

  it("accorcia i testi lunghi", () => {
    const long = describe("x".repeat(300));
    expect(long.length).toBe(120);
    expect(long.endsWith("…")).toBe(true);
  });
});

group("diffContent", () => {
  it("elenca solo i campi cambiati", () => {
    const changes = diffContent({ title: "Vecchio", slug: "uguale" }, { title: "Nuovo", slug: "uguale" });
    expect(changes).toEqual([{ field: "title", label: "Titolo", before: "Vecchio", after: "Nuovo" }]);
  });

  it("non segnala differenze quando cambia solo l'ordine delle chiavi", () => {
    expect(diffContent({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });

  it("tratta campo assente e campo vuoto come equivalenti a null", () => {
    expect(diffContent({ seoTitle: undefined }, {})).toEqual([]);
    expect(diffContent({}, { seoTitle: "Nuovo" })[0]).toMatchObject({ before: "vuoto", after: "Nuovo" });
  });

  it("gestisce le versioni mancanti", () => {
    expect(diffContent(undefined, { title: "Solo dopo" })).toHaveLength(1);
    expect(diffContent(undefined, undefined)).toEqual([]);
  });

  it("ordina per etichetta in italiano", () => {
    const changes = diffContent({ title: "a", audience: "a", slug: "a" }, { title: "b", audience: "b", slug: "b" });
    expect(changes.map((change) => change.label)).toEqual(["Destinatari", "Slug URL", "Titolo"]);
  });

  it("usa il nome del campo quando non c'è un'etichetta", () => {
    expect(labelFor("campoSconosciuto")).toBe("campoSconosciuto");
  });
});
