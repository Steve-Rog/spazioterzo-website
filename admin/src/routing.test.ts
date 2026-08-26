import { describe, expect, it } from "vitest";
import { formatRoute, homeRoute, parseRoute, sameRoute, type Route } from "./routing";

const roundTrip = (route: Route) => parseRoute(formatRoute(route));

describe("parseRoute", () => {
  it("porta all'archivio progetti quando l'indirizzo non dice altro", () => {
    for (const hash of ["", "#", "#/", "#/qualcosa", "#/progetti"]) {
      expect(parseRoute(hash)).toEqual(homeRoute);
    }
  });

  it("riconosce le sezioni", () => {
    expect(parseRoute("#/persone").section).toBe("team");
    expect(parseRoute("#/sito").section).toBe("site");
  });

  it("apre il contenuto indicato", () => {
    expect(parseRoute("#/progetti/abc-123")).toEqual({ section: "projects", editingId: "abc-123", sitePanel: "identity" });
    expect(parseRoute("#/persone/nuovo").editingId).toBe("new");
  });

  it("seleziona il pannello del sito, con ripiego sull'identità", () => {
    expect(parseRoute("#/sito/home")).toEqual({ section: "site", editingId: "site", sitePanel: "home" });
    expect(parseRoute("#/sito/seo").sitePanel).toBe("seo");
    expect(parseRoute("#/sito/inventato").sitePanel).toBe("identity");
  });

  it("ignora le parti in eccesso invece di rompersi", () => {
    expect(parseRoute("#/progetti/abc-123/extra/ancora").editingId).toBe("abc-123");
  });
});

describe("formatRoute", () => {
  it("scrive indirizzi leggibili", () => {
    expect(formatRoute(homeRoute)).toBe("#/progetti");
    expect(formatRoute({ section: "team", editingId: "new", sitePanel: "identity" })).toBe("#/persone/nuovo");
    expect(formatRoute({ section: "site", editingId: "site", sitePanel: "seo" })).toBe("#/sito/seo");
  });

  it("regge il giro completo", () => {
    const routes: Route[] = [
      homeRoute,
      { section: "projects", editingId: "id con spazio", sitePanel: "identity" },
      { section: "team", editingId: "new", sitePanel: "identity" },
      { section: "site", editingId: "site", sitePanel: "home" },
    ];
    for (const route of routes) expect(roundTrip(route)).toEqual(route);
  });

  it("confronta le rotte ignorando i dettagli che non finiscono nell'indirizzo", () => {
    expect(sameRoute({ section: "projects", editingId: null, sitePanel: "identity" }, { section: "projects", editingId: null, sitePanel: "seo" })).toBe(true);
    expect(sameRoute(homeRoute, { section: "team", editingId: null, sitePanel: "identity" })).toBe(false);
  });
});
