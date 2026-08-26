export const MAX_TEAM_MEMBERS = 3;
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const contentLimits = {
  project: { slug: 80, title: 72, subtitle: 180, dateRange: 80, location: 90, audience: 240, theme: 48, coverAlt: 180, intro: 420, objective: 600, paragraph: 1_200, quote: 320, quoteSource: 100, listTitle: 80, listItem: 220, imageAlt: 180, imageCaption: 180, statValue: 48, statLabel: 160, outcome: 240, linkLabel: 90, videoAlt: 180, videoCaption: 180, ctaLabel: 64, partner: 90, visibilityNote: 360, seoTitle: 70, seoDescription: 160 },
  team: { name: 72, role: 110, bioParagraph: 1_200, quote: 320, quoteAuthor: 80 },
  site: { organizationName: 80, legalForm: 110, city: 80, address: 180, country: 80, phone: 60, socialLabel: 40, titleSuffix: 70, description: 160, heroHeadline: 150, heroMeta: 80, ctaLabel: 64, associationHeading: 170, associationBody: 700, originEyebrow: 80, originPrelude: 220, originHeading: 180, originStatement: 700, originIdentity: 420, activitiesHeading: 160, activityTitle: 90, activityDescription: 320, territoryHeading: 170, territoryBody: 420, imageCaption: 180, verticalWord: 40, contactHeading: 150, contactBody: 320, emailLabel: 100 },
} as const;

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

export type ImageCrop = { x: number; y: number; width: number; height: number };
export type TeamMemberContent = { name: string; role: string; imageAssetId?: string; image: string; imagePosition?: string; imageCrop?: ImageCrop; bio: RichText[]; quote: RichText; quoteAuthor?: string };
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
  // In sviluppo i media stanno sul worker locale (http://localhost:8787/media/…): senza questa eccezione le immagini caricate non si possono salvare.
  return href.startsWith("/") || /^https:\/\//i.test(href) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(href);
};
const safeEmail = (value: unknown) => typeof value === "string" && string(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const safeId = (value: unknown) => typeof value === "string" && string(value, 128) && /^[A-Za-z0-9_-]+$/.test(value);
const allowedMarks = new Set<RichTextMark>(["italic", "highlight", "link"]);

export function validateRichText(value: unknown, maxCharacters = MAX_LONG): value is RichText {
  return Array.isArray(value) && value.length <= 100 && value.every((span) => {
    if (!isRecord(span) || !string(span.text, MAX_LONG, true)) return false;
    if (span.marks !== undefined && (!Array.isArray(span.marks) || span.marks.some((mark) => typeof mark !== "string" || !allowedMarks.has(mark as RichTextMark)) || new Set(span.marks).size !== span.marks.length)) return false;
    const isLink = Array.isArray(span.marks) && span.marks.includes("link");
    return isLink ? safeUrl(span.href) : span.href === undefined;
  }) && value.reduce((total, span) => total + (typeof span?.text === "string" ? span.text.length : 0), 0) <= maxCharacters;
}

function validateBlock(value: unknown): value is ProjectBlock {
  if (!isRecord(value) || !safeId(value.id) || typeof value.type !== "string") return false;
  if (value.type === "paragraph") return validateRichText(value.text, contentLimits.project.paragraph);
  if (value.type === "quote") return validateRichText(value.text, contentLimits.project.quote) && optionalString(value.source, contentLimits.project.quoteSource);
  if (value.type === "list") return string(value.title, contentLimits.project.listTitle) && strings(value.items, 30, contentLimits.project.listItem);
  if (value.type === "image") return (value.assetId === undefined || safeId(value.assetId)) && (value.src === undefined || safeImageUrl(value.src)) && (value.src !== undefined || value.assetId !== undefined) && string(value.alt, contentLimits.project.imageAlt) && optionalString(value.caption, contentLimits.project.imageCaption);
  if (value.type === "stat") return string(value.value, contentLimits.project.statValue) && string(value.label, contentLimits.project.statLabel);
  return false;
}

export function validateProject(value: unknown): value is ProjectContent {
  if (!isRecord(value)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value.slug)) && string(value.slug, contentLimits.project.slug)
    && string(value.title, contentLimits.project.title) && string(value.subtitle, contentLimits.project.subtitle) && (value.statusLabel === "In corso" || value.statusLabel === "Concluso")
    && string(value.dateRange, contentLimits.project.dateRange) && string(value.location, contentLimits.project.location) && string(value.audience, contentLimits.project.audience) && strings(value.themes, 20, contentLimits.project.theme)
    && (value.coverAssetId === undefined || safeId(value.coverAssetId)) && safeImageUrl(value.cover) && string(value.coverAlt, contentLimits.project.coverAlt)
    && validateRichText(value.intro, contentLimits.project.intro) && validateRichText(value.objective, contentLimits.project.objective) && Array.isArray(value.blocks) && value.blocks.length <= 50 && value.blocks.every(validateBlock)
    && strings(value.outcomes, 30, contentLimits.project.outcome) && Array.isArray(value.links) && value.links.length <= 20 && value.links.every((link) => isRecord(link) && string(link.label, contentLimits.project.linkLabel) && safeUrl(link.href) && ["instagram", "facebook", "website", "materials"].includes(String(link.kind)))
    && (value.video === undefined || validateVideo(value.video))
    && (value.cta === undefined || (isRecord(value.cta) && string(value.cta.label, contentLimits.project.ctaLabel) && safeUrl(value.cta.href)))
    && strings(value.partners, 30, contentLimits.project.partner) && strings(value.funders, 30, contentLimits.project.partner) && optionalString(value.visibilityNote, contentLimits.project.visibilityNote) && strings(value.relatedSlugs, 20, contentLimits.project.slug)
    && optionalString(value.seoTitle, contentLimits.project.seoTitle) && optionalString(value.seoDescription, contentLimits.project.seoDescription);
}

