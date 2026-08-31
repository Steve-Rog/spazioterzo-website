export type ProjectStatus = "In corso" | "Concluso";

export type ProjectBlock =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; source?: string }
  | { type: "list"; title: string; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string; crop?: { x: number; y: number; width: number; height: number } }
  | { type: "stat"; value: string; label: string };

export type ProjectVideo = {
  provider: "youtube" | "vimeo";
  id: string;
  thumbnail: string;
  alt: string;
  caption?: string;
};

export type ProjectLink = {
  label: string;
  href: string;
  kind: "instagram" | "facebook" | "website" | "materials";
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  status: ProjectStatus;
  dateRange: string;
  location: string;
  audience: string;
  themes: string[];
  cover: string;
  coverAlt: string;
  coverCrop?: { x: number; y: number; width: number; height: number };
  intro: string;
  objective: string;
  blocks: ProjectBlock[];
  outcomes: string[];
  outcomesHeading?: import("../../../shared/content-schema").RichText;
  links?: ProjectLink[];
  video?: ProjectVideo;
  cta?: { label: string; href: string };
  partners?: string[];
  funders?: string[];
  visibilityNote?: string;
  relatedSlugs: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export const projects: Project[] = [
  {
    slug: "parole-in-comune",
    title: "Parole in comune",
    subtitle: "Gruppi di ascolto per ritrovare spazio, voce e relazione.",
    status: "In corso",
    dateRange: "2025 — in corso",
    location: "Catania",
    audience: "Giovani adulti e persone in momenti di transizione",
    themes: ["Gruppi di ascolto", "Psicodramma", "Benessere relazionale"],
    cover: "/assets/projects/parole-in-comune.svg",
    coverAlt: "Linee e punti che compongono uno spazio condiviso in blu, crema e arancio.",
    intro:
      "Un gruppo può essere un luogo in cui non serve arrivare già pronti. Parole in comune nasce per chi desidera attraversare cambiamenti, domande e fragilità insieme ad altre persone.",
    objective:
      "Creare incontri periodici in cui l’ascolto, l’esperienza e il linguaggio dello psicodramma aiutino a dare forma a ciò che spesso resta in silenzio.",
    blocks: [
      {
        type: "paragraph",
        text:
          "Non proponiamo risposte prefabbricate. Partiamo da ciò che ogni partecipante porta con sé e costruiamo, incontro dopo incontro, uno spazio di confronto rispettoso e concreto.",
      },
      {
        type: "quote",
        text: "Quando una storia trova ascolto, smette di essere soltanto individuale.",
      },
      {
        type: "list",
        title: "Come lavoriamo",
        items: [
          "Piccoli gruppi con una cadenza riconoscibile.",
          "Parola, corpo e immaginazione come strumenti di esplorazione.",
          "Una conduzione attenta ai tempi e alle differenze di ciascuno.",
        ],
      },
    ],
    outcomes: [
      "Uno spazio continuativo di ascolto e confronto.",
      "Occasioni per riconoscere risorse personali e relazionali.",
      "Legami che non si esauriscono nell’incontro singolo.",
    ],
    links: [{ label: "Segui gli aggiornamenti su Instagram", href: "https://www.instagram.com/spazio.terzo/", kind: "instagram" }],
    cta: { label: "Parliamone insieme", href: "/#contatti" },
    relatedSlugs: ["stare-in-relazione", "pratiche-di-cura"],
  },
  {
    slug: "stare-in-relazione",
    title: "Stare in relazione",
    subtitle: "Educazione affettiva e prevenzione nei contesti scolastici.",
    status: "In corso",
    dateRange: "Anno scolastico 2025/26",
    location: "Scuole secondarie di Catania",
    audience: "Studenti, docenti e comunità educante",
    themes: ["Scuola", "Educazione affettiva", "Prevenzione"],
    cover: "/assets/projects/stare-in-relazione.svg",
    coverAlt: "Forme di carta sovrapposte e punti di connessione nei colori del progetto.",
    intro:
      "Una scuola è anche il luogo in cui si impara a nominare ciò che accade nelle relazioni. Stare in relazione apre contesti di parola attorno ad affettività, consenso, conflitto e cura.",
    objective:
      "Offrire strumenti e linguaggi condivisi per attraversare le relazioni con più consapevolezza, senza semplificare le domande delle ragazze e dei ragazzi.",
    blocks: [
      {
        type: "paragraph",
        text:
          "Il progetto porta la psicologia nei luoghi quotidiani dell’apprendimento. I laboratori non sono lezioni frontali: alternano confronto, esercizi esperienziali e momenti di elaborazione comune.",
      },
      {
        type: "image",
        src: "/assets/projects/stare-in-relazione.svg",
        alt: "Composizione grafica che richiama un tavolo di lavoro condiviso.",
        caption: "Un linguaggio comune nasce dal confronto, non dalla lezione.",
      },
      {
        type: "list",
        title: "I temi che apriamo",
        items: ["Affettività, consenso e confini.", "Conflitto, ascolto e responsabilità.", "Prevenzione delle dipendenze e benessere digitale."],
      },
    ],
    outcomes: [
      "Laboratori che rendono dicibili domande spesso lasciate ai margini.",
      "Spazi di confronto tra studenti, docenti e figure educative.",
      "Strumenti riutilizzabili nella vita quotidiana della scuola.",
    ],
    links: [{ label: "Scopri Spazio Terzo su Facebook", href: "https://www.facebook.com/profile.php?id=61575980708598", kind: "facebook" }],
    cta: { label: "Porta il progetto nella tua scuola", href: "/#contatti" },
    relatedSlugs: ["parole-in-comune", "pratiche-di-cura"],
  },
  {
    slug: "pratiche-di-cura",
    title: "Pratiche di cura",
    subtitle: "Formazione e supervisione per chi lavora ogni giorno nelle relazioni.",
    status: "In corso",
    dateRange: "2025 — in corso",
    location: "Catania e territorio",
    audience: "Professionisti, équipe e organizzazioni",
    themes: ["Formazione", "Supervisione", "Terzo settore"],
    cover: "/assets/projects/pratiche-di-cura.svg",
    coverAlt: "Tracciati, forme e punti collegati in un campo blu-verde.",
    intro:
      "Prendersi cura degli altri richiede luoghi in cui potersi fermare a pensare insieme. Pratiche di cura è un percorso di formazione e supervisione per équipe che abitano contesti complessi.",
    objective:
      "Sostenere professionisti e organizzazioni nella costruzione di pratiche più consapevoli, condivise e capaci di restare vicine alle persone.",
    blocks: [
      {
        type: "paragraph",
        text:
          "La supervisione non è un controllo sul lavoro svolto: è un tempo per guardare meglio ciò che accade nella relazione di aiuto, nei gruppi di lavoro e nelle istituzioni.",
      },
      { type: "stat", value: "Insieme", label: "è il metodo prima ancora che il risultato." },
      {
        type: "list",
        title: "A chi si rivolge",
        items: ["Équipe socio-sanitarie ed educative.", "Associazioni e realtà del terzo settore.", "Professionisti che desiderano approfondire il lavoro gruppale."],
      },
    ],
    outcomes: [
      "Spazi protetti per elaborare casi, dinamiche e domande di lavoro.",
      "Strumenti condivisi per stare nelle complessità organizzative.",
      "Una cultura della cura che parte anche da chi cura.",
    ],
    links: [{ label: "Scopri le attività dell’associazione", href: "/#percorsi", kind: "website" }],
    cta: { label: "Costruiamo un percorso", href: "/#contatti" },
    relatedSlugs: ["parole-in-comune", "stare-in-relazione"],
  },
];

export function getProject(slug: string | undefined, catalog: Project[] = projects) {
  return catalog.find((project) => project.slug === slug);
}

/**
 * Il catalogo va passato da chi disegna la pagina: sono i progetti veri, quelli caricati
 * dall'API o mostrati nel back office. Senza, la sezione «Altri progetti» finirebbe per
 * mostrare le copie di esempio di questo file al posto dei contenuti pubblicati.
 */
export function getRelatedProjects(project: Project, catalog: Project[]) {
  return project.relatedSlugs
    .map((slug) => getProject(slug, catalog))
    .filter((related): related is Project => Boolean(related));
}
