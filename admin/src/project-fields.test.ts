import { describe, expect, it } from "vitest";
import { asRichText, validateProject, type ProjectContent } from "../../shared/content-schema";
import { composeThemes, emptyImageBlocks, mainTheme, missingInStep, missingProjectFields, otherThemes } from "./project-fields";

const vuoto: ProjectContent = {
  slug: "", title: "", subtitle: "", statusLabel: "In corso", dateRange: "", location: "", audience: "", themes: [],
  cover: "", coverAlt: "", intro: asRichText(""), objective: asRichText(""), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [],
};
const completo: ProjectContent = {
  ...vuoto, slug: "laboratorio-di-quartiere", title: "Laboratorio di quartiere", subtitle: "Un laboratorio aperto",
  dateRange: "2026", location: "Catania", audience: "Abitanti del quartiere", cover: "/assets/x.svg", coverAlt: "Copertina",
};

describe("requisiti del progetto", () => {
  it("elenca tutto quello che manca in un progetto vuoto", () => {
    expect(missingProjectFields(vuoto).map((requirement) => requirement.field)).toEqual([
      "title", "slug", "subtitle", "cover", "coverAlt", "dateRange", "location", "audience",
    ]);
  });

  it("non chiede nulla quando il progetto è completo", () => {
    expect(missingProjectFields(completo)).toEqual([]);
  });

  it("rifiuta un indirizzo pagina scritto male", () => {
    expect(missingProjectFields({ ...completo, slug: "Non Valido!" }).map((requirement) => requirement.field)).toEqual(["slug"]);
  });

  it("divide i campi mancanti fra i due passaggi della creazione", () => {
    expect(missingInStep(vuoto, 0).map((requirement) => requirement.field)).toEqual(["title", "slug", "subtitle", "cover", "coverAlt"]);
    expect(missingInStep(vuoto, 1).map((requirement) => requirement.field)).toEqual(["dateRange", "location", "audience"]);
  });

  it("copre esattamente ciò che il server pretende: se non manca nulla, il salvataggio passa", () => {
    expect(missingProjectFields(completo)).toEqual([]);
    expect(validateProject(completo)).toBe(true);
    // e viceversa: togliendo un campo richiesto, entrambi si accorgono
    for (const requirement of missingProjectFields(vuoto)) {
      const parziale = { ...completo, [requirement.field]: requirement.field === "slug" ? "Non Valido!" : "" };
      expect(validateProject(parziale)).toBe(false);
    }
  });
});

describe("temi", () => {
  it("separa il tema principale dagli altri", () => {
    expect(mainTheme(["Ascolto", "Cura"])).toBe("Ascolto");
    expect(otherThemes(["Ascolto", "Cura"])).toEqual(["Cura"]);
    expect(mainTheme([])).toBe("");
  });

  it("ricompone la lista tenendo il principale in testa", () => {
    expect(composeThemes("Ascolto", ["Cura"])).toEqual(["Ascolto", "Cura"]);
    expect(composeThemes("  ", ["Cura"])).toEqual(["Cura"]);
    expect(composeThemes("Ascolto", [])).toEqual(["Ascolto"]);
  });
});

describe("blocchi immagine incompleti", () => {
  const conBlocchi = (blocks: ProjectContent["blocks"]): ProjectContent => ({ ...completo, blocks });

  it("segnala la posizione dei blocchi immagine rimasti senza foto", () => {
    const progetto = conBlocchi([
      { id: "a", type: "paragraph", text: asRichText("Testo") },
      { id: "b", type: "image", src: "", alt: "Senza foto" },
      { id: "c", type: "image", src: "/assets/x.svg", alt: "Con foto" },
      { id: "d", type: "image", alt: "Mai scelta" },
    ]);
    expect(emptyImageBlocks(progetto)).toEqual([2, 4]);
  });

  it("non segnala nulla quando ogni immagine ha il suo file", () => {
    expect(emptyImageBlocks(conBlocchi([{ id: "a", type: "image", src: "/assets/x.svg", alt: "Con foto" }]))).toEqual([]);
    expect(emptyImageBlocks(completo)).toEqual([]);
  });

  it("descrive la stessa condizione che il server rifiuta", () => {
    const progetto = conBlocchi([{ id: "b", type: "image", src: "  ", alt: "Spazi" }]);
    expect(emptyImageBlocks(progetto)).toEqual([1]);
    expect(validateProject(progetto)).toBe(false);
  });
});
