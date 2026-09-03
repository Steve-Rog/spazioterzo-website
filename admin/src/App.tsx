import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppShell, Button, Drawer, Group, Menu, NavLink, ScrollArea, Skeleton, Text, TextInput, UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { type ContentEntity, type ProjectContent, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../shared/default-site-settings";
import { adminApi, AccessoNegato, ConnessioneAssente, type AdminResource, type AdminUser } from "./api";
import { formatRoute, homeRoute, parseRoute, routeKey, sameRoute, type Route, type Section, type SitePanel } from "./routing";
import { ArchiveView } from "./components/ArchiveView";
import { ProjectEditor } from "./editors/ProjectEditor";
import { SiteEditor } from "./editors/SiteEditor";
import { TeamEditor } from "./editors/TeamEditor";
import { UserManagement } from "./components/UserManagement";

type User = { email: string; role: "admin" | "editor" };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const resourceFor = (section: Section): AdminResource => section === "projects" ? "projects" : section === "team" ? "team" : "site";

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
