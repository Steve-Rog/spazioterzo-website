import { describe, expect, it } from "vitest";
import { asRichText, contentLimits, publicationReadinessError, validateProject, validateSiteSettings, validateTeamMember } from "./content-schema";
import { defaultSiteSettings } from "./default-site-settings";

describe("content schema", () => {
  it("accepts a complete project payload", () => {
    expect(validateProject({ slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso", dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: asRichText("Intro"), objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] })).toBe(true);
  });

  it("rejects incomplete public content", () => {
    expect(validateProject({ title: "Manca lo slug" })).toBe(false);
    expect(validateTeamMember({ name: "Nome", role: "Ruolo" })).toBe(false);
    expect(validateSiteSettings({ identity: { organizationName: "Spazio" } })).toBe(false);
  });

  it("rejects unsafe links, invalid video IDs and images without alt text", () => {
    const base = { slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso" as const, dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: asRichText("Intro"), objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] };
    expect(validateProject({ ...base, links: [{ label: "Malevolo", href: "javascript:alert(1)", kind: "website" }] })).toBe(false);
    expect(validateProject({ ...base, video: { provider: "youtube", id: "<script>", alt: "Video" } })).toBe(false);
    expect(validateProject({ ...base, blocks: [{ id: "image-1", type: "image", src: "/image.jpg", alt: "" }] })).toBe(false);
  });

  it("accepts local media URLs in development, but not other plain http hosts", () => {
    const base = { slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso" as const, dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: asRichText("Intro"), objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] };
    expect(validateProject({ ...base, cover: "http://localhost:8787/media/2026-08/foto.png" })).toBe(true);
    expect(validateProject({ ...base, cover: "http://127.0.0.1:8787/media/2026-08/foto.png" })).toBe(true);
    expect(validateProject({ ...base, cover: "https://media.spazioterzo.org/foto.png" })).toBe(true);
    expect(validateProject({ ...base, cover: "http://esempio.org/foto.png" })).toBe(false);
    expect(validateProject({ ...base, cover: "http://localhost.attaccante.org/foto.png" })).toBe(false);
  });

  it("rejects unapproved rich text marks", () => {
    expect(validateProject({ slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso", dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: [{ text: "Intro", marks: ["script"] }], objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] })).toBe(false);
  });

  it("rejects copy that exceeds the editorial limits", () => {
    const base = { slug: "progetto", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "In corso" as const, dateRange: "2026", location: "Catania", audience: "Persone", themes: ["Cura"], cover: "/cover.jpg", coverAlt: "Copertina", intro: asRichText("Intro"), objective: asRichText("Obiettivo"), blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] };
    expect(validateProject({ ...base, title: "a".repeat(contentLimits.project.title) })).toBe(true);
    expect(validateProject({ ...base, title: "a".repeat(contentLimits.project.title + 1) })).toBe(false);
    expect(validateProject({ ...base, intro: asRichText("a".repeat(contentLimits.project.intro + 1)) })).toBe(false);
    expect(validateProject({ ...base, blocks: [{ id: "quote-1", type: "quote", text: asRichText("a".repeat(contentLimits.project.quote + 1)) }] })).toBe(false);
  });

  it("allows incomplete Home content in draft but blocks its publication", () => {
    const draft = JSON.parse(JSON.stringify(defaultSiteSettings));
    draft.home.activities.items = [];
    draft.home.origin.statement = asRichText("");
    expect(validateSiteSettings(draft)).toBe(true);
    expect(publicationReadinessError("site", draft)).toContain("Attività — almeno un’attività");
    expect(publicationReadinessError("site", draft)).toContain("Perché Spazio Terzo — testo sinistro");
    expect(publicationReadinessError("site", defaultSiteSettings)).toBeNull();
  });
});