function validateVideo(value: unknown): value is ProjectVideo {
  if (!isRecord(value) || (value.provider !== "youtube" && value.provider !== "vimeo") || typeof value.id !== "string" || !string(value.id, 64) || !string(value.alt, contentLimits.project.videoAlt)) return false;
  const validId = value.provider === "youtube" ? /^[A-Za-z0-9_-]{6,64}$/.test(value.id) : /^\d{1,20}$/.test(value.id);
  return validId && optionalString(value.caption, contentLimits.project.videoCaption) && (value.thumbnail === undefined || safeImageUrl(value.thumbnail));
}

function validateImageCrop(value: unknown): value is ImageCrop {
  return isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x) && value.x >= 0 && value.x <= 100
    && typeof value.y === "number" && Number.isFinite(value.y) && value.y >= 0 && value.y <= 100
    && typeof value.width === "number" && Number.isFinite(value.width) && value.width > 0 && value.width <= 100
    && typeof value.height === "number" && Number.isFinite(value.height) && value.height > 0 && value.height <= 100
    && value.x + value.width <= 100.001 && value.y + value.height <= 100.001;
}

export function validateTeamMember(value: unknown): value is TeamMemberContent {
  return isRecord(value) && string(value.name, contentLimits.team.name) && string(value.role, contentLimits.team.role) && (value.imageAssetId === undefined || safeId(value.imageAssetId)) && safeImageUrl(value.image)
    && optionalString(value.imagePosition, 120) && (value.imageCrop === undefined || validateImageCrop(value.imageCrop)) && Array.isArray(value.bio) && value.bio.length <= 12 && value.bio.every((paragraph) => validateRichText(paragraph, contentLimits.team.bioParagraph))
    && validateRichText(value.quote, contentLimits.team.quote) && optionalString(value.quoteAuthor, contentLimits.team.quoteAuthor);
}

