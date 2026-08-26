export const MAX_TEAM_MEMBERS = 3;
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type RichTextMark = "italic" | "highlight" | "link";
export type RichTextSpan = { text: string; marks?: RichTextMark[]; href?: string };
export type RichText = RichTextSpan[];

export type ProjectBlock =
  | { id: string; type: "paragraph"; text: RichText }
  | { id: string; type: "quote"; text: RichText; source?: string }
  | { id: string; type: "list"; title: string; items: string[] }
  | { id: string; type: "image"; assetId?: string; src?: string; alt: string; caption?: string }
  | { id: string; type: "stat"; value: string; label: string };

export type ProjectLinkKind = "instagram" | "facebook" | "website" | "materials";
export type ProjectLink = { label: string; href: string; kind: ProjectLinkKind };
export type ProjectVideo = { provider: "youtube" | "vimeo"; id: string; thumbnail?: string; alt: string; caption?: string };

export type ProjectContent = {
  slug: string; title: string; subtitle: string; statusLabel: "In corso" | "Concluso"; dateRange: string; location: string; audience: string; themes: string[];
  coverAssetId?: string; cover: string; coverAlt: string; intro: RichText; objective: RichText; blocks: ProjectBlock[]; outcomes: string[]; links: ProjectLink[];
  video?: ProjectVideo; cta?: { label: string; href: string }; partners: string[]; funders: string[]; visibilityNote?: string; relatedSlugs: string[]; seoTitle?: string; seoDescription?: string;
};

export type TeamMemberContent = { name: string; role: string; imageAssetId?: string; image: string; imagePosition?: string; bio: RichText[]; quote: RichText; quoteAuthor?: string };
export type Activity = { id: string; title: string; description: RichText };
export type SiteSettingsContent = {
  identity: { organizationName: string; legalForm: string; city: string; address?: string; country: string; email: string; phone?: string; logoLight?: string; logoDark?: string; favicon?: string; socialLinks: Array<{ label: string; href: string }> };
  seo: { titleSuffix: string; defaultDescription: string; shareImage?: string };
  home: {
    hero: { headline: RichText; meta: string; ctaLabel: string; heroImage?: string };
    association: { heading: RichText; body: RichText; ctaLabel: string; ctaHref: string };
    origin: { eyebrow: string; prelude: RichText; heading: RichText; statement: RichText; identity: RichText };
    activities: { heading: RichText; items: Activity[] };
    territory: { heading: RichText; body: RichText; ctaLabel: string; ctaHref: string };
    imageStatement: { image?: string; caption: string; verticalWord: string };
    contact: { heading: RichText; body: RichText; emailLabel?: string };
  };
};

export type EntityType = "project" | "team_member" | "site";
export type ContentState = "draft" | "published" | "archived";
export type ContentEntity<T = ProjectContent | TeamMemberContent | SiteSettingsContent> = { id: string; type: EntityType; slug: string; displayOrder: number; state: ContentState; draft: T | null; published: T | null; updatedAt: string };
export type ContentValidation = { valid: true } | { valid: false; error: string };

export const plainText = (value: RichText | undefined) => (value ?? []).map((span) => span.text).join("");
export const asRichText = (text: string): RichText => [{ text }];

const MAX_SHORT = 280;
const MAX_LONG = 5_000;
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown, max = MAX_SHORT, allowEmpty = false) => typeof value === "string" && value.length <= max && (allowEmpty || value.trim().length > 0);
const strings = (value: unknown, maxItems = 30, maxLength = MAX_SHORT) => Array.isArray(value) && value.length <= maxItems && value.every((item) => string(item, maxLength));
const optionalString = (value: unknown, max = MAX_LONG) => value === undefined || string(value, max, true);
const safeUrl = (value: unknown) => {
  if (typeof value !== "string" || !string(value, 2_000)) return false;
  const href = value.trim();
  return href.startsWith("/") || href.startsWith("#") || /^(https?:|mailto:)/i.test(href);
};
const safeImageUrl = (value: unknown) => {
  if (typeof value !== "string" || !string(value, 2_000)) return false;
  const href = value.trim();
  return href.startsWith("/") || /^https:\/\//i.test(href);
};
const safeEmail = (value: unknown) => typeof value === "string" && string(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const safeId = (value: unknown) => typeof value === "string" && string(value, 128) && /^[A-Za-z0-9_-]+$/.test(value);
const allowedMarks = new Set<RichTextMark>(["italic", "highlight", "link"]);

export function validateRichText(value: unknown): value is RichText {
  return Array.isArray(value) && value.length <= 100 && value.every((span) => {
    if (!isRecord(span) || !string(span.text, MAX_LONG, true)) return false;
    if (span.marks !== undefined && (!Array.isArray(span.marks) || span.marks.some((mark) => typeof mark !== "string" || !allowedMarks.has(mark as RichTextMark)) || new Set(span.marks).size !== span.marks.length)) return false;
    const isLink = Array.isArray(span.marks) && span.marks.includes("link");
    return isLink ? safeUrl(span.href) : span.href === undefined;
  });
}

function validateBlock(value: unknown): value is ProjectBlock {
  if (!isRecord(value) || !safeId(value.id) || typeof value.type !== "string") return false;
  if (value.type === "paragraph") return validateRichText(value.text);
  if (value.type === "quote") return validateRichText(value.text) && optionalString(value.source, MAX_SHORT);
  if (value.type === "list") return string(value.title) && strings(value.items, 30, MAX_LONG);
  if (value.type === "image") return (value.assetId === undefined || safeId(value.assetId)) && (value.src === undefined || safeImageUrl(value.src)) && (value.src !== undefined || value.assetId !== undefined) && string(value.alt) && optionalString(value.caption, MAX_SHORT);
  if (value.type === "stat") return string(value.value) && string(value.label);
  return false;
}

export function validateProject(value: unknown): value is ProjectContent {
  if (!isRecord(value)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value.slug))
    && string(value.title) && string(value.subtitle, MAX_LONG) && (value.statusLabel === "In corso" || value.statusLabel === "Concluso")
    && string(value.dateRange) && string(value.location) && string(value.audience, MAX_LONG) && strings(value.themes, 20)
    && (value.coverAssetId === undefined || safeId(value.coverAssetId)) && safeImageUrl(value.cover) && string(value.coverAlt)
    && validateRichText(value.intro) && validateRichText(value.objective) && Array.isArray(value.blocks) && value.blocks.length <= 50 && value.blocks.every(validateBlock)
    && strings(value.outcomes, 30, MAX_LONG) && Array.isArray(value.links) && value.links.length <= 20 && value.links.every((link) => isRecord(link) && string(link.label) && safeUrl(link.href) && ["instagram", "facebook", "website", "materials"].includes(String(link.kind)))
    && (value.video === undefined || validateVideo(value.video))
    && (value.cta === undefined || (isRecord(value.cta) && string(value.cta.label) && safeUrl(value.cta.href)))
    && strings(value.partners, 30) && strings(value.funders, 30) && optionalString(value.visibilityNote, MAX_LONG) && strings(value.relatedSlugs, 20)
    && optionalString(value.seoTitle, 70) && optionalString(value.seoDescription, 160);
}

