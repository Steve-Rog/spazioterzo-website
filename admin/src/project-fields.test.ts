import { describe, expect, it } from "vitest";
import { asRichText, validateProject, validateSiteSettings, type ProjectContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../shared/default-site-settings";
import { composeThemes, dropEmptyLines, dropEmptyPairs, emptyImageBlocks, incompleteCta, incompletePair, longLine, mainTheme, missingInStep, missingProjectFields, otherThemes, slugWhileTyping } from "./project-fields";

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

describe("indirizzo della pagina mentre si scrive", () => {
  it("non mangia il trattino appena digitato", () => {
    // normaliseProjectSlug toglie i trattini ai bordi: applicata a ogni lettera renderebbe
    // impossibile comporre un indirizzo di più parole
    expect(slugWhileTyping("laboratorio-")).toBe("laboratorio-");
    expect(slugWhileTyping("laboratorio-di-")).toBe("laboratorio-di-");
    expect(slugWhileTyping("laboratorio-di-quartiere")).toBe("laboratorio-di-quartiere");
  });

  it("ripulisce comunque quello che il server rifiuterebbe", () => {
    expect(slugWhileTyping("Città Aperta")).toBe("citta-aperta");
    expect(slugWhileTyping("spazio/terzo?")).toBe("spazio-terzo-");
  });
});

describe("invito finale", () => {
  const conCta = (cta?: { label: string; href: string }): ProjectContent => ({ ...completo, cta });

  it("segnala l'invito lasciato a metà, che il server rifiuterebbe senza spiegazioni", () => {
    expect(incompleteCta(conCta({ label: "Parliamone", href: "" }))).toContain("non porta da nessuna parte");
    expect(incompleteCta(conCta({ label: "", href: "/contatti" }))).toContain("non il testo");
    expect(validateProject(conCta({ label: "Parliamone", href: "" }))).toBe(false);
  });

  it("tace quando l'invito è completo o assente del tutto", () => {
    expect(incompleteCta(conCta({ label: "Parliamone", href: "/contatti" }))).toBeNull();
    expect(incompleteCta(conCta(undefined))).toBeNull();
    expect(incompleteCta(conCta({ label: "", href: "" }))).toBeNull();
  });
});

describe("righe ripetibili lasciate a metà", () => {
  it("toglie quelle vuote, che il server rifiuterebbe senza spiegazioni", () => {
    expect(dropEmptyPairs([{ label: "Instagram", href: "https://esempio.it" }, { label: "", href: "" }])).toHaveLength(1);
    expect(dropEmptyPairs([{ label: " ", href: " " }])).toHaveLength(0);
    expect(dropEmptyLines(["333 1234567", "", "  "])).toEqual(["333 1234567"]);
  });

  it("segnala quelle compilate a metà, dicendo quale riga", () => {
    expect(incompletePair([{ label: "Instagram", href: "" }], "Social")).toContain("Social 1: manca l’indirizzo");
    expect(incompletePair([{ label: "ok", href: "https://esempio.it" }, { label: "", href: "https://altro.it" }], "Social")).toContain("Social 2: manca il nome");
    expect(incompletePair([{ label: "ok", href: "https://esempio.it" }], "Social")).toBeNull();
  });

  it("una riga vuota basta a far rifiutare il contenuto dal server", () => {
    const conSocialVuoto = { ...defaultSiteSettings, identity: { ...defaultSiteSettings.identity, socialLinks: [{ label: "", href: "" }] } };
    expect(validateSiteSettings(conSocialVuoto)).toBe(false);
    expect(validateSiteSettings({ ...conSocialVuoto, identity: { ...conSocialVuoto.identity, socialLinks: dropEmptyPairs(conSocialVuoto.identity.socialLinks) } })).toBe(true);
  });
});

describe("righe più lunghe di quanto lo schema accetti", () => {
  it("dice quale riga e quanto è lunga, invece di lasciar rispondere il server", () => {
    const messaggio = longLine(["breve", "x".repeat(300)], 240, "Risultato");
    expect(messaggio).toContain("Risultato 2");
    expect(messaggio).toContain("300 caratteri");
    // è davvero la condizione che il server rifiuta
    expect(validateProject({ ...completo, outcomes: ["x".repeat(300)] })).toBe(false);
  });

  it("tace quando le righe stanno nei limiti", () => {
    expect(longLine(["breve", "anche questa"], 240, "Risultato")).toBeNull();
    expect(longLine([], 240, "Risultato")).toBeNull();
  });
});