export function validateSiteSettings(value: unknown): value is SiteSettingsContent {
  if (!isRecord(value) || !isRecord(value.identity) || !isRecord(value.seo) || !isRecord(value.home)) return false;
  const { identity, seo, home } = value;
  const validIdentity = string(identity.organizationName, contentLimits.site.organizationName) && string(identity.legalForm, contentLimits.site.legalForm) && string(identity.city, contentLimits.site.city) && optionalString(identity.address, contentLimits.site.address) && string(identity.country, contentLimits.site.country) && safeEmail(identity.email) && optionalString(identity.phone, contentLimits.site.phone)
    && [identity.logoLight, identity.logoDark, identity.favicon].every((url) => url === undefined || safeImageUrl(url)) && Array.isArray(identity.socialLinks) && identity.socialLinks.length <= 12 && identity.socialLinks.every((link) => isRecord(link) && string(link.label, contentLimits.site.socialLabel) && safeUrl(link.href));
  const validSeo = string(seo.titleSuffix, contentLimits.site.titleSuffix) && string(seo.defaultDescription, contentLimits.site.description) && (seo.shareImage === undefined || safeImageUrl(seo.shareImage));
  const validHome = isRecord(home.hero) && validateRichText(home.hero.headline, contentLimits.site.heroHeadline) && string(home.hero.meta, contentLimits.site.heroMeta) && string(home.hero.ctaLabel, contentLimits.site.ctaLabel) && (home.hero.heroImage === undefined || safeImageUrl(home.hero.heroImage))
    && isRecord(home.association) && validateRichText(home.association.heading, contentLimits.site.associationHeading) && validateRichText(home.association.body, contentLimits.site.associationBody) && string(home.association.ctaLabel, contentLimits.site.ctaLabel) && safeUrl(home.association.ctaHref)
    && isRecord(home.origin) && string(home.origin.eyebrow, contentLimits.site.originEyebrow) && validateRichText(home.origin.prelude, contentLimits.site.originPrelude) && validateRichText(home.origin.heading, contentLimits.site.originHeading) && validateRichText(home.origin.statement, contentLimits.site.originStatement) && validateRichText(home.origin.identity, contentLimits.site.originIdentity)
    && isRecord(home.activities) && validateRichText(home.activities.heading, contentLimits.site.activitiesHeading) && Array.isArray(home.activities.items) && home.activities.items.length <= 12 && home.activities.items.every((item) => isRecord(item) && safeId(item.id) && string(item.title, contentLimits.site.activityTitle) && validateRichText(item.description, contentLimits.site.activityDescription))
    && isRecord(home.territory) && validateRichText(home.territory.heading, contentLimits.site.territoryHeading) && validateRichText(home.territory.body, contentLimits.site.territoryBody) && string(home.territory.ctaLabel, contentLimits.site.ctaLabel) && safeUrl(home.territory.ctaHref)
    && isRecord(home.imageStatement) && (home.imageStatement.image === undefined || safeImageUrl(home.imageStatement.image)) && string(home.imageStatement.caption, contentLimits.site.imageCaption) && string(home.imageStatement.verticalWord, contentLimits.site.verticalWord)
    && isRecord(home.contact) && validateRichText(home.contact.heading, contentLimits.site.contactHeading) && validateRichText(home.contact.body, contentLimits.site.contactBody) && optionalString(home.contact.emailLabel, contentLimits.site.emailLabel);
  return validIdentity && validSeo && validHome;
}

export function validateContent(type: EntityType, value: unknown): boolean {
  return type === "project" ? validateProject(value) : type === "team_member" ? validateTeamMember(value) : validateSiteSettings(value);
}

export function contentValidationError(type: EntityType, value: unknown): string | null {
  return validateContent(type, value) ? null : `Contenuto ${type === "project" ? "progetto" : type === "team_member" ? "persona" : "sito"} non valido: controlla campi obbligatori, URL, media e formattazione.`;
}