function validateVideo(value: unknown): value is ProjectVideo {
  if (!isRecord(value) || (value.provider !== "youtube" && value.provider !== "vimeo") || typeof value.id !== "string" || !string(value.id, 64) || !string(value.alt)) return false;
  const validId = value.provider === "youtube" ? /^[A-Za-z0-9_-]{6,64}$/.test(value.id) : /^\d{1,20}$/.test(value.id);
  return validId && optionalString(value.caption, MAX_SHORT) && (value.thumbnail === undefined || safeImageUrl(value.thumbnail));
}

export function validateTeamMember(value: unknown): value is TeamMemberContent {
  return isRecord(value) && string(value.name) && string(value.role) && (value.imageAssetId === undefined || safeId(value.imageAssetId)) && safeImageUrl(value.image)
    && optionalString(value.imagePosition, 120) && Array.isArray(value.bio) && value.bio.length <= 12 && value.bio.every(validateRichText)
    && validateRichText(value.quote) && optionalString(value.quoteAuthor);
}

export function validateSiteSettings(value: unknown): value is SiteSettingsContent {
  if (!isRecord(value) || !isRecord(value.identity) || !isRecord(value.seo) || !isRecord(value.home)) return false;
  const { identity, seo, home } = value;
  const validIdentity = string(identity.organizationName) && string(identity.legalForm) && string(identity.city) && optionalString(identity.address) && string(identity.country) && safeEmail(identity.email) && optionalString(identity.phone, 60)
    && [identity.logoLight, identity.logoDark, identity.favicon].every((url) => url === undefined || safeImageUrl(url)) && Array.isArray(identity.socialLinks) && identity.socialLinks.length <= 12 && identity.socialLinks.every((link) => isRecord(link) && string(link.label) && safeUrl(link.href));
  const validSeo = string(seo.titleSuffix, 70) && string(seo.defaultDescription, 160) && (seo.shareImage === undefined || safeImageUrl(seo.shareImage));
  const validHome = isRecord(home.hero) && validateRichText(home.hero.headline) && string(home.hero.meta) && string(home.hero.ctaLabel) && (home.hero.heroImage === undefined || safeImageUrl(home.hero.heroImage))
    && isRecord(home.association) && validateRichText(home.association.heading) && validateRichText(home.association.body) && string(home.association.ctaLabel) && safeUrl(home.association.ctaHref)
    && isRecord(home.origin) && string(home.origin.eyebrow) && validateRichText(home.origin.prelude) && validateRichText(home.origin.heading) && validateRichText(home.origin.statement) && validateRichText(home.origin.identity)
    && isRecord(home.activities) && validateRichText(home.activities.heading) && Array.isArray(home.activities.items) && home.activities.items.length <= 12 && home.activities.items.every((item) => isRecord(item) && safeId(item.id) && string(item.title) && validateRichText(item.description))
    && isRecord(home.territory) && validateRichText(home.territory.heading) && validateRichText(home.territory.body) && string(home.territory.ctaLabel) && safeUrl(home.territory.ctaHref)
    && isRecord(home.imageStatement) && (home.imageStatement.image === undefined || safeImageUrl(home.imageStatement.image)) && string(home.imageStatement.caption) && string(home.imageStatement.verticalWord, 40)
    && isRecord(home.contact) && validateRichText(home.contact.heading) && validateRichText(home.contact.body) && optionalString(home.contact.emailLabel);
  return validIdentity && validSeo && validHome;
}

export function validateContent(type: EntityType, value: unknown): boolean {
  return type === "project" ? validateProject(value) : type === "team_member" ? validateTeamMember(value) : validateSiteSettings(value);
}

export function contentValidationError(type: EntityType, value: unknown): string | null {
  return validateContent(type, value) ? null : `Contenuto ${type === "project" ? "progetto" : type === "team_member" ? "persona" : "sito"} non valido: controlla campi obbligatori, URL, media e formattazione.`;
}
