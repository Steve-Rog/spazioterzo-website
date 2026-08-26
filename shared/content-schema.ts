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
  slug: string;
  title: string;
  subtitle: string;
  statusLabel: "In corso" | "Concluso";
  dateRange: string;
  location: string;
  audience: string;
  themes: string[];
  coverAssetId?: string;
  cover: string;
  coverAlt: string;
  intro: RichText;
  objective: RichText;
  blocks: ProjectBlock[];
  outcomes: string[];
  links: ProjectLink[];
  video?: ProjectVideo;
  cta?: { label: string; href: string };
  partners: string[];
  funders: string[];
  visibilityNote?: string;
  relatedSlugs: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type TeamMemberContent = {
  name: string;
  role: string;
  imageAssetId?: string;
  image: string;
  imagePosition?: string;
  bio: RichText[];
  quote: RichText;
  quoteAuthor?: string;
};

export type Activity = { id: string; title: string; description: RichText };
export type SiteSettingsContent = {
  identity: {
    organizationName: string;
    legalForm: string;
    city: string;
    address?: string;
    country: string;
    email: string;
    phone?: string;
    logoLight?: string;
    logoDark?: string;
    favicon?: string;
    socialLinks: Array<{ label: string; href: string }>;
  };
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
export type ContentEntity<T = ProjectContent | TeamMemberContent | SiteSettingsContent> = {
  id: string;
  type: EntityType;
  slug: string;
  displayOrder: number;
  state: ContentState;
  draft: T | null;
  published: T | null;
  updatedAt: string;
};

export const plainText = (value: RichText | undefined) => (value ?? []).map((span) => span.text).join("");
export const asRichText = (text: string): RichText => [{ text }];

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isRichText = (value: unknown): value is RichText =>
  Array.isArray(value) && value.every((span) => isRecord(span) && typeof span.text === "string" && (!span.marks || Array.isArray(span.marks)));

export function validateProject(value: unknown): value is ProjectContent {
  if (!isRecord(value)) return false;
  return ["slug", "title", "subtitle", "dateRange", "location", "audience", "cover", "coverAlt"].every((key) => typeof value[key] === "string")
    && (value.statusLabel === "In corso" || value.statusLabel === "Concluso")
    && Array.isArray(value.themes)
    && isRichText(value.intro)
    && isRichText(value.objective)
    && Array.isArray(value.blocks)
    && Array.isArray(value.outcomes)
    && Array.isArray(value.links)
    && Array.isArray(value.partners)
    && Array.isArray(value.funders)
    && Array.isArray(value.relatedSlugs);
}

export function validateTeamMember(value: unknown): value is TeamMemberContent {
  return isRecord(value)
    && typeof value.name === "string"
    && typeof value.role === "string"
    && typeof value.image === "string"
    && Array.isArray(value.bio)
    && value.bio.every(isRichText)
    && isRichText(value.quote);
}

export function validateSiteSettings(value: unknown): value is SiteSettingsContent {
  return isRecord(value) && isRecord(value.identity) && isRecord(value.seo) && isRecord(value.home)
    && typeof value.identity.organizationName === "string"
    && typeof value.identity.email === "string";
}

export function validateContent(type: EntityType, value: unknown): boolean {
  if (type === "project") return validateProject(value);
  if (type === "team_member") return validateTeamMember(value);
  return validateSiteSettings(value);
}
