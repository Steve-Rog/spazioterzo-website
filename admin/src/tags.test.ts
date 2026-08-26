import { describe, expect, it } from "vitest";
import { contentLimits, validateProject } from "../../shared/content-schema";
import { sanitiseTags } from "./tags";

const limits = { maxItems: 20, maxLength: contentLimits.project.theme };

describe("sanitiseTags", () => {
  it("toglie spazi e voci vuote", () => {
    expect(sanitiseTags(["  Ascolto  ", "", "   ", "Cura"], limits)).toEqual(["Ascolto", "Cura"]);
  });

  it("scarta i doppioni ignorando maiuscole e spazi", () => {
    expect(sanitiseTags(["Ascolto", "ascolto", " ASCOLTO "], limits)).toEqual(["Ascolto"]);
  });

  it("taglia le voci troppo lunghe per lo schema", () => {
    const [tag] = sanitiseTags(["x".repeat(80)], limits);
    expect(tag).toHaveLength(contentLimits.project.theme);
  });

  it("non supera il numero massimo di voci", () => {
    expect(sanitiseTags(Array.from({ length: 30 }, (_, index) => `tema-${index}`), limits)).toHaveLength(20);
  });

  it("non lascia mai voci che il server rifiuterebbe", () => {
    const themes = sanitiseTags(["  ", "Ascolto", "Ascolto", "y".repeat(100)], limits);
    const project = {
      slug: "prova", title: "Prova", subtitle: "Sottotitolo", statusLabel: "In corso" as const, dateRange: "2026", location: "Catania",
      audience: "Tutti", themes, cover: "/assets/x.svg", coverAlt: "Copertina", intro: [{ text: "Intro" }], objective: [{ text: "Obiettivo" }],
      blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [],
    };
    expect(validateProject(project)).toBe(true);
  });
});
