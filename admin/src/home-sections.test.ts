import { describe, expect, it } from "vitest";
import { inFondoAllaPagina, sezioneCorrente, type PosizioneSezione } from "./home-sections";

// posizioni come le restituisce getBoundingClientRect: negative sopra il bordo, positive sotto
const pagina = (tops: number[]): PosizioneSezione[] => ["apertura", "associazione", "immagine-manifesto", "attivita", "contatti"].map((anchor, index) => ({ anchor, top: tops[index] }));

describe("sezioneCorrente", () => {
  it("in cima alla pagina indica la prima sezione", () => {
    expect(sezioneCorrente(pagina([120, 900, 1600, 2400, 3200]))).toBe("apertura");
  });

  it("indica l'ultima sezione che ha superato la soglia", () => {
    expect(sezioneCorrente(pagina([-800, -100, 700, 1500, 2300]))).toBe("associazione");
    expect(sezioneCorrente(pagina([-2400, -1700, -900, 60, 900]))).toBe("attivita");
  });

  it("non si lascia ingannare da una sezione precedente ancora in vista", () => {
    // «territorio» resta parzialmente visibile sopra, ma quella che si legge è la successiva
    expect(sezioneCorrente(pagina([-3000, -2400, -1600, -700, 40]))).toBe("contatti");
  });

  it("in fondo alla pagina vince l'ultima sezione", () => {
    expect(sezioneCorrente(pagina([-3000, -2400, -1600, -700, 600]), { inFondo: true })).toBe("contatti");
  });

  it("regge l'elenco vuoto", () => {
    expect(sezioneCorrente([])).toBe("");
  });

  it("rispetta una soglia personalizzata", () => {
    expect(sezioneCorrente(pagina([-10, 200, 900, 1600, 2300]), { soglia: 250 })).toBe("associazione");
    expect(sezioneCorrente(pagina([-10, 200, 900, 1600, 2300]), { soglia: 100 })).toBe("apertura");
  });
});

describe("inFondoAllaPagina", () => {
  it("riconosce il fondo, anche con qualche pixel di scarto", () => {
    expect(inFondoAllaPagina(4200, 900, 5100)).toBe(true);
    expect(inFondoAllaPagina(4198, 900, 5100)).toBe(true);
    expect(inFondoAllaPagina(3000, 900, 5100)).toBe(false);
  });
});
