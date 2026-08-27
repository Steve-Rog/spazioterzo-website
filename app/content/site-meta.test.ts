import { describe, expect, it } from "vitest";
import { pageMeta, siteDescription, withSiteSuffix } from "./site-meta";
import { defaultSiteSettings } from "../../shared/default-site-settings";

describe("site metadata", () => {
  it("uses the published suffix consistently", () => {
    expect(withSiteSuffix("Progetti", defaultSiteSettings)).toBe("Progetti — Spazio Terzo");
    expect(siteDescription(defaultSiteSettings, "Fallback")).toBe(defaultSiteSettings.seo.defaultDescription);
  });

  it("keeps search and social metadata aligned", () => {
    const meta = pageMeta({ title: "Titolo", description: "Descrizione", image: "https://media.spazioterzo.org/share.jpg" });
    expect(meta).toEqual(expect.arrayContaining([
      { title: "Titolo" },
      { name: "description", content: "Descrizione" },
      { property: "og:title", content: "Titolo" },
      { property: "og:description", content: "Descrizione" },
      { property: "og:image", content: "https://media.spazioterzo.org/share.jpg" },
    ]));
  });
});
