import { describe, expect, it } from "vitest";
import { clampSnippet, projectSnippet, siteSnippet } from "./seo";

const base = { slug: "parole-in-comune", title: "Parole in comune", subtitle: "Gruppi di ascolto", suffix: "Spazio Terzo" };

describe("projectSnippet", () => {
  it("compone titolo e indirizzo come il sito", () => {
    const snippet = projectSnippet(base);
    expect(snippet.title).toBe("Parole in comune — Spazio Terzo");
    expect(snippet.url).toBe("spazioterzo.org/progetti/parole-in-comune");
  });

  it("segnala quando sta usando i ripieghi", () => {
    const snippet = projectSnippet(base);
    expect(snippet.usesFallbackTitle).toBe(true);
    expect(snippet.usesFallbackDescription).toBe(true);
    expect(snippet.description).toBe("Gruppi di ascolto");
  });

  it("preferisce i campi SEO quando ci sono", () => {
    const snippet = projectSnippet({ ...base, seoTitle: "Ascolto di gruppo a Catania", seoDescription: "Percorsi di parola" });
    expect(snippet.title).toBe("Ascolto di gruppo a Catania — Spazio Terzo");
    expect(snippet.description).toBe("Percorsi di parola");
    expect(snippet.usesFallbackTitle).toBe(false);
  });

  it("regge i campi vuoti senza mostrare stringhe monche", () => {
    const snippet = projectSnippet({ slug: "", title: "", subtitle: "", suffix: "" });
    expect(snippet.title).toBe("Titolo progetto");
    expect(snippet.url).toBe("spazioterzo.org/progetti/slug-del-progetto");
  });

  it("taglia come farebbe Google", () => {
    const snippet = projectSnippet({ ...base, seoTitle: "T".repeat(70) });
    expect(snippet.title.length).toBe(60);
    expect(snippet.title.endsWith("…")).toBe(true);
    expect(clampSnippet("corto", 60)).toBe("corto");
  });
});

describe("siteSnippet", () => {
  it("usa suffisso e descrizione predefinita", () => {
    expect(siteSnippet({ suffix: "Spazio Terzo", description: "Associazione di promozione sociale" })).toMatchObject({
      title: "Psicologia, psicoterapia, comunità — Spazio Terzo",
      description: "Associazione di promozione sociale",
      url: "spazioterzo.org",
      usesFallbackTitle: false,
    });
  });

  it("avvisa quando i campi sono vuoti", () => {
    expect(siteSnippet({ suffix: "", description: "" }).usesFallbackDescription).toBe(true);
  });
});
