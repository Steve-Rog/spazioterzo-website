import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, Group, Stack, Text, TextInput, Textarea, Tooltip, UnstyledButton } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconChevronRight, IconPlus, IconTrash } from "@tabler/icons-react";
import { asRichText, contentLimits, MAX_HOME_ACTIVITIES, plainText, type ContentEntity, type SiteSettingsContent } from "../../../shared/content-schema";
import { defaultSiteSettings } from "../../../shared/default-site-settings";
import { adminApi, type AdminResource } from "../api";
import { MediaPicker } from "../MediaPicker";
import { RichTextField } from "../RichTextField";
import { SeoPreview } from "../SeoPreview";
import { siteSnippet } from "../seo";
import { inFondoAllaPagina, sezioneCorrente } from "../home-sections";
import { selettoreHome, selettoreSito } from "../preview-focus";
import { parseRoute, type SitePanel } from "../routing";
import { EditorFrame } from "../components/EditorFrame";
import { SitePreview } from "../components/PublicPreviews";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function SiteEditor({ entity, activePanel, anchor, onSaved, onPublish, onDirtyChange, onRestored }: { onRestored?: () => Promise<void>; entity?: ContentEntity<SiteSettingsContent>; activePanel: SitePanel; anchor?: string; onSaved: (entity: ContentEntity, message?: string) => Promise<void>; onPublish: (resource: AdminResource, id: string) => Promise<void>; onDirtyChange?: (dirty: boolean) => void }) {
  const form = useForm<SiteSettingsContent>({ mode: "controlled", initialValues: clone(entity?.draft ?? entity?.published ?? defaultSiteSettings) });
  const [saving, setSaving] = useState(false);
  const [sezioneHome, setSezioneHome] = useState<string | null>(anchor ?? "apertura");
  const update = (recipe: (draft: SiteSettingsContent) => void) => { const next = clone(form.values); recipe(next); form.setValues(next); };
  const save = form.onSubmit(async (values) => { setSaving(true); try { const saved = await adminApi.save("site", entity?.id, values, undefined, entity?.updatedAt); form.resetDirty(values); await onSaved(saved); } catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Bozza non salvata" }); } finally { setSaving(false); } });
  const panelTitle = activePanel === "identity" ? "Identità del sito" : activePanel === "home" ? "Home" : "SEO e condivisione";
  const previewFocus = activePanel === "home" ? selettoreHome(sezioneHome) : selettoreSito(activePanel);
  return <form onSubmit={save}><EditorFrame title={panelTitle} eyebrow="Sito" entity={entity} resource="site" onSave={() => save()} saving={saving} dirty={form.isDirty()} preview={<SitePreview site={form.values} focus={previewFocus} />} onPublish={onPublish} onDirtyChange={onDirtyChange} onRestored={onRestored}>{activePanel === "identity" ? <SiteIdentity value={form.values} update={update} /> : activePanel === "home" ? <HomeEditor value={form.values} update={update} initialAnchor={anchor} onSectionChange={setSezioneHome} /> : <SiteSeo value={form.values} update={update} />}</EditorFrame></form>;
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

function SectionHeading({ title, hint, shape }: { title: string; hint: string; shape: "hero" | "overview" | "story" | "outcomes" | "notes" | "cta" }) {
  return <div className="section-heading section-heading-mapped"><div><h2>{title}</h2><p>{hint}</p></div><span className={`page-shape page-shape-${shape}`} aria-hidden="true" /></div>;
}

function FieldCounter({ length, max }: { length: number; max: number }) {
  return <Text size="xs" ta="right" c={length > max * .9 ? "orange" : "dimmed"} aria-live="polite">{length}/{max}</Text>;
}

function SocialLinks({ value, onChange }: { value: SiteSettingsContent["identity"]["socialLinks"]; onChange: (value: SiteSettingsContent["identity"]["socialLinks"]) => void }) { return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Social</Text><Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} onClick={() => onChange([...value, { label: "", href: "" }])}>Aggiungi social</Button></Group>{value.map((link, index) => <div className="activity-edit" key={`${link.href}-${index}`}><div className="form-grid"><TextInput label="Nome" maxLength={contentLimits.site.socialLabel} value={link.label} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.currentTarget.value } : entry))} /><TextInput label="URL" maxLength={2_000} value={link.href} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.currentTarget.value } : entry))} /></div><Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi social</Button></div>)}</section>; }
function PhoneNumbers({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) { return <section className="repeatable-section"><Group justify="space-between"><Text fw={700}>Numeri di telefono</Text><Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} disabled={value.length >= 6} onClick={() => onChange([...value, ""])}>Aggiungi numero</Button></Group>{value.map((phone, index) => <div className="activity-edit" key={`${phone}-${index}`}><TextInput label={`Numero ${index + 1}`} description="Diventa un collegamento per chiamare da mobile" maxLength={contentLimits.site.phone} value={phone} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? event.currentTarget.value : entry))} /><Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Rimuovi numero</Button></div>)}</section>; }
