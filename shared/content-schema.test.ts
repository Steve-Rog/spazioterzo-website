import { describe, expect, it } from "vitest";
import { asRichText, validateProject, validateSiteSettings, validateTeamMember } from "./content-schema";

describe("content schema", () => {
  it("accepts a complete project payload", () => {
    expect(validateProject({ slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso", dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: asRichText("Intro"), objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] })).toBe(true);
  });

  it("rejects incomplete public content", () => {
    expect(validateProject({ title: "Manca lo slug" })).toBe(false);
    expect(validateTeamMember({ name: "Nome", role: "Ruolo" })).toBe(false);
    expect(validateSiteSettings({ identity: { organizationName: "Spazio" } })).toBe(false);
  });
});
