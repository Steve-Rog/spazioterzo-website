import { asRichText, type SiteSettingsContent } from "./content-schema";

const activities = [
  ["Interventi di gruppo", "Psicodramma, gruppi di sostegno e laboratori esperienziali in ambito clinico, educativo e sociale."],
  ["Promozione della salute mentale", "Percorsi di prevenzione, integrazione e contrasto alla marginalità per rendere il benessere mentale un bene condiviso."],
  ["Formazione e supervisione", "Per professionisti, équipe e organizzazioni che desiderano coltivare strumenti, sguardi e pratiche di cura più consapevoli."],
  ["Cultura e ricerca", "Attività culturali e di ricerca per diffondere una cultura psicologica accessibile e orientata al benessere collettivo."],
] as const;

export const defaultSiteSettings: SiteSettingsContent = {
  identity: { organizationName: "Spazio Terzo", legalForm: "Associazione di promozione sociale", city: "Catania", country: "Italia", email: "info@spazioterzo.it", logoLight: "/assets/logo_spazioterzo_negative.svg", logoDark: "/assets/logo_spazioterzo.svg", socialLinks: [] },
  seo: { titleSuffix: "Spazio Terzo", defaultDescription: "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio." },
  home: {
    hero: { headline: [{ text: "Lo spazio condiviso diventa" }, { text: " cura.", marks: ["italic"] }], meta: "Catania · dal 2014", ctaLabel: "Scrivici" },
    association: { heading: [{ text: "Facciamo spazio alle persone, " }, { text: "per far crescere comunità.", marks: ["italic"] }], body: asRichText("Promuoviamo spazi di ascolto, sostegno e formazione in cui le persone possano ritrovare connessione, sviluppare risorse e affrontare insieme fragilità e sfide individuali e comunitarie."), ctaLabel: "Il nostro approccio", ctaHref: "#percorsi" },
    origin: { eyebrow: "Perché Spazio Terzo", prelude: [{ text: "Il nome " }, { text: "Spazio Terzo", marks: ["highlight"] }, { text: " nasce da un’idea semplice e profonda:" }], heading: [{ text: "il cambiamento autentico avviene nell’incontro.", marks: ["highlight"] }], statement: [{ text: "Non nello scontro, non nell’isolamento, ma in quello spazio nuovo che si crea quando due o più persone " }, { text: "si confrontano, portando con sé mondi diversi.", marks: ["highlight"] }, { text: " È un luogo dinamico, che non appartiene a nessuno dei partecipanti, ma emerge tra loro, come una scintilla che accende possibilità inedite." }], identity: [{ text: "Spazio Terzo APS", marks: ["highlight"] }, { text: " è un’associazione di promozione sociale senza scopo di lucro che opera a " }, { text: "Catania", marks: ["highlight"] }, { text: ", impegnata nella cura del benessere psicologico e relazionale attraverso il potere trasformativo del gruppo." }] },
    activities: { heading: [{ text: "Dove la cura diventa " }, { text: "azione.", marks: ["italic"] }], items: activities.map(([title, description], index) => ({ id: String(index + 1), title, description: asRichText(description) })) },
    territory: { heading: asRichText("La cura non è un lusso."), body: asRichText("È un diritto da costruire insieme, nei quartieri, nelle scuole, nelle famiglie. Per questo lavoriamo con le persone e con le realtà che ogni giorno fanno comunità."), ctaLabel: "Parliamone", ctaHref: "#contatti" },
    imageStatement: { caption: "Ogni incontro può aprire una possibilità.", verticalWord: "ASCOLTO" },
    contact: { heading: [{ text: "Facciamo " }, { text: "spazio?", marks: ["italic"] }], body: asRichText("Raccontaci di cosa hai bisogno. Ti risponderemo con cura."), emailLabel: "info@spazioterzo.it" },
  },
};
