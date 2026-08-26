import { useEffect, useMemo, useState } from "react";
import { asRichText, plainText, type ContentEntity, type ProjectBlock, type ProjectContent, type RichText, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../app/content/public-api";
import { adminApi } from "./api";

type Section = "projects" | "team" | "site";
type User = { email: string; role: "admin" | "editor" };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const blankProject = (): ProjectContent => ({ slug: "", title: "", subtitle: "", statusLabel: "In corso", dateRange: "", location: "", audience: "", themes: [], cover: "", coverAlt: "", intro: [], objective: [], blocks: [], outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] });
const blankTeamMember = (): TeamMemberContent => ({ name: "", role: "", image: "", bio: [], quote: [] });

function saveLocalEmail(email: string) { window.localStorage.setItem("spazioterzo-dev-email", email.trim().toLowerCase()); window.location.reload(); }

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("projects");
  const [projects, setProjects] = useState<ContentEntity<ProjectContent>[]>([]);
  const [team, setTeam] = useState<ContentEntity<TeamMemberContent>[]>([]);
  const [site, setSite] = useState<ContentEntity<SiteSettingsContent> | null>(null);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [identity, listedProjects, listedTeam, listedSite] = await Promise.all([
        adminApi.me(), adminApi.list<ProjectContent>("projects"), adminApi.list<TeamMemberContent>("team"), adminApi.list<SiteSettingsContent>("site"),
      ]);
      setUser(identity); setProjects(listedProjects); setTeam(listedTeam); setSite(listedSite[0] ?? null); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Accesso non disponibile"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reload(); }, []);
  useEffect(() => { setSelectedId(section === "site" ? site?.id ?? "new" : "new"); }, [section, site?.id]);

  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 3600); };
  const selected = useMemo(() => section === "projects" ? projects.find((item) => item.id === selectedId) : section === "team" ? team.find((item) => item.id === selectedId) : site, [section, projects, team, site, selectedId]);

  if (loading) return <main className="admin-loading">Caricamento back office…</main>;
  if (!user) return <AccessGate message={message} onSubmit={saveLocalEmail} />;

  const publish = async () => {
    if (!selected || user.role !== "admin") return;
    const resource = section === "projects" ? "projects" : section === "team" ? "team" : "site";
    try { await adminApi.publish(resource, selected.id); await reload(); notify("Contenuto pubblicato sul sito."); }
    catch (error) { notify(error instanceof Error ? error.message : "Pubblicazione non riuscita"); }
  };

  return <main className="admin-shell">
    <aside className="admin-nav">
      <a className="admin-brand" href="/#top"><span>SPAZIO</span><b>TERZO</b><i>Back office</i></a>
      <nav aria-label="Gestione contenuti">
        <NavButton active={section === "projects"} onClick={() => setSection("projects")}>Progetti <small>{projects.length}</small></NavButton>
        <NavButton active={section === "team"} onClick={() => setSection("team")}>Persone <small>{team.length}/3</small></NavButton>
        <NavButton active={section === "site"} onClick={() => setSection("site")}>Associazione e Home</NavButton>
      </nav>
      <div className="admin-user"><span>{user.email}</span><b>{user.role === "admin" ? "Amministratore" : "Editor"}</b></div>
    </aside>
    <section className="admin-workspace">
      <header className="workspace-header">
        <div><p className="eyebrow">{section === "projects" ? "Archivio" : section === "team" ? "Persone" : "Impostazioni"}</p><h1>{section === "projects" ? "Progetti" : section === "team" ? "Il team" : "Associazione e Home"}</h1></div>
        {selected && <div className="publish-status"><span className={`state state-${selected.state}`}>{selected.state === "published" ? "Pubblicato" : selected.state === "archived" ? "Archiviato" : "Bozza"}</span>{user.role === "admin" && <button className="publish" onClick={() => void publish()}>Pubblica</button>}</div>}
      </header>
      {message && <p className="admin-message" role="status">{message}</p>}
      <div className="workspace-grid">
        {section !== "site" && <ContentList section={section} items={section === "projects" ? projects : team} selectedId={selectedId} onSelect={setSelectedId} onNew={() => setSelectedId("new")} />}
        <article className="editor-pane">
          {section === "projects" && <ProjectEditor key={selected?.id ?? "new"} entity={selected as ContentEntity<ProjectContent> | undefined} onSaved={async () => { await reload(); notify("Bozza salvata."); }} />}
          {section === "team" && <TeamEditor key={selected?.id ?? "new"} entity={selected as ContentEntity<TeamMemberContent> | undefined} teamCount={team.length} onSaved={async () => { await reload(); notify("Bozza salvata."); }} />}
          {section === "site" && <SiteEditor key={site?.id ?? "new"} entity={site ?? undefined} onSaved={async () => { await reload(); notify("Bozza salvata."); }} />}
        </article>
      </div>
    </section>
  </main>;
}

