export type TeamMember = {
  name: string;
  role: string;
  image: string;
  imagePosition?: string;
  imageCrop?: { x: number; y: number; width: number; height: number };
  bio: string[];
  quote: string;
  quoteAuthor?: string;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Jacopo Raniolo",
    role: "Psicologo clinico e psicodrammatista",
    image: "/assets/team/jacopo-raniolo.jpg",
    bio: [
      "Jacopo Raniolo è uno psicologo clinico e psicodrammatista che ha fatto della fusione tra arte e psicologia la sua cifra distintiva.",
      "Formatosi tra Torino e Catania, ha affinato il suo sguardo clinico lavorando con minori in contesti scolastici, progettando interventi di resilienza per il Ministero della Giustizia e collaborando con servizi sanitari territoriali. Ma è nel linguaggio dello psicodramma che trova la sintesi perfetta tra la sua passione teatrale e la professione psicoterapeutica: uno spazio dove le storie prendono vita, i conflitti si mettono in scena e il cambiamento diventa esperienza concreta.",
      "Oggi unisce la specializzazione in psicoterapia psicodrammatica alla formazione continua nel teatro di prosa e d’improvvisazione, convinto che “giocare seriamente” sia la chiave per accedere a nuove prospettive.",
    ],
    quote: "Il corpo sa cose che la mente ancora ignora. Lo psicodramma è l’arte di tradurle in movimento, relazione e finalmente significato.",
  },
  {
    name: "Sonja Brunetto",
    role: "Psicologa clinica e psicoterapeuta psicoanalitica (IIPG) in formazione",
    image: "/assets/team/sonja-brunetto.jpg",
    bio: [
      "Sonja Brunetto è psicologa clinica e psicoterapeuta psicoanalitica (IIPG) in formazione, con un percorso che intreccia psicoanalisi, psicodiagnostica ed esperienza maturata in ambito scolastico, comunitario e clinico.",
      "Formatasi tra Catania e Roma, ha costruito la sua pratica nei luoghi della cura e della relazione, accompagnando adolescenti e adulti nel delicato compito di riconoscersi e ritrovarsi, sia nel lavoro individuale che all’interno dei gruppi.",
      "Da sempre attenta alle tematiche sociali, ha ideato e scritto numerosi progetti rivolti a scuole ed enti, dedicati all’educazione affettiva e alla prevenzione delle dipendenze, collaborando con istituzioni scolastiche e realtà del territorio.",
      "Tra i suoi principali interessi spiccano il lavoro sulle dipendenze e sulle tossicodipendenze – ambito che studia e attraversa con la clinica da circa dieci anni – e la conduzione di gruppi, pensati come spazi di parola, esperienza emotiva e trasformazione condivisa.",
    ],
    quote: "Pensare insieme è il primo atto creativo di ogni incontro umano.",
    quoteAuthor: "Ogden",
  },
  {
    name: "Ylenia D’Agostino",
    role: "Psicologa clinica e specializzanda in psicoterapia psicoanalitica individuale e di gruppo",
    image: "/assets/team/ylenia-dagostino.jpg",
    bio: [
      "Ylenia D’Agostino è una psicologa clinica e specializzanda in psicoterapia psicoanalitica individuale e di gruppo, con un orientamento al lavoro nei contesti clinici, di frontiera e marginalità sociale.",
      "Formatasi tra Catania e Roma, integrando lo studio accademico con una pratica professionale immersa nei luoghi più fragili: dalle comunità per adulti e minori stranieri, ai dormitori per persone senza dimora, dai progetti di prevenzione sanitaria fino ai servizi psichiatrici territoriali.",
      "Particolare rilievo nel suo percorso assume il lavoro con i gruppi terapeutici e gruppi di ascolto, vissuti come luoghi di rispecchiamento, co-costruzione e trasformazione. Ha condotto e co-condotto gruppi in ambito clinico, psichiatrico e comunitario, utilizzando la dimensione gruppale come strumento privilegiato per accedere a vissuti profondi e creare legami di senso.",
      "Convinta che la psicoanalisi non debba restare chiusa nei contesti istituzionali, si impegna ogni giorno per portare lo sguardo clinico là dove spesso manca: tra i migranti, i senza dimora, i soggetti marginalizzati dal discorso sociale. Nella convinzione che le periferie – geografiche, esistenziali, simboliche – siano i luoghi in cui si gioca davvero la possibilità del cambiamento.",
    ],
    quote: "È il legame che cura.",
    quoteAuthor: "I.D. Yalom",
  },
];
