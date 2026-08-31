import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon, AppShell, Badge, Button, Drawer, Group, Menu, MultiSelect, NavLink, ScrollArea, SegmentedControl, Select, Skeleton, Stack, Stepper, Tabs, TagsInput, Text, TextInput, Textarea, Tooltip, UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { asRichText, contentLimits, defaultProjectOutcomesHeading, MAX_HOME_ACTIVITIES, normaliseProjectSlug, plainText, type ContentEntity, type ProjectBlock, type ProjectContent, type RichText, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../shared/default-site-settings";
import { adminApi, AccessoNegato, ConnessioneAssente, type AdminResource, type AdminUser, type RevisionSummary } from "./api";
import { MediaPicker } from "./MediaPicker";
import { ImageCropper } from "./ImageCropper";
import { RichTextField } from "./RichTextField";
import { formatRoute, homeRoute, parseRoute, routeKey, sameRoute, type Route, type Section, type SitePanel } from "./routing";
import { SeoPreview } from "./SeoPreview";
import { projectSnippet, siteSnippet } from "./seo";
import { diffContent, type FieldChange } from "./diff";
import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconChevronRight, IconChevronDown, IconChevronUp, IconDots, IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import { inFondoAllaPagina, sezioneCorrente } from "./home-sections";
import { selettoreHome, selettoreProgetto } from "./preview-focus";
import { sanitiseTags } from "./tags";
import { PreviewFrame } from "./PreviewFrame";
import { projectToLegacy, teamToLegacy } from "../../app/content/public-api";
import { ProjectDetail } from "../../app/components/projects/ProjectDetail";
import { getRelatedProjects } from "../../app/components/projects/content";
import { TeamProfileContent } from "../../app/components/people/TeamProfileModal";
import { HomePage } from "../../app/components/home/HomePage";
import { PublicPageShell } from "../../app/components/layout/PublicPageShell";

import { composeThemes, emptyImageBlocks, mainTheme, missingInStep, missingProjectFields, otherThemes, type ProjectFieldName } from "./project-fields";

type User = { email: string; role: "admin" | "editor" };
/** Nelle schede il nome della sezione è già nella linguetta attiva: evita di ripeterlo dentro la scheda. */
const SectionTitleContext = createContext(false);
/** setFieldValue tipizza il valore sul path testuale: con una chiave generica TypeScript non riesce a risolverlo, quindi lo dichiariamo qui una volta sola. */
type FieldSetter<T> = <K extends keyof T & string>(key: K, value: T[K]) => void;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const slugify = normaliseProjectSlug;
const blankProject = (): ProjectContent => ({ slug: "", title: "", subtitle: "", statusLabel: "In corso", dateRange: "", location: "", audience: "", themes: [], cover: "", coverAlt: "", intro: asRichText(""), objective: asRichText(""), blocks: [], outcomesHeading: clone(defaultProjectOutcomesHeading), outcomes: [], links: [], partners: [], funders: [], relatedSlugs: [] });
const blankTeamMember = (): TeamMemberContent => ({ name: "", role: "", image: "", bio: [asRichText("")], quote: asRichText("") });
const resourceFor = (section: Section): AdminResource => section === "projects" ? "projects" : section === "team" ? "team" : "site";
const statusLabel = (state: ContentEntity["state"]) => state === "published" ? "Pubblicato" : state === "archived" ? "Archiviato" : "Bozza";
const changedSincePublication = (entity?: ContentEntity) => Boolean(entity?.draft && (!entity.published || JSON.stringify(entity.draft) !== JSON.stringify(entity.published)));
const archiveDate = (value: string) => new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function saveLocalEmail(email: string) { window.localStorage.setItem("spazioterzo-dev-email", email.trim().toLowerCase()); window.location.reload(); }

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const initialRoute = useRef(parseRoute(window.location.hash)).current;
  const [section, setSection] = useState<Section>(initialRoute.section);
  const [sitePanel, setSitePanel] = useState<SitePanel>(initialRoute.sitePanel);
  const [editingId, setEditingId] = useState<string | "new" | null>(initialRoute.editingId);
  const [projects, setProjects] = useState<ContentEntity<ProjectContent>[]>([]);
  const [team, setTeam] = useState<ContentEntity<TeamMemberContent>[]>([]);
  const [site, setSite] = useState<ContentEntity<SiteSettingsContent> | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessOpen, setAccessOpen] = useState(false);
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sessioneScaduta, setSessioneScaduta] = useState(false);
  /** Cambia quando una revisione viene ripristinata: entra nella key dell'editor per farlo ripartire dai dati nuovi. */
  const [versioneEditor, setVersioneEditor] = useState(0);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isAdmin = user?.role === "admin";
  const activeTeam = team.filter((item) => item.state !== "archived");
  /** I progetti attivi con il loro contenuto: alimentano sia la scelta dei correlati sia l'anteprima. */
  const catalogoProgetti = useMemo(() => projects
    .filter((project) => project.state !== "archived")
    .map((project) => project.draft ?? project.published)
    .filter((contenuto): contenuto is ProjectContent => Boolean(contenuto)), [projects]);
  const relatedOptions = useMemo(() => catalogoProgetti
    .map((project) => ({ value: project.slug, label: project.title || project.slug })), [catalogoProgetti]);
  const siteContent = site?.draft ?? site?.published;
  const siteSeoDefaults = { suffix: siteContent?.seo.titleSuffix ?? defaultSiteSettings.seo.titleSuffix, shareImage: siteContent?.seo.shareImage };

  const reload = async (initial = false) => {
    if (initial) setLoading(true);
    setOffline(false);
    setSessioneScaduta(false);
    try {
      const identity = await adminApi.me();
      const listedProjects = await adminApi.list<ProjectContent>("projects");
      setUser(identity); setProjects(listedProjects);
      if (identity.role === "admin") {
        const [listedTeam, listedSite, listedUsers] = await Promise.all([adminApi.list<TeamMemberContent>("team"), adminApi.list<SiteSettingsContent>("site"), adminApi.users()]);
        setTeam(listedTeam); setSite(listedSite[0] ?? null); setUsers(listedUsers);
      } else { setTeam([]); setSite(null); setUsers([]); if (section !== "projects") { setSection("projects"); setEditingId(null); } }
    } catch (error) {
      if (error instanceof ConnessioneAssente) { setOffline(true); }
      // in produzione l'accesso passa da Cloudflare Access: il modulo con l'email di sviluppo non servirebbe a niente
      else if (error instanceof AccessoNegato && !import.meta.env.DEV) { setSessioneScaduta(true); }
      else {
        setUser(null);
        if (window.localStorage.getItem("spazioterzo-dev-email")) notifications.show({ color: "red", message: error instanceof Error ? error.message : "Accesso non disponibile" });
      }
    } finally { if (initial) setLoading(false); }
  };
  useEffect(() => { void reload(true); }, []);

  const route: Route = { section, editingId, sitePanel };
  const firstSync = useRef(true);
  // L'indirizzo insegue lo stato: refresh, preferiti e link condivisi tornano dove eri.
  useEffect(() => {
    const next = formatRoute(route);
    // il confronto ignora l'ancora, altrimenti lo scorrimento dentro la home verrebbe riscritto ogni volta
    if (routeKey(parseRoute(window.location.hash)) === next) return;
    if (firstSync.current) window.history.replaceState(null, "", next);
    else window.history.pushState(null, "", next);
    firstSync.current = false;
  }, [section, editingId, sitePanel]);

  // Indietro/avanti del browser e indirizzi scritti a mano: stesso guard delle modifiche non salvate.
  useEffect(() => {
    const apply = () => {
      const target = parseRoute(window.location.hash);
      if (sameRoute(target, route)) return;
      if (!confirmLeave()) { window.history.replaceState(null, "", formatRoute(route)); return; }
      setDirty(false);
      const allowed = user?.role === "admin" || target.section === "projects" ? target : homeRoute;
      setSection(allowed.section); setSitePanel(allowed.sitePanel); setEditingId(allowed.editingId);
    };
    window.addEventListener("popstate", apply);
    window.addEventListener("hashchange", apply);
    return () => { window.removeEventListener("popstate", apply); window.removeEventListener("hashchange", apply); };
  }, [section, editingId, sitePanel, dirty, user]);

  // Un indirizzo che punta a un contenuto sparito (archiviato altrove, id sbagliato) non deve lasciare la pagina vuota.
  useEffect(() => {
    if (loading || !user || section === "site" || !editingId || editingId === "new") return;
    const list: ContentEntity[] = section === "projects" ? projects : team;
    if (!list.length || list.some((item) => item.id === editingId)) return;
    notifications.show({ color: "orange", message: "Contenuto non trovato: torno all’archivio." });
    setEditingId(null);
  }, [loading, user, section, editingId, projects, team]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const confirmLeave = () => !dirty || window.confirm("Ci sono modifiche non salvate: uscendo vanno perse. Vuoi continuare?");
  const leaveEditor = (run: () => void) => { if (!confirmLeave()) return; setDirty(false); run(); };
  const navigate = (next: Section) => leaveEditor(() => { setSection(next); setEditingId(next === "site" ? "site" : null); setMobileNavOpened(false); });
  const navigateSite = (panel: SitePanel) => { if (section === "site") { setSitePanel(panel); setMobileNavOpened(false); return; } leaveEditor(() => { setSitePanel(panel); setSection("site"); setEditingId("site"); setMobileNavOpened(false); }); };
  const closeEditor = () => leaveEditor(() => setEditingId(null));
  const saved = async (entity: ContentEntity, message = "Bozza salvata.") => { setDirty(false); await reload(); setEditingId(entity.id); notifications.show({ color: "teal", message }); };
  const openEntity = (id: string) => setEditingId(id);
  /** Il form non si accorgerebbe del ripristino: si ricarica e si rimonta, altrimenti il salvataggio dopo lo cancella. */
  const restored = async () => { setDirty(false); await reload(); setVersioneEditor((numero) => numero + 1); };
  const archive = async (resource: AdminResource, id: string) => {
    if (!window.confirm("Archiviare questo contenuto? Non sarà più visibile sul sito. Potrai ripristinarlo dal filtro «Archiviati».")) return;
    try { await adminApi.archive(resource, id); setDirty(false); await reload(); setEditingId(null); notifications.show({ color: "orange", message: "Contenuto archiviato." }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Archiviazione non riuscita" }); }
  };
  const duplicate = async (item: ContentEntity<ProjectContent>) => {
    const source = item.draft ?? item.published;
    if (!source) return;
    const taken = new Set(projects.map((project) => project.slug));
    const root = source.slug.slice(0, contentLimits.project.slug - 7);
    let slug = `${root}-copia`;
    for (let attempt = 2; taken.has(slug); attempt += 1) slug = `${root}-copia-${attempt}`;
    try {
      const created = await adminApi.save<ProjectContent>("projects", undefined, { ...clone(source), slug, title: `${source.title} (copia)`.slice(0, contentLimits.project.title) });
      await reload();
      setEditingId(created.id);
      notifications.show({ color: "teal", message: "Copia creata come bozza: rinominala prima di pubblicarla." });
    } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Copia non riuscita" }); }
  };
  const restore = async (resource: AdminResource, id: string) => {
    try { await adminApi.unarchive(resource, id); await reload(); notifications.show({ color: "teal", message: "Contenuto ripristinato come bozza." }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Ripristino non riuscito" }); }
  };
  const publish = async (resource: AdminResource, id: string) => {
    try { await adminApi.publish(resource, id); await reload(); notifications.show({ color: "teal", message: "Contenuto pubblicato sul sito." }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Pubblicazione non riuscita" }); }
  };
  /** Lo scambio avviene fra i due elementi che l'utente vede vicini: con un filtro attivo la lista completa non lo sa. */
  const move = async (resource: "projects" | "team", item: ContentEntity, neighbour: ContentEntity) => {
    try { await adminApi.swap(resource, item.id, neighbour.id); await reload(); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Ordine non aggiornato" }); }
  };

  if (loading) return <LoadingScreen />;
  if (offline) return <OfflineScreen onRetry={() => void reload(true)} />;
  if (sessioneScaduta) return <SessionExpiredScreen />;
  if (!user) return <AccessGate onSubmit={saveLocalEmail} />;

  const currentProject = section === "projects" && editingId && editingId !== "new" ? projects.find((item) => item.id === editingId) : undefined;
  const currentTeam = section === "team" && editingId && editingId !== "new" ? team.find((item) => item.id === editingId) : undefined;
  const editing = editingId !== null;

  return <AppShell navbar={{ width: 258, breakpoint: "sm", collapsed: { mobile: !mobileNavOpened } }} header={{ height: 58, collapsed: !isMobile }} padding={0} className="admin-app-shell">
    <AppShell.Header className="admin-mobile-header"><a href="/#top"><img src="/assets/logo_spazioterzo.svg" alt="Spazio Terzo" /></a><Button variant="subtle" color="dark" size="xs" aria-expanded={mobileNavOpened} aria-controls="admin-navbar" onClick={() => setMobileNavOpened((open) => !open)}>{mobileNavOpened ? "Chiudi" : "Menu"}</Button></AppShell.Header>
    <AppShell.Navbar id="admin-navbar" className="admin-navbar">
      <div className="admin-brand"><a href="/#top" aria-label="Spazio Terzo, home"><img src="/assets/logo_spazioterzo_negative.svg" alt="Spazio Terzo" /></a><Text component="span">Back office</Text></div>
      <ScrollArea className="admin-nav-scroll"><nav aria-label="Gestione contenuti">
        <p className="nav-group">Contenuti</p>
        <NavLink label={<NavLabel name="Progetti" detail={projects.filter((item) => item.state !== "archived").length} />} active={section === "projects"} onClick={() => navigate("projects")} />
        <NavLink label={<NavLabel name="Persone" detail={`${activeTeam.length}/3`} />} active={section === "team"} disabled={!isAdmin} onClick={() => isAdmin && navigate("team")} />
        {isAdmin && <>
          <p className="nav-group">Sito</p>
          {/* le pagine del sito sono sempre in vista: prima comparivano solo dopo aver aperto la sezione */}
          <NavLink label="Identità del sito" active={section === "site" && sitePanel === "identity"} onClick={() => navigateSite("identity")} />
          <NavLink label="Home" active={section === "site" && sitePanel === "home"} onClick={() => navigateSite("home")} />
          <NavLink label="SEO e condivisione" active={section === "site" && sitePanel === "seo"} onClick={() => navigateSite("seo")} />
        </>}
      </nav></ScrollArea>
      <div className="admin-profile"><Text size="xs" lineClamp={1}>{user.email}</Text><Menu position="top-start" width={230}><Menu.Target><UnstyledButton className="profile-trigger"><span>{isAdmin ? "Amministratore" : "Editor · progetti"}</span><IconDots size={16} stroke={1.7} /></UnstyledButton></Menu.Target><Menu.Dropdown>{isAdmin && <Menu.Item onClick={() => setAccessOpen(true)}>Gestisci accessi</Menu.Item>}<Menu.Item color="red" onClick={() => { window.localStorage.removeItem("spazioterzo-dev-email"); window.location.reload(); }}>Esci dall’ambiente locale</Menu.Item></Menu.Dropdown></Menu></div>
    </AppShell.Navbar>
    <AppShell.Main className="admin-main"><main className="admin-workspace">
      {section !== "site" && !editing && <ArchiveView section={section} items={section === "projects" ? projects : team} isAdmin={Boolean(isAdmin)} teamFull={activeTeam.length >= 3} onNew={() => setEditingId("new")} onOpen={openEntity} onMove={(item, neighbour) => void move(section, item, neighbour)} onRestore={(id) => void restore(resourceFor(section), id)} onDuplicate={(item) => void duplicate(item as ContentEntity<ProjectContent>)} onPublish={(id) => void publish(resourceFor(section), id)} onArchive={(id) => void archive(resourceFor(section), id)} />}
      {section === "projects" && editing && <ProjectEditor onRestored={restored} key={`${editingId}-${versioneEditor}`} entity={currentProject} isAdmin={Boolean(isAdmin)} siteSeo={siteSeoDefaults} siteSettings={siteContent ?? defaultSiteSettings} relatedOptions={relatedOptions.filter((option) => option.value !== currentProject?.slug)} catalogo={catalogoProgetti} onBack={closeEditor} onSaved={saved} onPublish={publish} onArchive={archive} onDirtyChange={setDirty} />}
      {section === "team" && editing && <TeamEditor onRestored={restored} key={`${editingId}-${versioneEditor}`} entity={currentTeam} teamCount={activeTeam.length} teamIndex={Math.max(0, activeTeam.findIndex((item) => item.id === editingId))} onBack={closeEditor} onSaved={saved} onPublish={publish} onArchive={archive} onDirtyChange={setDirty} />}
      {section === "site" && <SiteEditor onRestored={restored} key={`${site?.id ?? "site"}-${versioneEditor}`} entity={site ?? undefined} activePanel={sitePanel} anchor={initialRoute.anchor} onSaved={saved} onPublish={publish} onDirtyChange={setDirty} />}
    </main></AppShell.Main>
    <Drawer opened={accessOpen} onClose={() => setAccessOpen(false)} title="Accessi" position="right" size="lg"><UserManagement users={users} currentEmail={user.email} onChanged={async () => { await reload(); notifications.show({ color: "teal", message: "Accesso aggiornato." }); }} /></Drawer>
  </AppShell>;
}

/** Durante il primo caricamento mostra la forma della pagina, non una scritta al centro del vuoto. */
function LoadingScreen() {
  return <main className="admin-loading" aria-busy="true" aria-live="polite">
    <div className="loading-sidebar"><Skeleton height={26} width={128} radius={3} /><Skeleton height={11} width={70} radius={3} mt={12} /><Skeleton height={30} radius={3} mt={30} /><Skeleton height={30} radius={3} mt={6} /><Skeleton height={11} width={44} radius={3} mt={26} /><Skeleton height={30} radius={3} mt={12} /><Skeleton height={30} radius={3} mt={6} /></div>
    <div className="loading-content">
      <Skeleton height={13} width={70} radius={3} />
      <Skeleton height={34} width={230} radius={3} mt={12} />
      <Skeleton height={15} width={380} radius={3} mt={12} />
      <Skeleton height={36} radius={3} mt={34} />
      <div className="loading-list">{Array.from({ length: 5 }, (_, index) => <div key={index}><Skeleton height={44} width={44} radius={3} /><div><Skeleton height={14} width={200} radius={3} /><Skeleton height={12} width={320} radius={3} mt={8} /></div></div>)}</div>
      <Text size="sm" c="dimmed" mt="xl">Carico i contenuti…</Text>
    </div>
  </main>;
}

function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);
  return <main className="access-gate"><section>
    <img className="access-logo" src="/assets/logo_spazioterzo.svg" alt="Spazio Terzo" />
    <Text className="eyebrow">Connessione</Text>
    <h1>Il server dei contenuti non risponde.</h1>
    <Text c="dimmed">I contenuti già pubblicati restano online: questa schermata riguarda solo il back office. Se il problema continua, controlla che il servizio sia attivo.</Text>
    <Group mt="lg"><Button color="orange" loading={retrying} onClick={() => { setRetrying(true); onRetry(); window.setTimeout(() => setRetrying(false), 1200); }}>Riprova</Button></Group>
  </section></main>;
}

/** In produzione l'accesso è di Cloudflare Access: qui non c'è nessun modulo da compilare, solo da rientrare. */
function SessionExpiredScreen() {
  return <main className="access-gate"><section>
    <img className="access-logo" src="/assets/logo_spazioterzo.svg" alt="Spazio Terzo" />
    <Text className="eyebrow">Area riservata</Text>
    <h1>La sessione è scaduta.</h1>
    <Text c="dimmed">Per continuare serve rientrare: ricaricando la pagina ricevi un nuovo codice all’email autorizzata. Le bozze salvate non si perdono.</Text>
    <Group mt="lg"><Button color="orange" onClick={() => window.location.reload()}>Rientra</Button></Group>
  </section></main>;
}

function NavLabel({ name, detail }: { name: string; detail: string | number }) { return <Group justify="space-between" wrap="nowrap"><span>{name}</span><small>{detail}</small></Group>; }

function AccessGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const form = useForm({ mode: "controlled", initialValues: { email: "editor@spazioterzo.test" }, validate: { email: (value) => /^\S+@\S+\.\S+$/.test(value) ? null : "Inserisci un’email valida" } });
  return <main className="access-gate"><section><img className="access-logo" src="/assets/logo_spazioterzo.svg" alt="Spazio Terzo" /><Text className="eyebrow">Area riservata</Text><h1>Entra nel back office.</h1><Text c="dimmed">In produzione Cloudflare Access invia un codice monouso all’email autorizzata.</Text><form onSubmit={form.onSubmit(({ email }) => onSubmit(email))}><TextInput label="Email di sviluppo" type="email" required maxLength={254} {...form.getInputProps("email")} /><Button type="submit" color="orange">Apri ambiente locale</Button></form></section></main>;
}

type ArchiveEntity = ContentEntity<ProjectContent | TeamMemberContent>;
function ArchiveView({ section, items, isAdmin, teamFull, onNew, onOpen, onMove, onRestore, onDuplicate, onPublish, onArchive }: { section: "projects" | "team"; items: ArchiveEntity[]; isAdmin: boolean; teamFull: boolean; onNew: () => void; onOpen: (id: string) => void; onMove: (item: ArchiveEntity, neighbour: ArchiveEntity) => void; onRestore: (id: string) => void; onDuplicate: (item: ArchiveEntity) => void; onPublish: (id: string) => void; onArchive: (id: string) => void }) {
  const form = useForm({ mode: "controlled", initialValues: { query: "", status: "all" } });
  const showArchived = form.values.status === "archived";
  const visible = useMemo(() => items.filter((item) => {
    const matchesStatus = form.values.status === "archived" ? item.state === "archived" : item.state !== "archived" && (form.values.status === "all" || item.state === form.values.status);
    if (!matchesStatus) return false;
    const content = item.draft ?? item.published;
    const title = content && "title" in content ? content.title : content && "name" in content ? content.name : "";
    return `${title ?? ""} ${item.slug}`.toLowerCase().includes(form.values.query.toLowerCase());
  }), [items, form.values.query, form.values.status]);
  const title = section === "projects" ? "Progetti" : "Persone";
  const canCreate = section === "projects" || !teamFull;
  const active = items.filter((item) => item.state !== "archived");
  const counts = { all: active.length, draft: active.filter((item) => item.state === "draft").length, published: active.filter((item) => item.state === "published").length, archived: items.filter((item) => item.state === "archived").length };
  return <section className="archive-view"><header className="view-header"><div><Text className="eyebrow">Archivio</Text><h1>{title}</h1><Text c="dimmed">{section === "projects" ? "Crea, ordina e prepara i progetti prima della pubblicazione." : "La pagina Persone mantiene il collage con un massimo di tre profili."}</Text></div>{canCreate ? <Button color="orange" onClick={onNew}>{section === "projects" ? "Nuovo progetto" : "Nuova persona"}</Button> : <Tooltip label="Il collage pubblico ospita tre profili: archiviane uno per liberare un posto."><span tabIndex={0} className="disabled-cta"><Button color="orange" disabled>Nuova persona</Button></span></Tooltip>}</header>
    <div className="archive-tools"><TextInput placeholder={`Cerca ${title.toLowerCase()}…`} {...form.getInputProps("query")} /><SegmentedControl aria-label="Filtra per stato" value={form.values.status} onChange={(status) => form.setFieldValue("status", status)} data={[{ value: "all", label: `Tutti ${counts.all}` }, { value: "draft", label: `Bozze ${counts.draft}` }, { value: "published", label: `Online ${counts.published}` }, { value: "archived", label: `Archiviati ${counts.archived}` }]} /></div>
    <div className="archive-list">{visible.length ? visible.map((item, index) => { const content = item.draft ?? item.published; const name = content && "title" in content ? content.title : content && "name" in content ? content.name : "Senza titolo"; const note = content && "subtitle" in content ? content.subtitle : content && "role" in content ? content.role : ""; const image = content && "cover" in content ? content.cover : content && "image" in content ? content.image : ""; const hasPendingChanges = changedSincePublication(item); return <div className="archive-row" key={item.id}><UnstyledButton onClick={() => onOpen(item.id)} className="archive-open">{image && <img src={image} alt="" />}<div className="archive-copy"><Text fw={700}>{name || "Senza titolo"}</Text><Text c="dimmed" size="sm" lineClamp={1}>{note}</Text><Text className="archive-updated" size="xs">Modificato {archiveDate(item.updatedAt)}{hasPendingChanges && item.published ? " · modifiche non online" : ""}{item.slug ? ` · /${item.slug}` : ""}</Text></div><Badge className={`state state-${item.state}`} variant="light">{item.state === "published" ? "Online" : statusLabel(item.state)}</Badge></UnstyledButton>{isAdmin && <Group gap={0} className="archive-actions">{showArchived ? <Button size="xs" variant="default" onClick={() => onRestore(item.id)}>Ripristina</Button> : <><Menu position="bottom-end" withinPortal><Menu.Target><ActionIcon aria-label={`Altre azioni per ${name || "questo contenuto"}`} variant="subtle" color="dark"><IconDots size={17} stroke={1.7} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item onClick={() => onOpen(item.id)}>Apri</Menu.Item>{section === "projects" && <Menu.Item onClick={() => onDuplicate(item)}>Duplica</Menu.Item>}{hasPendingChanges && <Menu.Item onClick={() => onPublish(item.id)}>{item.published ? "Pubblica modifiche" : "Pubblica"}</Menu.Item>}<Menu.Divider /><Menu.Item color="red" onClick={() => onArchive(item.id)}>Archivia</Menu.Item></Menu.Dropdown></Menu><Tooltip label="Sposta su"><ActionIcon aria-label={`Sposta ${name || "elemento"} più in alto`} variant="subtle" color="dark" disabled={index === 0} onClick={() => onMove(item, visible[index - 1])}><IconArrowUp size={17} stroke={1.7} /></ActionIcon></Tooltip><Tooltip label="Sposta giù"><ActionIcon aria-label={`Sposta ${name || "elemento"} più in basso`} variant="subtle" color="dark" disabled={index === visible.length - 1} onClick={() => onMove(item, visible[index + 1])}><IconArrowDown size={17} stroke={1.7} /></ActionIcon></Tooltip></>}</Group>}</div>; }) : <div className="empty-state"><h2>{showArchived ? "Nessun contenuto archiviato." : "Nessun contenuto qui."}</h2><p>{showArchived ? "Gli elementi archiviati compariranno qui e potrai riportarli in bozza." : "Prova un’altra ricerca oppure crea il primo elemento."}</p></div>}</div>
  </section>;
}

type EditorFrameProps = { title: string; eyebrow: string; entity?: ContentEntity; resource: AdminResource; isAdmin?: boolean; onBack?: () => void; onSave: () => void; saving: boolean; dirty?: boolean; preview: React.ReactNode; children: React.ReactNode; onRestored?: () => Promise<void>; onPublish?: (resource: AdminResource, id: string) => Promise<void>; onArchive?: (resource: AdminResource, id: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void };
function EditorFrame({ title, eyebrow, entity, resource, isAdmin = true, onBack, onSave, saving, dirty = false, preview, children, onPublish, onArchive, onDirtyChange, onRestored }: EditorFrameProps) {
  const [previewOpen, setPreviewOpen] = useState(false); const [revisionsOpen, setRevisionsOpen] = useState(false);
  const notifyDirty = useRef(onDirtyChange); notifyDirty.current = onDirtyChange;
  useEffect(() => { notifyDirty.current?.(dirty); }, [dirty]);

  // Cmd+S (o Ctrl+S) salva la bozza: in uno strumento di scrittura è un riflesso automatico
  const salva = useRef(onSave); salva.current = onSave;
  useEffect(() => {
    const scorciatoia = (event: KeyboardEvent) => {
      if (event.key !== "s" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      salva.current();
    };
    window.addEventListener("keydown", scorciatoia);
    return () => window.removeEventListener("keydown", scorciatoia);
  }, []);
  useEffect(() => () => notifyDirty.current?.(false), []);
  const readyToPublish = Boolean(entity && isAdmin && changedSincePublication(entity) && !dirty);
  const publicationMessage = !entity ? (dirty ? "Salva per creare la bozza" : "Bozza non ancora salvata") : dirty ? "Salva la bozza prima di pubblicare" : changedSincePublication(entity) ? entity.published ? "La bozza più recente non è ancora online" : "Questa bozza non è ancora online" : entity.published ? "Versione online aggiornata" : "Tutto salvato";
  return <section className="editor-view">
    <div className="editor-back"><Button variant="subtle" color="dark" size="xs" leftSection={<IconArrowLeft size={15} stroke={1.8} />} onClick={onBack}>Archivio</Button></div>
    <header className="editor-header">
      <div className="editor-identity">
        <h1>{title}</h1>
        <div className="editor-meta">
          <Badge className={`state state-${entity?.state ?? "draft"}`} variant="light">{entity?.published ? "Online" : entity ? statusLabel(entity.state) : "Nuova bozza"}</Badge>
          <Text size="xs" c={dirty || !entity || changedSincePublication(entity) ? "orange" : "teal"}>{publicationMessage}</Text>
          {entity && <Text size="xs" c="dimmed" className="editor-updated">salvato il {new Date(entity.updatedAt).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>}
        </div>
      </div>
      <Group gap="xs" wrap="nowrap">
        <Button className="solo-schermi-stretti" variant="default" size="sm" onClick={() => setPreviewOpen(true)}>Anteprima</Button>
        <Button color="orange" variant={readyToPublish ? "default" : "filled"} size="sm" onClick={onSave} loading={saving} disabled={Boolean(entity) && !dirty}>{dirty ? "Salva bozza" : entity ? "Bozza salvata" : "Salva bozza"}</Button>
        {readyToPublish && <Button color="orange" size="sm" onClick={() => void onPublish?.(resource, entity!.id)}>Pubblica modifiche</Button>}
        {entity && isAdmin && <Menu position="bottom-end"><Menu.Target><ActionIcon aria-label="Altre azioni" variant="default" size="lg"><IconDots size={18} stroke={1.7} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item onClick={() => setRevisionsOpen(true)}>Cronologia revisioni</Menu.Item><Menu.Divider /><Menu.Item color="red" onClick={() => void onArchive?.(resource, entity.id)}>Archivia</Menu.Item></Menu.Dropdown></Menu>}
      </Group>
    </header>
    <div className="editor-surface">
      <div className="editor-main">{children}</div>
      <aside className="editor-preview" aria-label="Anteprima della bozza">
        <div className="editor-preview-head">
          <Text size="xs" fw={600}>Anteprima della bozza</Text>
          <Button variant="subtle" color="dark" size="xs" onClick={() => setPreviewOpen(true)}>Ingrandisci</Button>
        </div>
        <div className="editor-preview-frame"><div className="public-preview">{preview}</div></div>
      </aside>
    </div>
    <Drawer opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Anteprima della bozza" position="right" size="100%"><div className="public-preview">{preview}</div></Drawer>
    {entity && <RevisionDrawer opened={revisionsOpen} onClose={() => setRevisionsOpen(false)} resource={resource} entity={entity} onRestored={onRestored} />}
  </section>;
}

/** Riferimento stabile: passato a un effetto, un array nuovo a ogni render lo farebbe ripartire. */
const vuoto: number[] = [];

function ProjectEditor({ entity, isAdmin, siteSeo, siteSettings, relatedOptions, catalogo, onBack, onSaved, onPublish, onArchive, onDirtyChange, onRestored }: { onRestored?: () => Promise<void>; entity?: ContentEntity<ProjectContent>; isAdmin: boolean; siteSeo: { suffix: string; shareImage?: string }; siteSettings: SiteSettingsContent; relatedOptions: Array<{ value: string; label: string }>; catalogo: ProjectContent[]; onBack: () => void; onSaved: (entity: ContentEntity, message?: string) => Promise<void>; onPublish: (resource: AdminResource, id: string) => Promise<void>; onArchive: (resource: AdminResource, id: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void }) {
  const form = useForm<ProjectContent>({ mode: "controlled", initialValues: clone(entity?.draft ?? entity?.published ?? blankProject()) });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [slugEdited, setSlugEdited] = useState(Boolean(entity));
  const [errors, setErrors] = useState<Partial<Record<ProjectFieldName, string>>>({});
  const [blocchiIncompleti, setBlocchiIncompleti] = useState<number[]>(vuoto);
  const [scheda, setScheda] = useState<string | null>("opening");
  const set = form.setFieldValue as FieldSetter<ProjectContent>;
  const newProject = !entity;
  const missing = missingProjectFields(form.values);

  /** Porta l'editor sul primo campo mancante invece di limitarsi ad avvisare che «qualcosa» manca. */
  const showMissing = (fields: typeof missing) => {
    setErrors(Object.fromEntries(fields.map((requirement) => [requirement.field, requirement.message])));
    const first = fields[0];
    if (!first) return;
    if (newProject && first.step !== step) setStep(first.step);
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-field="${first.field}"]`);
      // su TextInput e Textarea l'attributo finisce sul campo stesso, sugli altri sul messaggio d'errore
      const input = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target : target?.querySelector<HTMLElement>("input, textarea") ?? null;
      (input ?? target)?.scrollIntoView({ block: "center", behavior: "smooth" });
      input?.focus({ preventScroll: true });
    }, 60);
  };

  const save = async () => {
    if (missing.length) { showMissing(missing); notifications.show({ color: "orange", message: `Manca ancora: ${missing.map((requirement) => requirement.label.toLowerCase()).join(", ")}.` }); return; }
    // il server rifiuterebbe con un messaggio generico: qui si dice quale blocco è rimasto a metà
    const senzaFoto = emptyImageBlocks(form.values);
    if (senzaFoto.length) {
      setBlocchiIncompleti(senzaFoto);
      if (newProject) setStep(2); else setScheda("story");
      notifications.show({ color: "orange", message: senzaFoto.length === 1 ? `Il blocco ${senzaFoto[0]} del racconto è un’immagine senza foto: scegline una o elimina il blocco.` : `Blocchi ${senzaFoto.join(", ")} del racconto: sono immagini senza foto.` });
      return;
    }
    setBlocchiIncompleti(vuoto);
    setErrors({});
    setSaving(true);
    try {
      const saved = await adminApi.save("projects", entity?.id, form.values, entity?.displayOrder, entity?.updatedAt);
      form.resetDirty(form.values);
      await onSaved(saved, entity ? "Bozza salvata." : "Progetto creato: ora puoi completarlo.");
    } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Bozza non salvata" }); }
    finally { setSaving(false); }
  };

  const setProjectTitle = (title: string) => { set("title", title); if (!slugEdited) set("slug", slugify(title)); };
  const goToStep = (next: number) => {
    if (next > step) { const mancanti = missingInStep(form.values, step as 0 | 1); if (mancanti.length) { showMissing(mancanti); return; } }
    setErrors({});
    setStep(next);
  };

  const opening = <ProjectOpening value={form.values} set={set} errors={errors} onTitleChange={setProjectTitle} onSlugChange={(slug) => { setSlugEdited(true); set("slug", slugify(slug)); }} />;
  const overview = <ProjectOverview value={form.values} set={set} errors={errors} />;
  const story = <ProjectStory value={form.values} set={set} blocchiIncompleti={blocchiIncompleti} />;
  const outcomes = <ProjectOutcomes value={form.values} set={set} />;
  const diary = <ProjectDiary value={form.values} set={set} />;
  const network = <ProjectNetwork value={form.values} set={set} />;
  const invite = <ProjectInvite value={form.values} set={set} relatedOptions={relatedOptions} />;
  const seo = <ProjectSeo value={form.values} set={set} suffix={siteSeo.suffix} shareImage={siteSeo.shareImage} />;

  return <form onSubmit={(event) => { event.preventDefault(); void save(); }}><EditorFrame title={entity ? form.values.title || "Progetto senza titolo" : "Nuovo progetto"} eyebrow={entity ? "Modifica progetto" : "Crea progetto"} entity={entity} resource="projects" isAdmin={isAdmin} onBack={onBack} onSave={() => void save()} saving={saving} dirty={form.isDirty()} preview={<ProjectPreview project={form.values} site={siteSettings} catalogo={catalogo} focus={selettoreProgetto(scheda)} />} onPublish={onPublish} onArchive={onArchive} onDirtyChange={onDirtyChange} onRestored={onRestored}>
    {newProject
      ? <>
          <Stepper active={step} onStepClick={goToStep} allowNextStepsSelect={false} className="project-stepper">
            <Stepper.Step label="Copertina e apertura" description="Quello che si vede per primo">{opening}</Stepper.Step>
            <Stepper.Step label="Il progetto" description="Frase di apertura e scheda dati">{overview}</Stepper.Step>
            <Stepper.Step label="Il racconto" description="Intenzione e blocchi">{story}</Stepper.Step>
            <Stepper.Completed><ReviewProject project={form.values} missing={missing} onFix={() => showMissing(missing)} /></Stepper.Completed>
          </Stepper>
          <Group className="stepper-actions" justify="space-between" mt="xl">
            <Button variant="default" disabled={step === 0} onClick={() => goToStep(step - 1)}>Indietro</Button>
            {step < 3
              ? <Button color="orange" onClick={() => goToStep(step + 1)}>{step === 2 ? "Rivedi e salva" : "Continua"}</Button>
              : <Button color="orange" loading={saving} onClick={() => void save()}>Crea il progetto</Button>}
          </Group>
        </>
      : <SectionTitleContext.Provider value><Tabs value={scheda} onChange={setScheda} className="editor-tabs">
          <Tabs.List>
            <Tabs.Tab value="opening">Copertina e apertura</Tabs.Tab>
            <Tabs.Tab value="overview">Il progetto</Tabs.Tab>
            <Tabs.Tab value="story">Il racconto</Tabs.Tab>
            <Tabs.Tab value="extra">Diario, reti e inviti</Tabs.Tab>
            <Tabs.Tab value="seo">SEO</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="opening">{opening}</Tabs.Panel>
          <Tabs.Panel value="overview">{overview}</Tabs.Panel>
          <Tabs.Panel value="story">{story}{outcomes}</Tabs.Panel>
          <Tabs.Panel value="extra">{diary}{network}{invite}</Tabs.Panel>
          <Tabs.Panel value="seo">{seo}</Tabs.Panel>
        </Tabs></SectionTitleContext.Provider>}
  </EditorFrame></form>;
}

function ProjectOpening({ value, set, errors, onTitleChange, onSlugChange }: { value: ProjectContent; set: FieldSetter<ProjectContent>; errors: Partial<Record<ProjectFieldName, string>>; onTitleChange: (title: string) => void; onSlugChange: (slug: string) => void }) {
  return <section className="form-section">
    <SectionHeading title="Copertina e apertura" hint="La prima schermata della pagina: immagine a tutto schermo, titolo e sottotitolo." shape="hero" />
    <MediaPicker label="Immagine di copertina" required value={{ url: value.cover, alt: value.coverAlt, assetId: value.coverAssetId }} onChange={(next) => { const changed = next.url !== value.cover || next.assetId !== value.coverAssetId; set("cover", next.url); set("coverAlt", next.alt); set("coverAssetId", next.assetId); if (changed) set("coverCrop", undefined); }} />
    <ImageCropper image={value.cover} value={value.coverCrop} onChange={(coverCrop) => set("coverCrop", coverCrop)} title="Ritaglio della copertina" description="Sposta il punto importante nell’area: questa è l’inquadratura usata dal sito." aspect={16 / 10} />
    {(errors.cover || errors.coverAlt) && <Text size="xs" c="red" data-field="cover">{errors.cover ?? errors.coverAlt}</Text>}
    <div className="form-grid">
      <TextInput data-field="title" label="Titolo" required error={errors.title} maxLength={contentLimits.project.title} value={value.title} onChange={(event) => onTitleChange(event.currentTarget.value)} />
      <TextInput data-field="slug" label="Indirizzo della pagina" description={`spazioterzo.org/progetti/${value.slug || "…"}`} required error={errors.slug} maxLength={contentLimits.project.slug} value={value.slug} onChange={(event) => onSlugChange(event.currentTarget.value)} />
      <Textarea data-field="subtitle" label="Sottotitolo" description="Una riga sotto al titolo" required error={errors.subtitle} maxLength={contentLimits.project.subtitle} autosize minRows={2} value={value.subtitle} onChange={(event) => set("subtitle", event.currentTarget.value)} />
      <Select label="Stato" description="Compare in alto, accanto al tema principale" data={["In corso", "Concluso"]} value={value.statusLabel} onChange={(next) => set("statusLabel", (next ?? "In corso") as ProjectContent["statusLabel"])} />
      <TextInput label="Tema principale" description="L’unico tema che compare in copertina" maxLength={contentLimits.project.theme} value={mainTheme(value.themes)} onChange={(event) => set("themes", composeThemes(event.currentTarget.value, otherThemes(value.themes)))} />
      <TagsInput label="Altri temi" description="Compaiono solo nella riga «Area»" placeholder="Aggiungi un tema" maxTags={19} value={otherThemes(value.themes)} onChange={(next) => set("themes", composeThemes(mainTheme(value.themes), sanitiseTags(next, { maxItems: 19, maxLength: contentLimits.project.theme })))} />
    </div>
  </section>;
}

function ProjectOverview({ value, set, errors }: { value: ProjectContent; set: FieldSetter<ProjectContent>; errors: Partial<Record<ProjectFieldName, string>> }) {
  return <section className="form-section">
    <SectionHeading title="Il progetto" hint="La sezione dopo la copertina: una frase grande a sinistra e la scheda dei dati a destra." shape="overview" />
    <RichTextField label="Frase di apertura" hint="Sul sito diventa un titolo grande: tienila breve, due o tre righe." maxLength={contentLimits.project.intro} value={value.intro} onChange={(next) => set("intro", next)} />
    <div className="form-grid">
      <TextInput data-field="dateRange" label="Periodo" required error={errors.dateRange} placeholder="2025 — in corso" maxLength={contentLimits.project.dateRange} value={value.dateRange} onChange={(event) => set("dateRange", event.currentTarget.value)} />
      <TextInput data-field="location" label="Luogo" required error={errors.location} placeholder="Catania" maxLength={contentLimits.project.location} value={value.location} onChange={(event) => set("location", event.currentTarget.value)} />
      <Textarea data-field="audience" label="Per chi" required error={errors.audience} placeholder="Giovani adulti e persone in momenti di transizione" maxLength={contentLimits.project.audience} autosize minRows={2} value={value.audience} onChange={(event) => set("audience", event.currentTarget.value)} />
    </div>
  </section>;
}

function ProjectStory({ value, set, blocchiIncompleti }: { value: ProjectContent; set: FieldSetter<ProjectContent>; blocchiIncompleti: number[] }) {
  return <section className="form-section">
    <SectionHeading title="L’intenzione e il racconto" hint="Il corpo della pagina: l’intenzione in apertura, poi i blocchi nell’ordine in cui appaiono." shape="story" />
    <RichTextField label="L’intenzione" hint="Perché esiste questo progetto, in poche righe." maxLength={contentLimits.project.objective} value={value.objective} onChange={(next) => set("objective", next)} />
    <BlocksEditor blocks={value.blocks} onChange={(next) => set("blocks", next)} incompleti={blocchiIncompleti} />
    <VideoEditor value={value.video} onChange={(next) => set("video", next)} />
  </section>;
}


/**
 * Elenco scritto una riga per voce.
 *
 * Il testo digitato resta com'è finché si scrive: ripulendolo a ogni battitura, gli spazi
 * verrebbero mangiati appena inseriti e l'a capo sparirebbe prima di poter scrivere la riga
 * nuova. La ripulitura vale solo per quello che finisce nel contenuto salvato.
 */
function RigheField({ label, description, values, onChange, maxLength, minRows = 4 }: { label: string; description?: string; values: string[]; onChange: (values: string[]) => void; maxLength?: number; minRows?: number }) {
  const [testo, setTesto] = useState(() => values.join("\n"));

  // aggiornamenti che arrivano da fuori: ripristino di una revisione, cambio di contenuto
  useEffect(() => {
    setTesto((corrente) => lines(corrente).join("\n") === values.join("\n") ? corrente : values.join("\n"));
  }, [values]);

  return <Textarea
    label={label}
    description={description}
    maxLength={maxLength}
    autosize
    minRows={minRows}
    value={testo}
    onChange={(event) => { setTesto(event.currentTarget.value); onChange(lines(event.currentTarget.value)); }}
  />;
}

function ProjectOutcomes({ value, set }: { value: ProjectContent; set: FieldSetter<ProjectContent> }) {
  return <section className="form-section">
    <SectionHeading title="Cosa abbiamo attivato" hint="Sul sito diventano un elenco numerato: 01, 02, 03…" shape="outcomes" />
    <RichTextField label="Titolo in evidenza" hint="La frase grande che introduce i risultati. Puoi usare il corsivo per mettere una parte in arancio." maxLength={contentLimits.project.outcomesHeading} value={value.outcomesHeading ?? defaultProjectOutcomesHeading} onChange={(next) => set("outcomesHeading", next)} />
    <RigheField label="Risultati" description="Una riga per risultato" maxLength={contentLimits.project.outcome * 12} values={value.outcomes} onChange={(next) => set("outcomes", next)} />
  </section>;
}

function ProjectDiary({ value, set }: { value: ProjectContent; set: FieldSetter<ProjectContent> }) {
  return <section className="form-section">
    <SectionHeading title="Nel diario del progetto" hint="I link che il sito mostra come aggiornamenti del progetto." shape="notes" />
    <LinksEditor links={value.links} onChange={(next) => set("links", next)} />
  </section>;
}

function ProjectNetwork({ value, set }: { value: ProjectContent; set: FieldSetter<ProjectContent> }) {
  return <section className="form-section">
    <SectionHeading title="Reti e trasparenza" hint="Chi c’è dietro il progetto e cosa dichiariamo apertamente." shape="notes" />
    <div className="form-grid">
      <TagsInput label="Partner" description="Scrivi e premi Invio per ognuno" placeholder="Aggiungi un partner" maxTags={30} value={value.partners} onChange={(next) => set("partners", sanitiseTags(next, { maxItems: 30, maxLength: contentLimits.project.partner }))} />
      <TagsInput label="Finanziatori" description="Scrivi e premi Invio per ognuno" placeholder="Aggiungi un finanziatore" maxTags={30} value={value.funders} onChange={(next) => set("funders", sanitiseTags(next, { maxItems: 30, maxLength: contentLimits.project.partner }))} />
    </div>
    <Textarea label="Nota di visibilità" description="Cosa raccontiamo e cosa no, per rispetto delle persone coinvolte" maxLength={contentLimits.project.visibilityNote} autosize minRows={3} value={value.visibilityNote ?? ""} onChange={(event) => set("visibilityNote", event.currentTarget.value || undefined)} />
  </section>;
}

function ProjectInvite({ value, set, relatedOptions }: { value: ProjectContent; set: FieldSetter<ProjectContent>; relatedOptions: Array<{ value: string; label: string }> }) {
  return <section className="form-section">
    <SectionHeading title="Invito finale e altri progetti" hint="Chiudono la pagina: l’invito a partecipare e i rimandi ad altri progetti." shape="cta" />
    <div className="form-grid">
      <TextInput label="Testo dell’invito" description="Esempio: «Parliamone insieme»" maxLength={contentLimits.project.ctaLabel} value={value.cta?.label ?? ""} onChange={(event) => set("cta", { label: event.currentTarget.value, href: value.cta?.href ?? "" })} />
      <TextInput label="Dove porta l’invito" placeholder="/contatti" maxLength={2_000} value={value.cta?.href ?? ""} onChange={(event) => set("cta", { label: value.cta?.label ?? "", href: event.currentTarget.value })} />
    </div>
    <MultiSelect label="Progetti correlati" description="Scegli fra i progetti esistenti" placeholder={value.relatedSlugs.length ? undefined : "Nessun progetto collegato"} searchable clearable maxValues={20} data={[...relatedOptions, ...value.relatedSlugs.filter((slug) => !relatedOptions.some((option) => option.value === slug)).map((slug) => ({ value: slug, label: `${slug} — non trovato` }))]} value={value.relatedSlugs} onChange={(next) => set("relatedSlugs", next)} />
  </section>;
}

/** Titolo di sezione con la fascia di pagina che si sta compilando, così si capisce dove finisce il testo. */
function SectionHeading({ title, hint, shape }: { title: string; hint: string; shape: "hero" | "overview" | "story" | "outcomes" | "notes" | "cta" }) {
  const compatta = useContext(SectionTitleContext);
  return <div className="section-heading section-heading-mapped">
    <div>{!compatta && <h2>{title}</h2>}<p>{hint}</p></div>
    <span className={`page-shape page-shape-${shape}`} aria-hidden="true" />
  </div>;
}
function ProjectSeo({ value, set, suffix, shareImage }: { value: ProjectContent; set: FieldSetter<ProjectContent>; suffix: string; shareImage?: string }) {
  const snippet = projectSnippet({ slug: value.slug, title: value.title, subtitle: value.subtitle, seoTitle: value.seoTitle, seoDescription: value.seoDescription, suffix });
  return <section className="form-section"><div className="section-heading"><h2>SEO</h2><p>Compila solo se il progetto deve comparire in ricerca con parole diverse dal titolo e dal sottotitolo.</p></div>
    <div className="seo-layout">
      <div className="seo-fields">
        <TextInput label="Titolo SEO" description={`Consigliati meno di 60 caratteri, suffisso «${suffix}» incluso`} maxLength={contentLimits.project.seoTitle} value={value.seoTitle ?? ""} onChange={(event) => set("seoTitle", event.currentTarget.value || undefined)} />
        <FieldCounter length={(value.seoTitle ?? "").length} max={contentLimits.project.seoTitle} />
        <Textarea label="Descrizione SEO" description="Consigliati 120-155 caratteri" maxLength={contentLimits.project.seoDescription} autosize minRows={3} value={value.seoDescription ?? ""} onChange={(event) => set("seoDescription", event.currentTarget.value || undefined)} />
        <FieldCounter length={(value.seoDescription ?? "").length} max={contentLimits.project.seoDescription} />
      </div>
      <SeoPreview snippet={snippet} shareImage={shareImage ?? value.cover} shareAlt={value.coverAlt} />
    </div>
  </section>;
}
function FieldCounter({ length, max }: { length: number; max: number }) { return <Text size="xs" ta="right" c={length > max * .9 ? "orange" : "dimmed"} aria-live="polite">{length}/{max}</Text>; }

function TeamEditor({ entity, teamCount, teamIndex, onBack, onSaved, onPublish, onArchive, onDirtyChange, onRestored }: { onRestored?: () => Promise<void>; entity?: ContentEntity<TeamMemberContent>; teamCount: number; teamIndex: number; onBack: () => void; onSaved: (entity: ContentEntity, message?: string) => Promise<void>; onPublish: (resource: AdminResource, id: string) => Promise<void>; onArchive: (resource: AdminResource, id: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void }) {
  const form = useForm<TeamMemberContent>({ mode: "controlled", initialValues: clone(entity?.draft ?? entity?.published ?? blankTeamMember()), validate: { name: (value) => value.trim() ? null : "Il nome è obbligatorio", role: (value) => value.trim() ? null : "Il ruolo è obbligatorio", image: (value) => value ? null : "Scegli un ritratto" } });
  const [saving, setSaving] = useState(false); const set = form.setFieldValue as FieldSetter<TeamMemberContent>;
  const save = form.onSubmit(async (values) => { setSaving(true); try { const saved = await adminApi.save("team", entity?.id, values, entity?.displayOrder, entity?.updatedAt); form.resetDirty(values); await onSaved(saved); } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Bozza non salvata" }); } finally { setSaving(false); } });
  if (!entity && teamCount >= 3) return <section className="editor-view"><header className="editor-header"><div><Button variant="subtle" color="dark" size="xs" leftSection={<IconArrowLeft size={15} stroke={1.8} />} onClick={onBack}>Archivio</Button><Text className="eyebrow">Persone</Text><h1>Il team è completo</h1></div></header><div className="empty-state"><p>Il collage pubblico è progettato per tre persone. Archivia un profilo esistente per liberare un posto, poi torna qui.</p><Button color="orange" onClick={onBack}>Vai all’archivio persone</Button></div></section>;
  return <form onSubmit={save}><EditorFrame title={entity ? form.values.name || "Persona senza nome" : "Nuova persona"} eyebrow="Persone" entity={entity} resource="team" onBack={onBack} onSave={() => save()} saving={saving} dirty={form.isDirty()} preview={<TeamPreview member={form.values} index={teamIndex} total={Math.max(teamCount, teamIndex + 1)} />} onPublish={onPublish} onArchive={onArchive} onDirtyChange={onDirtyChange} onRestored={onRestored}><section className="form-section"><div className="section-heading"><h2>Profilo</h2><p>{teamCount}/3 profili attivi. L’ordine si gestisce dall’archivio.</p></div><div className="form-grid"><TextInput label="Nome e cognome" required maxLength={contentLimits.team.name} value={form.values.name} onChange={(event) => set("name", event.currentTarget.value)} /><TextInput label="Ruolo" required maxLength={contentLimits.team.role} value={form.values.role} onChange={(event) => set("role", event.currentTarget.value)} /></div><MediaPicker label="Ritratto" required showPreview={false} altEditable={false} altHint="Il testo alternativo si costruisce dal nome inserito qui sopra." value={{ url: form.values.image, alt: `Ritratto di ${form.values.name || "persona del team"}`, assetId: form.values.imageAssetId }} onChange={(next) => { if (next.url === form.values.image && next.assetId === form.values.imageAssetId) return; form.setValues({ ...form.values, image: next.url, imageAssetId: next.assetId, imageCrop: undefined, imagePosition: undefined }); }} /><ImageCropper image={form.values.image} value={form.values.imageCrop} onChange={(imageCrop) => set("imageCrop", imageCrop)} title="Ritaglio del ritratto" description="Sposta il volto nell’area: è esattamente la parte che apparirà sul sito." /><RichTextList label="Bio" maxLength={contentLimits.team.bioParagraph} values={form.values.bio} onChange={(next) => set("bio", next)} /><RichTextField label="Citazione" maxLength={contentLimits.team.quote} value={form.values.quote} onChange={(next) => set("quote", next)} /><TextInput label="Autore citazione" maxLength={contentLimits.team.quoteAuthor} value={form.values.quoteAuthor ?? ""} onChange={(event) => set("quoteAuthor", event.currentTarget.value || undefined)} /></section></EditorFrame></form>;
}

function SiteEditor({ entity, activePanel, anchor, onSaved, onPublish, onDirtyChange, onRestored }: { onRestored?: () => Promise<void>; entity?: ContentEntity<SiteSettingsContent>; activePanel: SitePanel; anchor?: string; onSaved: (entity: ContentEntity, message?: string) => Promise<void>; onPublish: (resource: AdminResource, id: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void }) {
  const form = useForm<SiteSettingsContent>({ mode: "controlled", initialValues: clone(entity?.draft ?? entity?.published ?? defaultSiteSettings) });
  const [saving, setSaving] = useState(false);
  const [sezioneHome, setSezioneHome] = useState<string | null>(anchor ?? "apertura");
  const update = (recipe: (draft: SiteSettingsContent) => void) => { const next = clone(form.values); recipe(next); form.setValues(next); };
  const save = form.onSubmit(async (values) => { setSaving(true); try { const saved = await adminApi.save("site", entity?.id, values, undefined, entity?.updatedAt); form.resetDirty(values); await onSaved(saved); } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Bozza non salvata" }); } finally { setSaving(false); } });
  const panelTitle = activePanel === "identity" ? "Identità del sito" : activePanel === "home" ? "Home" : "SEO e condivisione";
  return <form onSubmit={save}><EditorFrame title={panelTitle} eyebrow="Sito" entity={entity} resource="site" onSave={() => save()} saving={saving} dirty={form.isDirty()} preview={<SitePreview site={form.values} focus={activePanel === "home" ? selettoreHome(sezioneHome) : undefined} />} onPublish={onPublish} onDirtyChange={onDirtyChange} onRestored={onRestored}>{activePanel === "identity" ? <SiteIdentity value={form.values} update={update} /> : activePanel === "home" ? <HomeEditor value={form.values} update={update} initialAnchor={anchor} onSectionChange={setSezioneHome} /> : <SiteSeo value={form.values} update={update} />}</EditorFrame></form>;
}

function SiteIdentity({ value, update }: { value: SiteSettingsContent; update: (recipe: (draft: SiteSettingsContent) => void) => void }) {
  const phones = value.identity.phones ?? (value.identity.phone ? [value.identity.phone] : []);
  const campo = (chiave: keyof SiteSettingsContent["identity"], etichetta: string, opzioni: { descrizione?: string; max?: number; multilinea?: boolean; opzionale?: boolean } = {}) => {
    const valore = (value.identity[chiave] as string | undefined) ?? "";
    const scrivi = (testo: string) => update((draft) => { (draft.identity[chiave] as string | undefined) = opzioni.opzionale ? (testo || undefined) : testo; });
    return opzioni.multilinea
      ? <Textarea key={chiave} label={etichetta} description={opzioni.descrizione} maxLength={opzioni.max} autosize minRows={2} value={valore} onChange={(event) => scrivi(event.currentTarget.value)} />
      : <TextInput key={chiave} label={etichetta} description={opzioni.descrizione} maxLength={opzioni.max} value={valore} onChange={(event) => scrivi(event.currentTarget.value)} />;
  };

  return <div className="home-sections">
    <section className="form-section">
      <SectionHeading title="Nome e logo" hint="Compaiono nell’intestazione di ogni pagina e aprono il piè di pagina." shape="hero" />
      <div className="form-grid">
        {campo("organizationName", "Nome dell’associazione", { descrizione: "Usato nell’intestazione e nella riga del copyright", max: contentLimits.site.organizationName })}
        {campo("footerTagline", "Payoff nel footer", { descrizione: "Facoltativo: compare sotto il logo", max: contentLimits.site.footerTagline, opzionale: true })}
      </div>
      <MediaPicker label="Logo chiaro" description="Usato su sfondi scuri, nell’intestazione e nel footer del sito." previewTone="dark" previewFit="contain" previewRatio={16 / 6} value={{ url: value.identity.logoLight ?? "", alt: `${value.identity.organizationName} logo chiaro` }} onChange={(next) => update((draft) => { draft.identity.logoLight = next.url || undefined; })} />
      <MediaPicker label="Logo scuro" description="Pronto per le superfici chiare del sito; se manca, il sito usa il logo chiaro." previewTone="light" previewFit="contain" previewRatio={16 / 6} value={{ url: value.identity.logoDark ?? "", alt: `${value.identity.organizationName} logo scuro` }} onChange={(next) => update((draft) => { draft.identity.logoDark = next.url || undefined; })} />
      <MediaPicker label="Favicon" description="L’icona nella scheda del browser" previewFit="contain" previewRatio={1} value={{ url: value.identity.favicon ?? "", alt: "Favicon" }} onChange={(next) => update((draft) => { draft.identity.favicon = next.url || undefined; })} />
    </section>

    <section className="form-section">
      <SectionHeading title="Recapiti nel piè di pagina" hint="Compaiono in fondo a tutte le pagine: identità, sede, contatti e social." shape="notes" />
      <div className="form-grid">
        {campo("legalForm", "Forma giuridica", { descrizione: "Es. Spazio Terzo APS", max: contentLimits.site.legalForm })}
        {campo("taxId", "P. IVA / Codice fiscale", { descrizione: "Facoltativo: compare nella colonna Identità", max: contentLimits.site.taxId, opzionale: true })}
        {campo("email", "Email", { descrizione: "È anche il collegamento del blocco contatti", max: 254 })}
        {campo("address", "Indirizzo", { descrizione: "Facoltativo: se vuoto, la riga non compare", max: contentLimits.site.address, multilinea: true, opzionale: true })}
        {campo("mapUrl", "Link mappa", { descrizione: "Facoltativo: rende cliccabile l’indirizzo", max: contentLimits.site.mapUrl, opzionale: true })}
        {campo("city", "Città", { max: contentLimits.site.city })}
        {campo("country", "Paese", { max: contentLimits.site.country })}
      </div>
      <PhoneNumbers value={phones} onChange={(next) => update((draft) => { draft.identity.phones = next; draft.identity.phone = undefined; })} />
      <SocialLinks value={value.identity.socialLinks} onChange={(next) => update((draft) => { draft.identity.socialLinks = next; })} />
    </section>
  </div>;
}

/** Ordine e nomi presi dalla home pubblica (app/components/home): il pannello si scorre come la pagina. */
const homeSections: Array<{ key: keyof SiteSettingsContent["home"]; anchor: string; label: string; hint: string; shape: "hero" | "overview" | "story" | "outcomes" | "notes" | "cta" }> = [
  { key: "hero", anchor: "apertura", label: "Apertura", hint: "La prima schermata: immagine a tutto schermo, titolo grande e invito.", shape: "hero" },
  { key: "association", anchor: "associazione", label: "01 — L’associazione", hint: "Il manifesto che apre la pagina, con il rimando alla pagina dell’associazione.", shape: "overview" },
  { key: "imageStatement", anchor: "immagine-manifesto", label: "Immagine manifesto", hint: "La fascia illustrata a tutta larghezza, con didascalia e parola verticale.", shape: "story" },
  { key: "origin", anchor: "perche-spazio-terzo", label: "Perché Spazio Terzo", hint: "La sezione scura che racconta il nome, su due colonne di testo.", shape: "story" },
  { key: "activities", anchor: "attivita", label: "02 — Le nostre attività", hint: "L’elenco numerato delle attività, con titolo di sezione.", shape: "outcomes" },
  { key: "territory", anchor: "territorio", label: "03 — Sul territorio", hint: "La sezione sul territorio, con invito finale.", shape: "notes" },
  { key: "contact", anchor: "contatti", label: "04 — Contatti", hint: "La chiusura della pagina con l’invito a scrivere.", shape: "cta" },
];

function HomeEditor({ value, update, initialAnchor, onSectionChange }: { value: SiteSettingsContent; update: (recipe: (draft: SiteSettingsContent) => void) => void; initialAnchor?: string; onSectionChange?: (anchor: string) => void }) {
  const [current, setCurrent] = useState(initialAnchor ?? homeSections[0].anchor);
  const containers = useRef(new Map<string, HTMLElement>());
  const scrittoDaNoi = useRef(initialAnchor);

  const avvisa = useRef(onSectionChange); avvisa.current = onSectionChange;
  const segnala = (anchor: string) => {
    setCurrent(anchor);
    avvisa.current?.(anchor);
    scrittoDaNoi.current = anchor;
    window.history.replaceState(null, "", `#/sito/home/${anchor}`);
  };

  // all'apertura salta alla sezione indicata dall'indirizzo
  useEffect(() => {
    if (!initialAnchor) return;
    const target = containers.current.get(initialAnchor);
    window.setTimeout(() => target?.scrollIntoView({ block: "start" }), 80);
  }, [initialAnchor]);

  // mentre si scorre, l'indice segue e l'indirizzo resta condivisibile senza riempire la cronologia
  useEffect(() => {
    let richiesta = 0;
    const calcola = () => {
      richiesta = 0;
      const posizioni = homeSections
        .map((section) => ({ anchor: section.anchor, elemento: containers.current.get(section.anchor) }))
        .filter((voce): voce is { anchor: string; elemento: HTMLElement } => Boolean(voce.elemento))
        .map((voce) => ({ anchor: voce.anchor, top: voce.elemento.getBoundingClientRect().top }));
      const inFondo = inFondoAllaPagina(window.scrollY, window.innerHeight, document.documentElement.scrollHeight);
      const corrente = sezioneCorrente(posizioni, { inFondo });
      if (corrente) segnala(corrente);
    };
    // throttle a tempo e non su frame: così l'indice resta corretto anche quando la finestra non disegna
    const suScorrimento = () => { if (!richiesta) richiesta = window.setTimeout(calcola, 90); };
    window.addEventListener("scroll", suScorrimento, { passive: true });
    window.setTimeout(calcola, 200);
    return () => { window.removeEventListener("scroll", suScorrimento); if (richiesta) window.clearTimeout(richiesta); };
  }, []);

  const vai = (anchor: string) => {
    containers.current.get(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    segnala(anchor);
  };

  // un indirizzo incollato mentre la pagina è già aperta deve comunque portare alla sezione giusta
  useEffect(() => {
    const suCambioIndirizzo = () => {
      const anchor = parseRoute(window.location.hash).anchor;
      if (!anchor || anchor === scrittoDaNoi.current || !containers.current.has(anchor)) return;
      vai(anchor);
    };
    window.addEventListener("hashchange", suCambioIndirizzo);
    return () => window.removeEventListener("hashchange", suCambioIndirizzo);
  }, []);

  return <div className="home-editor-layout">
    <nav className="section-map" aria-label="Sezioni della home">
      {homeSections.map((section) => <UnstyledButton key={section.anchor} className={current === section.anchor ? "active" : ""} aria-current={current === section.anchor ? "true" : undefined} onClick={() => vai(section.anchor)}>
        {section.label}<IconChevronRight size={15} stroke={1.7} />
      </UnstyledButton>)}
    </nav>
    <div className="home-sections">
      {homeSections.map((section) => <section
        key={section.anchor}
        className="form-section"
        data-anchor={section.anchor}
        ref={(element) => { if (element) containers.current.set(section.anchor, element); else containers.current.delete(section.anchor); }}
      >
        <SectionHeading title={section.label} hint={section.hint} shape={section.shape} />
        <HomeFields value={value} update={update} active={section.key} />
      </section>)}
    </div>
  </div>;
}

function HomeFields({ value, update, active }: { value: SiteSettingsContent; update: (recipe: (draft: SiteSettingsContent) => void) => void; active: keyof SiteSettingsContent["home"] }) {
  if (active === "hero") return <Stack><RichTextField label="Titolo" maxLength={contentLimits.site.heroHeadline} value={value.home.hero.headline} onChange={(next) => update((draft) => { draft.home.hero.headline = next; })} /><TextInput label="Metadati" maxLength={contentLimits.site.heroMeta} value={value.home.hero.meta} onChange={(event) => update((draft) => { draft.home.hero.meta = event.currentTarget.value; })} /><TextInput label="CTA" maxLength={contentLimits.site.ctaLabel} value={value.home.hero.ctaLabel} onChange={(event) => update((draft) => { draft.home.hero.ctaLabel = event.currentTarget.value; })} /><MediaPicker label="Immagine hero" value={{ url: value.home.hero.heroImage ?? "", alt: "Immagine hero" }} onChange={(next) => update((draft) => { draft.home.hero.heroImage = next.url || undefined; })} /></Stack>;
  if (active === "association") return <Stack><RichTextField label="Titolo" maxLength={contentLimits.site.associationHeading} value={value.home.association.heading} onChange={(next) => update((draft) => { draft.home.association.heading = next; })} /><RichTextField label="Testo" maxLength={contentLimits.site.associationBody} value={value.home.association.body} onChange={(next) => update((draft) => { draft.home.association.body = next; })} /><TextInput label="CTA" maxLength={contentLimits.site.ctaLabel} value={value.home.association.ctaLabel} onChange={(event) => update((draft) => { draft.home.association.ctaLabel = event.currentTarget.value; })} /><TextInput label="Link CTA" maxLength={2_000} value={value.home.association.ctaHref} onChange={(event) => update((draft) => { draft.home.association.ctaHref = event.currentTarget.value; })} /></Stack>;
  if (active === "origin") return <Stack><TextInput label="Etichetta" maxLength={contentLimits.site.originEyebrow} value={value.home.origin.eyebrow} onChange={(event) => update((draft) => { draft.home.origin.eyebrow = event.currentTarget.value; })} /><RichTextField label="Preludio" maxLength={contentLimits.site.originPrelude} value={value.home.origin.prelude} onChange={(next) => update((draft) => { draft.home.origin.prelude = next; })} /><RichTextField label="Titolo" maxLength={contentLimits.site.originHeading} value={value.home.origin.heading} onChange={(next) => update((draft) => { draft.home.origin.heading = next; })} /><RichTextField label="Testo sinistro" maxLength={contentLimits.site.originStatement} value={value.home.origin.statement} onChange={(next) => update((draft) => { draft.home.origin.statement = next; })} /><RichTextField label="Testo destro" maxLength={contentLimits.site.originIdentity} value={value.home.origin.identity} onChange={(next) => update((draft) => { draft.home.origin.identity = next; })} /></Stack>;
  if (active === "activities") {
    const activities = value.home.activities.items;
    const addActivity = () => update((draft) => { if (draft.home.activities.items.length >= MAX_HOME_ACTIVITIES) return; draft.home.activities.items.push({ id: crypto.randomUUID(), title: "", description: asRichText("") }); });
    const removeActivity = (index: number) => {
      const activity = activities[index];
      if ((activity.title.trim() || plainText(activity.description).trim()) && !window.confirm(`Eliminare l’attività ${index + 1}? Il testo inserito andrà perso.`)) return;
      update((draft) => { draft.home.activities.items.splice(index, 1); });
    };
    return <Stack><RichTextField label="Titolo sezione" maxLength={contentLimits.site.activitiesHeading} value={value.home.activities.heading} onChange={(next) => update((draft) => { draft.home.activities.heading = next; })} /><div className="activities-editor-head"><div><Text fw={700} size="sm">Attività</Text><Text c="dimmed" size="xs">{activities.length}/{MAX_HOME_ACTIVITIES} attività nella Home.</Text></div><Button type="button" variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} disabled={activities.length >= MAX_HOME_ACTIVITIES} onClick={addActivity}>Aggiungi attività</Button></div>{activities.map((activity, index) => <div className="activity-edit" key={activity.id}><Group justify="space-between" align="center"><Text fw={700} size="sm">Attività {index + 1}</Text><Tooltip label="Rimuovi attività"><ActionIcon type="button" aria-label={`Rimuovi attività ${index + 1}`} variant="subtle" color="red" onClick={() => removeActivity(index)}><IconTrash size={16} stroke={1.8} /></ActionIcon></Tooltip></Group><TextInput label="Titolo" maxLength={contentLimits.site.activityTitle} value={activity.title} onChange={(event) => update((draft) => { draft.home.activities.items[index].title = event.currentTarget.value; })} /><RichTextField label="Descrizione" maxLength={contentLimits.site.activityDescription} value={activity.description} onChange={(next) => update((draft) => { draft.home.activities.items[index].description = next; })} /></div>)}</Stack>;
  }
  if (active === "territory") return <Stack><RichTextField label="Titolo" maxLength={contentLimits.site.territoryHeading} value={value.home.territory.heading} onChange={(next) => update((draft) => { draft.home.territory.heading = next; })} /><RichTextField label="Testo" maxLength={contentLimits.site.territoryBody} value={value.home.territory.body} onChange={(next) => update((draft) => { draft.home.territory.body = next; })} /><TextInput label="CTA" maxLength={contentLimits.site.ctaLabel} value={value.home.territory.ctaLabel} onChange={(event) => update((draft) => { draft.home.territory.ctaLabel = event.currentTarget.value; })} /><TextInput label="Link CTA" maxLength={2_000} value={value.home.territory.ctaHref} onChange={(event) => update((draft) => { draft.home.territory.ctaHref = event.currentTarget.value; })} /></Stack>;
  if (active === "imageStatement") return <Stack><MediaPicker label="Immagine manifesto" value={{ url: value.home.imageStatement.image ?? "", alt: value.home.imageStatement.caption || "Immagine manifesto" }} onChange={(next) => update((draft) => { draft.home.imageStatement.image = next.url || undefined; })} /><Textarea label="Didascalia" maxLength={contentLimits.site.imageCaption} autosize minRows={2} value={value.home.imageStatement.caption} onChange={(event) => update((draft) => { draft.home.imageStatement.caption = event.currentTarget.value; })} /><TextInput label="Parola verticale" maxLength={contentLimits.site.verticalWord} value={value.home.imageStatement.verticalWord} onChange={(event) => update((draft) => { draft.home.imageStatement.verticalWord = event.currentTarget.value; })} /></Stack>;
  return <Stack><RichTextField label="Titolo" maxLength={contentLimits.site.contactHeading} value={value.home.contact.heading} onChange={(next) => update((draft) => { draft.home.contact.heading = next; })} /><RichTextField label="Testo" maxLength={contentLimits.site.contactBody} value={value.home.contact.body} onChange={(next) => update((draft) => { draft.home.contact.body = next; })} /><TextInput label="Etichetta email" maxLength={contentLimits.site.emailLabel} value={value.home.contact.emailLabel ?? ""} onChange={(event) => update((draft) => { draft.home.contact.emailLabel = event.currentTarget.value || undefined; })} /></Stack>;
}

function SiteSeo({ value, update }: { value: SiteSettingsContent; update: (recipe: (draft: SiteSettingsContent) => void) => void }) {
  return <section className="form-section">
    <div className="section-heading section-heading-plain"><p>Titolo, descrizione e immagine usati in ricerca e nelle condivisioni di Home, Persone e Progetti.</p></div>
    <SeoPreview snippet={siteSnippet({ suffix: value.seo.titleSuffix, description: value.seo.defaultDescription })} shareImage={value.seo.shareImage ?? ""} shareAlt="Immagine di condivisione del sito" />
    <TextInput label="Suffisso titolo SEO" description="Compare dopo il titolo di ogni pagina" maxLength={contentLimits.site.titleSuffix} value={value.seo.titleSuffix} onChange={(event) => update((draft) => { draft.seo.titleSuffix = event.currentTarget.value; })} />
    <Textarea label="Descrizione SEO" description="Consigliati 120-155 caratteri" maxLength={contentLimits.site.description} autosize minRows={3} value={value.seo.defaultDescription} onChange={(event) => update((draft) => { draft.seo.defaultDescription = event.currentTarget.value; })} />
    <FieldCounter length={value.seo.defaultDescription.length} max={contentLimits.site.description} />
    <MediaPicker label="Immagine di condivisione" description="Usata sulle pagine generiche; i progetti usano questa immagine se presente, altrimenti la loro copertina." value={{ url: value.seo.shareImage ?? "", alt: "Immagine di condivisione" }} onChange={(next) => update((draft) => { draft.seo.shareImage = next.url || undefined; })} />
  </section>;
}

function RevisionDrawer({ opened, onClose, resource, entity, onRestored }: { opened: boolean; onClose: () => void; resource: AdminResource; entity: ContentEntity; onRestored?: () => Promise<void> }) {
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [openDiff, setOpenDiff] = useState<string | null>(null);
  const [changes, setChanges] = useState<FieldChange[] | null>(null);
  useEffect(() => { if (opened) void adminApi.revisions(resource, entity.id).then(setRevisions).catch((reason) => setError(reason instanceof Error ? reason.message : "Revisioni non disponibili")); }, [opened, resource, entity.id]);
  const current = (entity.draft ?? entity.published) as Record<string, unknown> | undefined;
  const compare = async (revisionId: string) => {
    if (openDiff === revisionId) { setOpenDiff(null); return; }
    setOpenDiff(revisionId); setChanges(null);
    try { setChanges(diffContent(await adminApi.revision<Record<string, unknown>>(resource, entity.id, revisionId), current)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Confronto non disponibile"); setOpenDiff(null); }
  };
  const restore = async (revisionId: string) => {
    if (!window.confirm("Ripristinare questa revisione come nuova bozza? La bozza attuale viene sostituita.")) return;
    try {
      await adminApi.restoreRevision(resource, entity.id, revisionId);
      onClose();
      // senza questo l'editor resterebbe sui valori di prima e il salvataggio successivo cancellerebbe il ripristino
      await onRestored?.();
      notifications.show({ color: "teal", message: "Revisione ripristinata come nuova bozza." });
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ripristino non riuscito"); }
  };
  return <Drawer opened={opened} onClose={onClose} title="Cronologia revisioni" position="right" size="md">
    {error && <Text c="red">{error}</Text>}
    {!revisions && !error && <Text c="dimmed">Caricamento…</Text>}
    <Stack gap="md">{revisions?.map((revision) => <div className="revision-entry" key={revision.id}>
      <div className="revision-row">
        <div><Text fw={700}>Versione {revision.revisionNumber}</Text><Text size="xs" c="dimmed">{new Date(revision.createdAt).toLocaleString("it-IT")} · {revision.createdBy}</Text></div>
        <Group gap="xs">
          {revision.isPublished && <Badge color="teal" variant="light">Pubblicata</Badge>}
          {revision.isDraft && <Badge color="gray" variant="light">Bozza</Badge>}
          <Button size="xs" variant="subtle" color="dark" onClick={() => void compare(revision.id)}>{openDiff === revision.id ? "Nascondi" : "Confronta"}</Button>
          <Button size="xs" variant="default" disabled={revision.isDraft} onClick={() => void restore(revision.id)}>Ripristina</Button>
        </Group>
      </div>
      {openDiff === revision.id && <RevisionDiff changes={changes} />}
    </div>)}</Stack>
  </Drawer>;
}
function RevisionDiff({ changes }: { changes: FieldChange[] | null }) {
  if (!changes) return <Text size="xs" c="dimmed" className="revision-diff-empty">Carico il confronto…</Text>;
  if (!changes.length) return <Text size="xs" c="dimmed" className="revision-diff-empty">Nessuna differenza con la versione che stai modificando.</Text>;
  return <dl className="revision-diff">{changes.map((change) => <div key={change.field}>
    <dt>{change.label}</dt>
    <dd><span className="diff-before">{change.before}</span><IconArrowRight className="diff-arrow" size={14} stroke={1.7} aria-hidden="true" /><span className="diff-after">{change.after}</span></dd>
  </div>)}</dl>;
}

function UserManagement({ users, currentEmail, onChanged }: { users: AdminUser[]; currentEmail: string; onChanged: () => Promise<void> }) { const form = useForm({ mode: "controlled", initialValues: { email: "", role: "editor" as "admin" | "editor" }, validate: { email: (value) => /^\S+@\S+\.\S+$/.test(value) ? null : "Email non valida" } }); const [saving, setSaving] = useState(false); const save = async (email: string, role: "admin" | "editor", active: boolean) => { setSaving(true); try { await adminApi.saveUser(email, role, active); await onChanged(); form.reset(); } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Accesso non aggiornato" }); } finally { setSaving(false); } }; return <Stack gap="xl"><Text c="dimmed" size="sm">Il ruolo qui controlla il CMS. L’email deve restare anche nell’allow-list Cloudflare Access.</Text><form onSubmit={form.onSubmit(({ email, role }) => void save(email, role, true))}><Stack><TextInput label="Email" maxLength={254} {...form.getInputProps("email")} /><Select label="Ruolo CMS" data={["editor", "admin"]} {...form.getInputProps("role")} /><Button type="submit" color="orange" loading={saving}>Salva accesso</Button></Stack></form><Stack gap={0}>{users.map((user) => { const isSelf = user.email.trim().toLowerCase() === currentEmail.trim().toLowerCase(); return <div className="access-row" key={user.email}><div><Text fw={600}>{user.email}{isSelf && <Badge ml={8} size="xs" variant="light">Tu</Badge>}</Text><Text size="xs" c="dimmed">{isSelf ? "Il tuo accesso: modificalo da un altro amministratore." : user.active ? user.role : "Disattivato"}</Text></div><Group><Select aria-label={`Ruolo di ${user.email}`} size="xs" disabled={isSelf} data={["editor", "admin"]} value={user.role} onChange={(next) => void save(user.email, (next ?? "editor") as "admin" | "editor", user.active)} /><Button size="xs" variant="subtle" disabled={isSelf} color={user.active ? "red" : "teal"} onClick={() => void save(user.email, user.role, !user.active)}>{user.active ? "Disattiva" : "Riattiva"}</Button></Group></div>; })}</Stack></Stack>; }

function RichTextList({ label, values, onChange, maxLength = 600 }: { label: string; values: RichText[]; onChange: (values: RichText[]) => void; maxLength?: number }) { return <section className="rich-list"><Text fw={700} size="sm">{label}</Text>{values.map((value, index) => <div className="paragraph-edit" key={index}><RichTextField label={`Paragrafo ${index + 1}`} maxLength={maxLength} value={value} onChange={(next) => onChange(values.map((paragraph, itemIndex) => itemIndex === index ? next : paragraph))} />{values.length > 1 && <Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => { if (plainText(value).trim() && !window.confirm(`Eliminare il paragrafo ${index + 1}? Il testo va perso.`)) return; onChange(values.filter((_, itemIndex) => itemIndex !== index)); }}>Rimuovi paragrafo</Button>}</div>)}<Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} onClick={() => onChange([...values, asRichText("")])}>Aggiungi paragrafo</Button></section>; }
const blockLabels: Record<ProjectBlock["type"], string> = { paragraph: "Testo", quote: "Citazione", list: "Elenco", image: "Immagine", stat: "Dato" };
/** Riassunto mostrato quando il blocco è chiuso: deve bastare per riconoscerlo senza riaprirlo. */
function blockSummary(block: ProjectBlock): string {
  if (block.type === "paragraph" || block.type === "quote") return plainText(block.text).trim() || "Testo da scrivere";
  if (block.type === "list") return [block.title.trim(), block.items.length ? `${block.items.length} ${block.items.length === 1 ? "voce" : "voci"}` : "nessuna voce"].filter(Boolean).join(" · ");
  if (block.type === "image") return block.caption?.trim() || block.alt.trim() || "Immagine da scegliere";
  return [block.value.trim(), block.label.trim()].filter(Boolean).join(" ") || "Dato da compilare";
}

function BlocksEditor({ blocks, onChange, incompleti = [] }: { blocks: ProjectBlock[]; onChange: (blocks: ProjectBlock[]) => void; incompleti?: number[] }) {
  const [closed, setClosed] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);

  const update = (index: number, next: ProjectBlock) => onChange(blocks.map((block, itemIndex) => itemIndex === index ? next : block));
  const reorder = (from: number, to: number) => { if (from === to || to < 0 || to >= blocks.length) return; const next = [...blocks]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); onChange(next); };
  const move = (index: number, direction: -1 | 1) => reorder(index, index + direction);
  const remove = (index: number, type: ProjectBlock["type"]) => { if (!window.confirm(`Eliminare il blocco ${index + 1} (${blockLabels[type].toLowerCase()})? Il contenuto va perso.`)) return; onChange(blocks.filter((_, itemIndex) => itemIndex !== index)); };
  const add = (type: ProjectBlock["type"]) => {
    const id = crypto.randomUUID();
    const block: ProjectBlock = type === "paragraph" ? { id, type, text: asRichText("") } : type === "quote" ? { id, type, text: asRichText("") } : type === "list" ? { id, type, title: "", items: [] } : type === "image" ? { id, type, src: "", alt: "" } : { id, type, value: "", label: "" };
    setClosed((current) => current.filter((closedId) => closedId !== id));
    onChange([...blocks, block]);
  };
  const toggle = (id: string) => setClosed((current) => current.includes(id) ? current.filter((closedId) => closedId !== id) : [...current, id]);
  const allClosed = blocks.length > 0 && closed.length >= blocks.length;

  // un blocco segnalato ma chiuso nasconderebbe il proprio errore: si apre e si mostra
  useEffect(() => {
    if (!incompleti.length) return;
    const daAprire = incompleti.map((posizione) => blocks[posizione - 1]?.id).filter(Boolean) as string[];
    setClosed((current) => current.filter((id) => !daAprire.includes(id)));
    const attesa = window.setTimeout(() => document.querySelector(`[data-block="${incompleti[0]}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
    return () => window.clearTimeout(attesa);
  }, [incompleti]);

  return <section className="blocks">
    <Group justify="space-between">
      <Text fw={700}>Blocchi del racconto</Text>
      <Group gap="xs">
        {blocks.length > 1 && <Button variant="subtle" color="dark" size="xs" onClick={() => setClosed(allClosed ? [] : blocks.map((block) => block.id))}>{allClosed ? "Apri tutti" : "Chiudi tutti"}</Button>}
        <Menu><Menu.Target><Button variant="default" size="xs">Aggiungi blocco</Button></Menu.Target><Menu.Dropdown>{(["paragraph", "quote", "list", "image", "stat"] as const).map((type) => <Menu.Item key={type} onClick={() => add(type)}>{blockLabels[type]}</Menu.Item>)}</Menu.Dropdown></Menu>
      </Group>
    </Group>
    {blocks.map((block, index) => {
      const isClosed = closed.includes(block.id);
      return <div
        className="block-edit"
        key={block.id}
        data-block={index + 1}
        data-dragging={dragging === block.id || undefined}
        data-over={overId === block.id && dragging !== block.id || undefined}
        draggable={grabbed === block.id}
        onDragStart={(event) => { setDragging(block.id); event.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(event) => { if (dragging) { event.preventDefault(); setOverId(block.id); } }}
        onDrop={(event) => { event.preventDefault(); const from = blocks.findIndex((entry) => entry.id === dragging); if (from >= 0) reorder(from, index); setDragging(null); setOverId(null); setGrabbed(null); }}
        onDragEnd={() => { setDragging(null); setOverId(null); setGrabbed(null); }}
      >
        <div className="block-head">
          {/* Il blocco diventa trascinabile solo dalla maniglia, altrimenti si trascinerebbe selezionando il testo. */}
          <span className="block-handle" aria-hidden="true" title="Trascina per riordinare" onMouseDown={() => setGrabbed(block.id)} onMouseUp={() => setGrabbed(null)}><IconGripVertical size={16} stroke={1.6} /></span>
          <UnstyledButton className="block-toggle" aria-expanded={!isClosed} onClick={() => toggle(block.id)}>
            <Text size="xs" fw={700} tt="uppercase">{index + 1}. {blockLabels[block.type]}</Text>
            {isClosed && <Text size="sm" c="dimmed" lineClamp={1}>{blockSummary(block)}</Text>}
          </UnstyledButton>
          <Group gap={2} wrap="nowrap">
            <ActionIcon aria-label={`${isClosed ? "Apri" : "Chiudi"} il blocco ${index + 1}`} variant="subtle" color="dark" onClick={() => toggle(block.id)}>{isClosed ? <IconChevronDown size={17} stroke={1.7} /> : <IconChevronUp size={17} stroke={1.7} />}</ActionIcon>
            <ActionIcon aria-label={`Sposta il blocco ${index + 1} più in alto`} variant="subtle" color="dark" disabled={index === 0} onClick={() => move(index, -1)}><IconArrowUp size={17} stroke={1.7} /></ActionIcon>
            <ActionIcon aria-label={`Sposta il blocco ${index + 1} più in basso`} variant="subtle" color="dark" disabled={index === blocks.length - 1} onClick={() => move(index, 1)}><IconArrowDown size={17} stroke={1.7} /></ActionIcon>
            <ActionIcon aria-label={`Elimina il blocco ${index + 1}`} variant="subtle" color="red" onClick={() => remove(index, block.type)}><IconTrash size={16} stroke={1.7} /></ActionIcon>
          </Group>
        </div>
        {!isClosed && <div className="block-body">{block.type === "paragraph" && <RichTextField label="Testo" maxLength={contentLimits.project.paragraph} value={block.text} onChange={(text) => update(index, { ...block, text })} />}{block.type === "quote" && <Stack><RichTextField label="Citazione" maxLength={contentLimits.project.quote} value={block.text} onChange={(text) => update(index, { ...block, text })} /><TextInput label="Fonte" maxLength={contentLimits.project.quoteSource} value={block.source ?? ""} onChange={(event) => update(index, { ...block, source: event.currentTarget.value || undefined })} /></Stack>}{block.type === "list" && <Stack><TextInput label="Titolo elenco" maxLength={contentLimits.project.listTitle} value={block.title} onChange={(event) => update(index, { ...block, title: event.currentTarget.value })} /><RigheField label="Voci" description="Una riga per voce" maxLength={contentLimits.project.listItem * 12} minRows={3} values={block.items} onChange={(items) => update(index, { ...block, items })} /></Stack>}{block.type === "image" && <Stack><MediaPicker label="Immagine" required error={incompleti.includes(index + 1) ? "Scegli la foto: senza immagine il blocco non si può salvare." : undefined} value={{ url: block.src ?? "", alt: block.alt, assetId: block.assetId }} onChange={(next) => { const changed = next.url !== block.src || next.assetId !== block.assetId; update(index, { ...block, src: next.url, alt: next.alt, assetId: next.assetId, ...(changed ? { crop: undefined } : {}) }); }} /><ImageCropper image={block.src} value={block.crop} onChange={(crop) => update(index, { ...block, crop })} title="Ritaglio dell’immagine" description="Regola qui l’inquadratura che apparirà nel racconto." aspect={16 / 10} /><Textarea label="Didascalia" maxLength={contentLimits.project.imageCaption} autosize minRows={2} value={block.caption ?? ""} onChange={(event) => update(index, { ...block, caption: event.currentTarget.value || undefined })} /></Stack>}{block.type === "stat" && <div className="form-grid"><TextInput label="Valore" maxLength={contentLimits.project.statValue} value={block.value} onChange={(event) => update(index, { ...block, value: event.currentTarget.value })} /><TextInput label="Etichetta" maxLength={contentLimits.project.statLabel} value={block.label} onChange={(event) => update(index, { ...block, label: event.currentTarget.value })} /></div>}</div>}
      </div>;
    })}
  </section>;
}
function LinksEditor({ links, onChange }: { links: ProjectContent["links"]; onChange: (links: ProjectContent["links"]) => void }) { return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Link del progetto</Text><Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} onClick={() => onChange([...links, { label: "", href: "", kind: "website" }])}>Aggiungi link</Button></Group>{links.map((link, index) => <div className="activity-edit" key={`${link.href}-${index}`}><div className="form-grid"><TextInput label="Etichetta" maxLength={contentLimits.project.linkLabel} value={link.label} onChange={(event) => onChange(links.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.currentTarget.value } : entry))} /><TextInput label="URL" maxLength={2_000} value={link.href} onChange={(event) => onChange(links.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.currentTarget.value } : entry))} /><Select label="Tipo" data={["website", "instagram", "facebook", "materials"]} value={link.kind} onChange={(next) => onChange(links.map((entry, itemIndex) => itemIndex === index ? { ...entry, kind: (next ?? "website") as ProjectContent["links"][number]["kind"] } : entry))} /></div><Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi link</Button></div>)}</section>; }
function VideoEditor({ value, onChange }: { value: ProjectContent["video"]; onChange: (value: ProjectContent["video"]) => void }) { const video = value ?? { provider: "youtube" as const, id: "", alt: "", thumbnail: "", caption: "" }; return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Video</Text><Button variant="subtle" color={value ? "red" : "dark"} size="xs" leftSection={value ? <IconTrash size={15} stroke={1.8} /> : <IconPlus size={15} stroke={1.8} />} onClick={() => onChange(value ? undefined : video)}>{value ? "Rimuovi video" : "Aggiungi video"}</Button></Group>{value && <Stack><div className="form-grid"><Select label="Provider" data={["youtube", "vimeo"]} value={video.provider} onChange={(next) => onChange({ ...video, provider: (next ?? "youtube") as "youtube" | "vimeo" })} /><TextInput label="ID video" description="Solo ID, non URL completo" maxLength={64} value={video.id} onChange={(event) => onChange({ ...video, id: event.currentTarget.value })} /><TextInput label="Testo alternativo" maxLength={contentLimits.project.videoAlt} value={video.alt} onChange={(event) => onChange({ ...video, alt: event.currentTarget.value })} /><Textarea label="Didascalia" maxLength={contentLimits.project.videoCaption} autosize minRows={2} value={video.caption ?? ""} onChange={(event) => onChange({ ...video, caption: event.currentTarget.value || undefined })} /></div><MediaPicker label="Miniatura video" description="L’immagine su cui si clicca per far partire il video. Se non la scegli, il sito usa la copertina del progetto." value={{ url: video.thumbnail ?? "", alt: video.alt }} onChange={(next) => onChange({ ...video, thumbnail: next.url || undefined, alt: next.alt })} /></Stack>}</section>; }
function SocialLinks({ value, onChange }: { value: SiteSettingsContent["identity"]["socialLinks"]; onChange: (value: SiteSettingsContent["identity"]["socialLinks"]) => void }) { return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Social</Text><Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} onClick={() => onChange([...value, { label: "", href: "" }])}>Aggiungi social</Button></Group>{value.map((link, index) => <div className="activity-edit" key={`${link.href}-${index}`}><div className="form-grid"><TextInput label="Nome" maxLength={contentLimits.site.socialLabel} value={link.label} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.currentTarget.value } : entry))} /><TextInput label="URL" maxLength={2_000} value={link.href} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.currentTarget.value } : entry))} /></div><Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi social</Button></div>)}</section>; }
function PhoneNumbers({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) { return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Numeri di telefono</Text><Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} disabled={value.length >= 6} onClick={() => onChange([...value, ""])}>Aggiungi numero</Button></Group>{value.map((phone, index) => <div className="activity-edit" key={`${phone}-${index}`}><TextInput label={`Numero ${index + 1}`} description="Diventa un collegamento per chiamare da mobile" maxLength={contentLimits.site.phone} value={phone} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? event.currentTarget.value : entry))} /><Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi numero</Button></div>)}</section>; }
function ReviewProject({ project, missing, onFix }: { project: ProjectContent; missing: ReturnType<typeof missingProjectFields>; onFix: () => void }) {
  const pronto = missing.length === 0;
  const voci = [
    { fatto: Boolean(project.cover), testo: project.cover ? "Copertina scelta" : "Copertina mancante" },
    { fatto: plainText(project.intro).trim().length > 0, testo: plainText(project.intro).trim() ? "Frase di apertura scritta" : "Frase di apertura da scrivere" },
    { fatto: plainText(project.objective).trim().length > 0, testo: plainText(project.objective).trim() ? "Intenzione scritta" : "Intenzione da scrivere" },
    { fatto: project.blocks.length > 0, testo: project.blocks.length ? `${project.blocks.length} blocchi di racconto` : "Nessun blocco: la pagina resta scarna" },
  ];
  return <div className="review-project">
    <Text className="eyebrow">Riepilogo</Text>
    <h2>{project.title || "Progetto senza titolo"}</h2>
    <Text c="dimmed">{project.subtitle || "Manca il sottotitolo."}</Text>
    <ul className="review-checklist">
      {voci.map((voce) => <li key={voce.testo} data-done={voce.fatto || undefined}><span aria-hidden="true">{voce.fatto ? "✓" : "○"}</span>{voce.testo}</li>)}
    </ul>
    {pronto
      ? <Text size="sm" c="teal">Tutto quello che serve c’è: puoi creare il progetto. Il resto — diario, reti, invito finale — si aggiunge dopo.</Text>
      : <div className="review-missing">
          <Text size="sm" c="orange">Manca ancora: {missing.map((requirement) => requirement.label.toLowerCase()).join(", ")}.</Text>
          <Button variant="default" size="xs" onClick={onFix}>Portami al primo campo</Button>
        </div>}
  </div>;
}
/** Le anteprime disegnano i componenti veri del sito: se cambia la pagina pubblica, cambia anche qui. */
function ProjectPreview({ project, site, catalogo, height, focus }: { project: ProjectContent; site: SiteSettingsContent; catalogo: ProjectContent[]; height?: number; focus?: string }) {
  const legacy = projectToLegacy(project);
  // «Altri progetti» mostra i progetti veri del back office, come farà la pagina pubblicata
  const correlati = getRelatedProjects(legacy, catalogo.map(projectToLegacy));
  return <PreviewFrame height={height} focus={focus}><PublicPageShell site={site} currentPage="projects"><ProjectDetail project={legacy} related={correlati} /></PublicPageShell></PreviewFrame>;
}

function TeamPreview({ member, height, index, total }: { member: TeamMemberContent; height?: number; index: number; total: number }) {
  return <PreviewFrame height={height} className="preview-persona">
    <TeamProfileContent member={teamToLegacy(member)} index={index} total={total} />
  </PreviewFrame>;
}

function SitePreview({ site, height, focus }: { site: SiteSettingsContent; height?: number; focus?: string }) {
  return <PreviewFrame height={height} focus={focus}><PublicPageShell site={site} currentPage="home"><HomePage site={site} /></PublicPageShell></PreviewFrame>;
}
