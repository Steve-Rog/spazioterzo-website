import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fuocoHome, fuocoProgetto } from "./preview-focus";

/**
 * L'anteprima del back office disegna i componenti veri del sito.
 * Questi controlli falliscono quando qualcuno rompe il patto che lo rende possibile,
 * invece di lasciarlo scoprire a chi apre l'anteprima settimane dopo.
 */

const radice = join(import.meta.dirname, "..", "..");
const cartellaComponenti = join(radice, "app", "components");
const cartellaStili = join(radice, "app", "styles");

function fileRicorsivi(cartella: string): string[] {
  return readdirSync(cartella, { withFileTypes: true }).flatMap((voce) => {
    const percorso = join(cartella, voce.name);
    if (voce.isDirectory()) return fileRicorsivi(percorso);
    return voce.name.endsWith(".tsx") ? [percorso] : [];
  });
}

describe("patto fra sito e anteprima", () => {
  it("i componenti del sito ricevono i dati dalle proprietà, non li vanno a cercare", () => {
    // useLoaderData o useParams dentro un componente lo legano alla rotta: l'anteprima non potrebbe più usarlo
    const colpevoli = fileRicorsivi(cartellaComponenti).filter((percorso) => {
      const contenuto = readFileSync(percorso, "utf8");
      return contenuto.includes("useLoaderData") || contenuto.includes("useParams");
    });
    expect(colpevoli.map((percorso) => percorso.replace(radice, ""))).toEqual([]);
  });

  it("la home ha una composizione sola, usata dalla rotta e dall'anteprima", () => {
    const rotta = readFileSync(join(radice, "app", "routes", "home.tsx"), "utf8");
    const anteprima = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
    expect(rotta).toContain("<HomePage site={site} />");
    expect(anteprima).toContain("<HomePage site={site} />");

    // le sezioni si dichiarano una volta sola: se compaiono anche altrove, le due viste possono divergere
    const composizione = readFileSync(join(cartellaComponenti, "home", "HomePage.tsx"), "utf8");
    for (const sezione of ["Hero", "AssociationIntro", "ImageStatement", "OriginStory", "Activities", "Territory", "Contact"]) {
      expect(composizione).toContain(`<${sezione} content={site} />`);
      expect(rotta).not.toContain(`<${sezione} content={site} />`);
      expect(anteprima).not.toContain(`<${sezione} content={site} />`);
    }
  });

  it("sito e anteprima condividono intestazione e footer", () => {
    const cornice = readFileSync(join(cartellaComponenti, "layout", "PublicPageShell.tsx"), "utf8");
    expect(cornice).toContain("<SiteHeader");
    expect(cornice).toContain("<SiteFooter");

    const rottaRadice = readFileSync(join(radice, "app", "root.tsx"), "utf8");
    const anteprima = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
    expect(rottaRadice).toContain("<PublicPageShell site={site} currentPage={currentPage}>");
    expect(anteprima).toContain('<PublicPageShell site={site} currentPage="home">');
    expect(anteprima).toContain('<PublicPageShell site={site} currentPage="projects">');
  });

  it("l'indice della home nel back office elenca le stesse sezioni della pagina", () => {
    const composizione = readFileSync(join(cartellaComponenti, "home", "HomePage.tsx"), "utf8");
    const ordineSito = [...composizione.matchAll(/<(\w+) content=\{site\} \/>/g)].map((match) => match[1]);
    const pannello = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
    const elenco = pannello.slice(pannello.indexOf("const homeSections"), pannello.indexOf("function HomeEditor"));
    const ordinePannello = [...elenco.matchAll(/key: "(\w+)"/g)].map((match) => match[1]);

    const corrispondenze: Record<string, string> = {
      Hero: "hero", AssociationIntro: "association", ImageStatement: "imageStatement",
      OriginStory: "origin", Activities: "activities", Territory: "territory", Contact: "contact",
    };
    expect(ordinePannello).toEqual(ordineSito.map((componente) => corrispondenze[componente]));
  });

  it("i fogli di stile del sito entrano nell'anteprima senza elenchi da aggiornare", () => {
    const anteprima = readFileSync(join(import.meta.dirname, "PreviewFrame.tsx"), "utf8");
    expect(anteprima).toContain('import.meta.glob("../../app/styles/*.css"');
    // nessun foglio citato per nome: sarebbe una lista da tenere allineata a mano
    const fogli = readdirSync(cartellaStili).filter((nome) => nome.endsWith(".css"));
    expect(fogli.length).toBeGreaterThan(0);
    for (const foglio of fogli) expect(anteprima).not.toContain(`styles/${foglio}?inline`);
  });

  it("i punti su cui si mette a fuoco l'anteprima esistono davvero nel sito", () => {
    // se un selettore non corrisponde a nulla, l'anteprima resterebbe ferma senza dirlo
    const markupSito = fileRicorsivi(cartellaComponenti).map((percorso) => readFileSync(percorso, "utf8")).join("\n");
    for (const selettore of [...Object.values(fuocoProgetto), ...Object.values(fuocoHome)]) {
      if (!selettore) continue;
      expect(markupSito, `manca ${selettore} nei componenti del sito`).toContain(`"${selettore.slice(1)}`);
    }
  });

  it("ogni scheda dell'editor e ogni sezione della home hanno un bersaglio nell'anteprima", () => {
    const pannello = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
    const schede = [...pannello.matchAll(/<Tabs\.Tab value="(\w+)"/g)].map((match) => match[1]);
    expect(schede.length).toBeGreaterThan(0);
    for (const scheda of schede) expect(Object.keys(fuocoProgetto), `la scheda ${scheda} non sa dove far guardare l'anteprima`).toContain(scheda);

    const elenco = pannello.slice(pannello.indexOf("const homeSections"), pannello.indexOf("function HomeEditor"));
    const ancore = [...elenco.matchAll(/anchor: "([\w-]+)"/g)].map((match) => match[1]);
    for (const ancora of ancore) expect(Object.keys(fuocoHome), `la sezione ${ancora} non sa dove far guardare l'anteprima`).toContain(ancora);
  });

  it("i componenti del sito non pescano dai contenuti di esempio del repository", () => {
    // i dati in app/components/**/content.ts sono copie di prova: se un componente li legge,
    // la pagina mostra quelli invece dei contenuti pubblicati dal back office
    const colpevoli = fileRicorsivi(cartellaComponenti).filter((percorso) => {
      const contenuto = readFileSync(percorso, "utf8");
      return /import \{[^}]*\b(projects|teamMembers)\b[^}]*\} from/.test(contenuto);
    });
    expect(colpevoli.map((percorso) => percorso.replace(radice, ""))).toEqual([]);
  });

  it("i progetti correlati arrivano dal catalogo di chi disegna la pagina", () => {
    const contenuti = readFileSync(join(cartellaComponenti, "projects", "content.ts"), "utf8");
    expect(contenuti).toContain("getRelatedProjects(project: Project, catalog: Project[])");
    // rotta pubblica e anteprima passano entrambe un catalogo: senza, la sezione resterebbe vuota o falsa
    expect(readFileSync(join(radice, "app", "routes", "project-detail.tsx"), "utf8")).toContain("getRelatedProjects(project, catalog)");
    expect(readFileSync(join(import.meta.dirname, "App.tsx"), "utf8")).toContain("getRelatedProjects(legacy, catalogo.map(projectToLegacy))");
  });

  it("quello che va mostrato in anteprima non vive dentro una finestra di Mantine", () => {
    // i portali di Modal e Drawer escono dall'iframe: il contenuto va estratto in un componente riusabile
    const profilo = readFileSync(join(cartellaComponenti, "people", "TeamProfileModal.tsx"), "utf8");
    expect(profilo).toContain("export function TeamProfileContent");
    const anteprima = readFileSync(join(import.meta.dirname, "App.tsx"), "utf8");
    expect(anteprima).toContain("<TeamProfileContent");
    expect(anteprima).not.toContain("<TeamProfileModal");
  });
});
