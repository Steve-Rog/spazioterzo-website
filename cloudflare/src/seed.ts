import { teamMembers } from "../../app/components/people/content";
import { projects } from "../../app/components/projects/content";
import { asRichText, type EntityType, type ProjectContent, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../shared/default-site-settings";

type Seed = { id: string; type: EntityType; slug: string; displayOrder: number; payload: ProjectContent | TeamMemberContent | SiteSettingsContent };

const site: SiteSettingsContent = defaultSiteSettings;

export const initialContent: Seed[] = [
  ...projects.map((project, index): Seed => ({
    id: `seed-project-${project.slug}`, type: "project", slug: project.slug, displayOrder: index,
    payload: {
      slug: project.slug, title: project.title, subtitle: project.subtitle, statusLabel: project.status, dateRange: project.dateRange, location: project.location, audience: project.audience, themes: project.themes, cover: project.cover, coverAlt: project.coverAlt, intro: asRichText(project.intro), objective: asRichText(project.objective),
      blocks: project.blocks.map((block, blockIndex) => block.type === "paragraph" ? { id: `block-${blockIndex}`, type: "paragraph" as const, text: asRichText(block.text) } : block.type === "quote" ? { id: `block-${blockIndex}`, type: "quote" as const, text: asRichText(block.text), source: block.source } : block.type === "list" ? { id: `block-${blockIndex}`, type: "list" as const, title: block.title, items: block.items } : block.type === "image" ? { id: `block-${blockIndex}`, type: "image" as const, src: block.src, alt: block.alt, caption: block.caption } : { id: `block-${blockIndex}`, type: "stat" as const, value: block.value, label: block.label }),
      outcomes: project.outcomes, links: project.links ?? [], video: project.video, cta: project.cta, partners: project.partners ?? [], funders: project.funders ?? [], visibilityNote: project.visibilityNote, relatedSlugs: project.relatedSlugs,
    },
  })),
  ...teamMembers.map((member, index): Seed => ({ id: `seed-team-${index + 1}`, type: "team_member", slug: `team-${index + 1}`, displayOrder: index, payload: { name: member.name, role: member.role, image: member.image, imagePosition: member.imagePosition, bio: member.bio.map(asRichText), quote: asRichText(member.quote), quoteAuthor: member.quoteAuthor } })),
  { id: "seed-site", type: "site", slug: "site", displayOrder: 0, payload: site },
];

export async function seedDevelopmentDatabase(env: Env) {
  const statements: D1PreparedStatement[] = [
    env.DB.prepare("INSERT OR IGNORE INTO admin_users (email, role) VALUES (?, 'admin')").bind("editor@spazioterzo.test"),
  ];
  for (const item of initialContent) {
    const revisionId = `${item.id}-revision-1`;
    statements.push(
      env.DB.prepare("INSERT OR IGNORE INTO content_entities (id, entity_type, slug, display_order, state, draft_revision_id, published_revision_id) VALUES (?, ?, ?, ?, 'published', ?, ?)").bind(item.id, item.type, item.slug, item.displayOrder, revisionId, revisionId),
      env.DB.prepare("INSERT OR IGNORE INTO content_revisions (id, entity_id, revision_number, payload, created_by) VALUES (?, ?, 1, ?, 'seed@spazioterzo.local')").bind(revisionId, item.id, JSON.stringify(item.payload)),
    );
  }
  await env.DB.batch(statements);
  return { entities: initialContent.length };
}