function AccessGate({ message, onSubmit }: { message: string; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("editor@spazioterzo.test");
  return <main className="access-gate"><div><p className="eyebrow">Spazio Terzo</p><h1>Area riservata</h1><p>In produzione Cloudflare Access invia un codice monouso all’email autorizzata.</p><form onSubmit={(event) => { event.preventDefault(); onSubmit(email); }}><label>Email di sviluppo<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label><button>Apri ambiente locale</button></form>{message && <p className="admin-message">{message}</p>}</div></main>;
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button className={active ? "active" : ""} onClick={onClick}>{children}</button>; }

function ContentList<T extends ProjectContent | TeamMemberContent>({ section, items, selectedId, onSelect, onNew }: { section: "projects" | "team"; items: ContentEntity<T>[]; selectedId: string | "new"; onSelect: (id: string) => void; onNew: () => void }) {
  return <aside className="content-list"><button className={`content-row new ${selectedId === "new" ? "selected" : ""}`} onClick={onNew}>+ {section === "projects" ? "Nuovo progetto" : "Nuova persona"}</button>{items.map((item) => {
    const value = item.draft ?? item.published;
    const title = item.type === "project" ? (value as ProjectContent).title : (value as TeamMemberContent).name;
    return <button key={item.id} className={`content-row ${selectedId === item.id ? "selected" : ""}`} onClick={() => onSelect(item.id)}><span>{title || "Senza titolo"}</span><small>{item.state === "published" ? "Pubblicato" : "Bozza"}</small></button>;
  })}</aside>;
}

function ProjectEditor({ entity, onSaved }: { entity?: ContentEntity<ProjectContent>; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState<ProjectContent>(() => clone(entity?.draft ?? entity?.published ?? blankProject()));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProjectContent>(key: K, next: ProjectContent[K]) => setValue((previous) => ({ ...previous, [key]: next }));
  const save = async () => { setSaving(true); try { await adminApi.save("projects", entity?.id, value, entity?.displayOrder ?? 0); await onSaved(); } finally { setSaving(false); } };
  return <EditorFrame title={entity ? "Modifica progetto" : "Nuovo progetto"} onSave={() => void save()} saving={saving}>
    <div className="form-grid"><Field label="Titolo" value={value.title} onChange={(next) => set("title", next)} /><Field label="Slug URL" hint="es. parole-in-comune" value={value.slug} onChange={(next) => set("slug", next)} /><Field label="Sottotitolo" value={value.subtitle} onChange={(next) => set("subtitle", next)} /><Select label="Stato" value={value.statusLabel} onChange={(next) => set("statusLabel", next as ProjectContent["statusLabel"])} options={["In corso", "Concluso"]} /><Field label="Periodo" value={value.dateRange} onChange={(next) => set("dateRange", next)} /><Field label="Luogo" value={value.location} onChange={(next) => set("location", next)} /><Field label="Destinatari" value={value.audience} onChange={(next) => set("audience", next)} /><Field label="Temi" hint="separati da virgola" value={value.themes.join(", ")} onChange={(next) => set("themes", csv(next))} /></div>
    <AssetField label="Immagine di copertina" url={value.cover} alt={value.coverAlt} onChange={(cover, coverAlt, coverAssetId) => setValue((previous) => ({ ...previous, cover, coverAlt, coverAssetId }))} />
    <RichTextField label="Introduzione" value={value.intro} onChange={(next) => set("intro", next)} /><RichTextField label="Intenzione / obiettivo" value={value.objective} onChange={(next) => set("objective", next)} />
    <BlocksEditor blocks={value.blocks} onChange={(blocks) => set("blocks", blocks)} />
    <Field label="Risultati" hint="una riga per risultato" multiline value={value.outcomes.join("\n")} onChange={(next) => set("outcomes", lines(next))} />
    <Field label="Partner" hint="separati da virgola" value={value.partners.join(", ")} onChange={(next) => set("partners", csv(next))} /><Field label="Finanziatori" hint="separati da virgola" value={value.funders.join(", ")} onChange={(next) => set("funders", csv(next))} />
    <Field label="Progetti correlati" hint="slug separati da virgola" value={value.relatedSlugs.join(", ")} onChange={(next) => set("relatedSlugs", csv(next))} /><Field label="SEO title" value={value.seoTitle ?? ""} onChange={(next) => set("seoTitle", next)} /><Field label="SEO description" multiline value={value.seoDescription ?? ""} onChange={(next) => set("seoDescription", next)} />
  </EditorFrame>;
}

function TeamEditor({ entity, teamCount, onSaved }: { entity?: ContentEntity<TeamMemberContent>; teamCount: number; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState<TeamMemberContent>(() => clone(entity?.draft ?? entity?.published ?? blankTeamMember()));
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { await adminApi.save("team", entity?.id, value, entity?.displayOrder ?? teamCount); await onSaved(); } finally { setSaving(false); } };
  if (!entity && teamCount >= 3) return <EditorFrame title="Il team è completo"><p className="empty-state">La pagina Persone è progettata per un massimo di tre profili. Archivia o rimuovi un profilo prima di inserirne un altro.</p></EditorFrame>;
  return <EditorFrame title={entity ? "Modifica persona" : "Nuova persona"} onSave={() => void save()} saving={saving}>
    <div className="form-grid"><Field label="Nome e cognome" value={value.name} onChange={(name) => setValue({ ...value, name })} /><Field label="Ruolo" value={value.role} onChange={(role) => setValue({ ...value, role })} /></div>
    <AssetField label="Ritratto" url={value.image} alt={`Ritratto di ${value.name || "persona del team"}`} onChange={(image, _alt, imageAssetId) => setValue({ ...value, image, imageAssetId })} />
    <Field label="Posizione immagine (opzionale)" hint="es. center 35%" value={value.imagePosition ?? ""} onChange={(imagePosition) => setValue({ ...value, imagePosition })} />
    <RichTextList label="Bio" values={value.bio} onChange={(bio) => setValue({ ...value, bio })} /><RichTextField label="Citazione" value={value.quote} onChange={(quote) => setValue({ ...value, quote })} /><Field label="Autore citazione" value={value.quoteAuthor ?? ""} onChange={(quoteAuthor) => setValue({ ...value, quoteAuthor })} />
  </EditorFrame>;
}

function SiteEditor({ entity, onSaved }: { entity?: ContentEntity<SiteSettingsContent>; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState<SiteSettingsContent>(() => clone(entity?.draft ?? entity?.published ?? defaultSiteSettings));
  const [saving, setSaving] = useState(false);
  const setHomeRich = (path: string, next: RichText) => setValue((previous) => { const draft = clone(previous) as any; const keys = path.split("."); let target = draft.home; for (const key of keys.slice(0, -1)) target = target[key]; target[keys.at(-1)!] = next; return draft; });
  const setHomeText = (path: string, next: string) => setValue((previous) => { const draft = clone(previous) as any; const keys = path.split("."); let target = draft.home; for (const key of keys.slice(0, -1)) target = target[key]; target[keys.at(-1)!] = next; return draft; });
  const save = async () => { setSaving(true); try { await adminApi.save("site", entity?.id, value); await onSaved(); } finally { setSaving(false); } };
  return <EditorFrame title="Configurazione pubblica" onSave={() => void save()} saving={saving}>
    <h2>Associazione e footer</h2><div className="form-grid"><Field label="Nome" value={value.identity.organizationName} onChange={(organizationName) => setValue({ ...value, identity: { ...value.identity, organizationName } })} /><Field label="Forma giuridica" value={value.identity.legalForm} onChange={(legalForm) => setValue({ ...value, identity: { ...value.identity, legalForm } })} /><Field label="Città" value={value.identity.city} onChange={(city) => setValue({ ...value, identity: { ...value.identity, city } })} /><Field label="Paese" value={value.identity.country} onChange={(country) => setValue({ ...value, identity: { ...value.identity, country } })} /><Field label="Email" value={value.identity.email} onChange={(email) => setValue({ ...value, identity: { ...value.identity, email } })} /><Field label="Telefono" value={value.identity.phone ?? ""} onChange={(phone) => setValue({ ...value, identity: { ...value.identity, phone } })} /></div>
    <Field label="Descrizione SEO" multiline value={value.seo.defaultDescription} onChange={(defaultDescription) => setValue({ ...value, seo: { ...value.seo, defaultDescription } })} />
    <HomeSection title="Hero"><RichTextField label="Titolo" value={value.home.hero.headline} onChange={(next) => setHomeRich("hero.headline", next)} /><Field label="Metadati" value={value.home.hero.meta} onChange={(next) => setHomeText("hero.meta", next)} /><Field label="CTA" value={value.home.hero.ctaLabel} onChange={(next) => setHomeText("hero.ctaLabel", next)} /><Field label="URL immagine" value={value.home.hero.heroImage ?? ""} onChange={(next) => setHomeText("hero.heroImage", next)} /></HomeSection>
    <HomeSection title="Associazione"><RichTextField label="Titolo" value={value.home.association.heading} onChange={(next) => setHomeRich("association.heading", next)} /><RichTextField label="Testo" value={value.home.association.body} onChange={(next) => setHomeRich("association.body", next)} /><Field label="CTA" value={value.home.association.ctaLabel} onChange={(next) => setHomeText("association.ctaLabel", next)} /><Field label="Link CTA" value={value.home.association.ctaHref} onChange={(next) => setHomeText("association.ctaHref", next)} /></HomeSection>
    <HomeSection title="Perché Spazio Terzo"><Field label="Etichetta" value={value.home.origin.eyebrow} onChange={(next) => setHomeText("origin.eyebrow", next)} /><RichTextField label="Preludio" value={value.home.origin.prelude} onChange={(next) => setHomeRich("origin.prelude", next)} /><RichTextField label="Titolo" value={value.home.origin.heading} onChange={(next) => setHomeRich("origin.heading", next)} /><RichTextField label="Testo sinistro" value={value.home.origin.statement} onChange={(next) => setHomeRich("origin.statement", next)} /><RichTextField label="Testo destro" value={value.home.origin.identity} onChange={(next) => setHomeRich("origin.identity", next)} /></HomeSection>
    <HomeSection title="Attività"><RichTextField label="Titolo sezione" value={value.home.activities.heading} onChange={(next) => setHomeRich("activities.heading", next)} />{value.home.activities.items.map((activity, index) => <div className="activity-edit" key={activity.id}><Field label={`Attività ${index + 1}`} value={activity.title} onChange={(title) => setValue((previous) => { const draft = clone(previous); draft.home.activities.items[index].title = title; return draft; })} /><RichTextField label="Descrizione" value={activity.description} onChange={(description) => setValue((previous) => { const draft = clone(previous); draft.home.activities.items[index].description = description; return draft; })} /></div>)}</HomeSection>
    <HomeSection title="Territorio e immagine"><RichTextField label="Titolo territorio" value={value.home.territory.heading} onChange={(next) => setHomeRich("territory.heading", next)} /><RichTextField label="Testo territorio" value={value.home.territory.body} onChange={(next) => setHomeRich("territory.body", next)} /><Field label="CTA territorio" value={value.home.territory.ctaLabel} onChange={(next) => setHomeText("territory.ctaLabel", next)} /><Field label="Link territorio" value={value.home.territory.ctaHref} onChange={(next) => setHomeText("territory.ctaHref", next)} /><Field label="URL immagine manifesto" value={value.home.imageStatement.image ?? ""} onChange={(next) => setHomeText("imageStatement.image", next)} /><Field label="Didascalia" value={value.home.imageStatement.caption} onChange={(next) => setHomeText("imageStatement.caption", next)} /><Field label="Parola verticale" value={value.home.imageStatement.verticalWord} onChange={(next) => setHomeText("imageStatement.verticalWord", next)} /></HomeSection>
    <HomeSection title="Contatti"><RichTextField label="Titolo" value={value.home.contact.heading} onChange={(next) => setHomeRich("contact.heading", next)} /><RichTextField label="Testo" value={value.home.contact.body} onChange={(next) => setHomeRich("contact.body", next)} /><Field label="Etichetta email" value={value.home.contact.emailLabel ?? ""} onChange={(next) => setHomeText("contact.emailLabel", next)} /></HomeSection>
  </EditorFrame>;
}

function EditorFrame({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave?: () => void; saving?: boolean }) { return <><div className="editor-heading"><h2>{title}</h2>{onSave && <button className="save" onClick={onSave} disabled={saving}>{saving ? "Salvataggio…" : "Salva bozza"}</button>}</div><div className="editor-body">{children}</div></>; }
function HomeSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="home-section"><h2>{title}</h2>{children}</section>; }
function Field({ label, value, onChange, hint, multiline = false }: { label: string; value: string; onChange: (value: string) => void; hint?: string; multiline?: boolean }) { return <label className="field"><span>{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}{hint && <small>{hint}</small>}</label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function RichTextField({ label, value, onChange }: { label: string; value: RichText; onChange: (value: RichText) => void }) { const update = (index: number, patch: Partial<RichText[number]>) => onChange(value.map((span, itemIndex) => itemIndex === index ? { ...span, ...patch } : span)); return <div className="rich-field"><span>{label}</span>{value.map((span, index) => <div className="rich-row" key={index}><input value={span.text} onChange={(event) => update(index, { text: event.target.value })} placeholder="Testo" /><select value={span.marks?.[0] ?? "normal"} onChange={(event) => update(index, { marks: event.target.value === "normal" ? [] : [event.target.value as "italic" | "highlight" | "link"] })}><option value="normal">Normale</option><option value="italic">Corsivo</option><option value="highlight">Evidenziato</option><option value="link">Link</option></select>{span.marks?.includes("link") && <input value={span.href ?? ""} onChange={(event) => update(index, { href: event.target.value })} placeholder="https://" />}{value.length > 1 && <button className="icon-button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} aria-label="Rimuovi segmento">×</button>}</div>)}<button className="text-button" onClick={() => onChange([...value, { text: "" }])}>+ Aggiungi segmento</button></div>; }
function RichTextList({ label, values, onChange }: { label: string; values: RichText[]; onChange: (values: RichText[]) => void }) { return <div className="rich-list"><span>{label}</span>{values.map((value, index) => <div className="paragraph-edit" key={index}><RichTextField label={`Paragrafo ${index + 1}`} value={value} onChange={(next) => onChange(values.map((paragraph, itemIndex) => itemIndex === index ? next : paragraph))} /><button className="text-button danger" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi paragrafo</button></div>)}<button className="text-button" onClick={() => onChange([...values, asRichText("")])}>+ Aggiungi paragrafo</button></div>; }
function AssetField({ label, url, alt, onChange }: { label: string; url: string; alt: string; onChange: (url: string, alt: string, id?: string) => void }) { const [uploading, setUploading] = useState(false); const upload = async (file: File) => { setUploading(true); try { const asset = await adminApi.upload(file, alt || label); onChange(asset.url, asset.alt, asset.id); } finally { setUploading(false); } }; return <div className="asset-field"><Field label={label} value={url} onChange={(next) => onChange(next, alt)} /><Field label="Testo alternativo" value={alt} onChange={(next) => onChange(url, next)} /><label className="upload-button">{uploading ? "Caricamento…" : "Carica file"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>{url && <img src={url} alt={alt} />}</div>; }
function BlocksEditor({ blocks, onChange }: { blocks: ProjectBlock[]; onChange: (blocks: ProjectBlock[]) => void }) { const update = (index: number, next: ProjectBlock) => onChange(blocks.map((block, itemIndex) => itemIndex === index ? next : block)); const add = (type: ProjectBlock["type"]) => { const id = crypto.randomUUID(); const block: ProjectBlock = type === "paragraph" ? { id, type, text: asRichText("") } : type === "quote" ? { id, type, text: asRichText("") } : type === "list" ? { id, type, title: "", items: [] } : type === "image" ? { id, type, src: "", alt: "" } : { id, type, value: "", label: "" }; onChange([...blocks, block]); }; return <section className="blocks"><div className="block-heading"><h2>Racconto del progetto</h2><select defaultValue="" onChange={(event) => { if (event.target.value) add(event.target.value as ProjectBlock["type"]); event.target.value = ""; }}><option value="" disabled>+ Aggiungi blocco</option><option value="paragraph">Testo</option><option value="quote">Citazione</option><option value="list">Elenco</option><option value="image">Immagine</option><option value="stat">Dato</option></select></div>{blocks.map((block, index) => <div className="block-edit" key={block.id}><div className="block-top"><b>{index + 1}. {block.type}</b><button className="text-button danger" onClick={() => onChange(blocks.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi</button></div>{block.type === "paragraph" && <RichTextField label="Testo" value={block.text} onChange={(text) => update(index, { ...block, text })} />}{block.type === "quote" && <><RichTextField label="Citazione" value={block.text} onChange={(text) => update(index, { ...block, text })} /><Field label="Fonte" value={block.source ?? ""} onChange={(source) => update(index, { ...block, source })} /></>}{block.type === "list" && <><Field label="Titolo elenco" value={block.title} onChange={(title) => update(index, { ...block, title })} /><Field label="Voci" multiline hint="una riga per voce" value={block.items.join("\n")} onChange={(next) => update(index, { ...block, items: lines(next) })} /></>}{block.type === "image" && <AssetField label="Immagine" url={block.src ?? ""} alt={block.alt} onChange={(src, alt, assetId) => update(index, { ...block, src, alt, assetId })} />}{block.type === "stat" && <div className="form-grid"><Field label="Valore" value={block.value} onChange={(value) => update(index, { ...block, value })} /><Field label="Etichetta" value={block.label} onChange={(label) => update(index, { ...block, label })} /></div>}</div>)}</section>; }
const csv = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
