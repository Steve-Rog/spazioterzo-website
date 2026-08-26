import { describe, expect, it } from "vitest";
import { validateRichText, type RichText } from "../../shared/content-schema";
import { normaliseHref, toDocument, toRichText, truncate } from "./rich-text";

const roundTrip = (value: RichText) => toRichText(toDocument(value));

describe("normaliseHref", () => {
  it("lascia intatti gli indirizzi già validi per lo schema", () => {
    for (const href of ["/progetti", "#contatti", "https://spazioterzo.org", "http://x.it", "mailto:info@spazioterzo.org"]) {
      expect(normaliseHref(href)).toBe(href);
    }
  });

  it("completa gli indirizzi scritti a mano", () => {
    expect(normaliseHref("spazioterzo.org/progetti")).toBe("https://spazioterzo.org/progetti");
    expect(normaliseHref(" www.spazioterzo.org ")).toBe("https://www.spazioterzo.org");
    expect(normaliseHref("info@spazioterzo.org")).toBe("mailto:info@spazioterzo.org");
    expect(normaliseHref(undefined)).toBe("");
  });
});

describe("conversione RichText <-> tiptap", () => {
  it("mantiene testo, corsivo, evidenziato e link", () => {
    const value: RichText = [
      { text: "Un gruppo " },
      { text: "in ascolto", marks: ["italic"] },
      { text: " e " },
      { text: "in relazione", marks: ["highlight"] },
      { text: "Scrivici", marks: ["link"], href: "https://spazioterzo.org" },
    ];
    expect(roundTrip(value)).toEqual(value);
  });

  it("regge più marchi sullo stesso pezzo di testo", () => {
    const value: RichText = [{ text: "qui", marks: ["italic", "link"], href: "https://spazioterzo.org" }];
    expect(roundTrip(value)).toEqual(value);
  });

  it("normalizza l'indirizzo inserito dalla redazione", () => {
    const document = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "qui", marks: [{ type: "link", attrs: { href: "spazioterzo.org" } }] }] }] };
    expect(toRichText(document)).toEqual([{ text: "qui", marks: ["link"], href: "https://spazioterzo.org" }]);
  });

  it("scarta i marchi che il sito non sa rendere", () => {
    const document = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "grassetto", marks: [{ type: "bold" }, { type: "italic" }] }] }] };
    expect(toRichText(document)).toEqual([{ text: "grassetto", marks: ["italic"] }]);
  });

  it("non lascia href sugli span senza link", () => {
    const value: RichText = [{ text: "solo corsivo", marks: ["italic"] }];
    expect(roundTrip(value)[0]).not.toHaveProperty("href");
  });

  it("restituisce uno span vuoto quando il campo è vuoto", () => {
    expect(toRichText({ type: "doc", content: [{ type: "paragraph" }] })).toEqual([{ text: "" }]);
    expect(roundTrip([{ text: "" }])).toEqual([{ text: "" }]);
  });

  it("taglia al limite conservando i marchi degli span superstiti", () => {
    const value: RichText = [{ text: "Dodici caratt" }, { text: "corsivo", marks: ["italic"] }, { text: "fuori" }];
    expect(truncate(value, 16)).toEqual([{ text: "Dodici caratt" }, { text: "cor", marks: ["italic"] }]);
    expect(truncate(value, 0)).toEqual([{ text: "" }]);
    expect(truncate(value, 500)).toEqual(value);
  });

  it("produce sempre contenuto accettato dalla validazione del server", () => {
    const value: RichText = [
      { text: "Testo " },
      { text: "evidenziato", marks: ["highlight"] },
      { text: " con link", marks: ["link"], href: "spazioterzo.org" },
    ];
    const converted = toRichText(toDocument(value));
    expect(validateRichText(converted, 600)).toBe(true);
  });
});
