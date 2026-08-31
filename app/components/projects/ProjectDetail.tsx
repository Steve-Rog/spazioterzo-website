import { useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { imageCropStyle } from "../ui/image-crop";
import { RichText } from "../ui/RichText";
import { Reveal } from "../ui/Reveal";
import { type Project, type ProjectBlock } from "./content";
import { defaultProjectOutcomesHeading } from "../../../shared/content-schema";

function ProjectBlockView({ block }: { block: ProjectBlock }) {
  if (block.type === "paragraph") return <p className="project-detail-paragraph">{block.text}</p>;
  if (block.type === "quote") {
    return <blockquote className="project-detail-quote"><p>{block.text}</p>{block.source && <cite>{block.source}</cite>}</blockquote>;
  }
  if (block.type === "list") {
    return <section className="project-detail-list"><h3>{block.title}</h3><ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
  }
  if (block.type === "image") {
    return <figure className="project-detail-image"><div className="project-detail-image-media"><img src={block.src} alt={block.alt} loading="lazy" style={imageCropStyle(block.crop)} /></div>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  }
  return <p className="project-detail-stat"><strong>{block.value}</strong><span>{block.label}</span></p>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" /></svg>;
}

function ProjectVideo({ project }: { project: Project }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const video = project.video;
  if (!video) return null;

  const source = video.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`
    : `https://player.vimeo.com/video/${video.id}?autoplay=1`;
  // senza miniatura la copertina evita il riquadro vuoto al posto del video
  const thumbnail = video.thumbnail || project.cover;

  return (
    <section className="project-video" aria-label="Video del progetto">
      {isPlaying ? (
        <iframe src={source} title={`Video: ${project.title}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setIsPlaying(true)}>
          <img src={thumbnail} alt={video.alt || project.coverAlt} loading="lazy" />
          <span><PlayIcon /> Guarda il video</span>
        </button>
      )}
      {video.caption && <p>{video.caption}</p>}
    </section>
  );
}

export function ProjectDetail({ project, related = [] }: { project: Project; related?: Project[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="project-detail-page">
      <section className="project-detail-hero" data-site-hero>
        <div className="site-header-slot" aria-hidden="true" />
        <motion.div
          className="project-detail-hero-image"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.07 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        ><img src={project.cover} alt={project.coverAlt} style={imageCropStyle(project.coverCrop)} /></motion.div>
        <div className="project-detail-hero-shade" />
        <div className="project-detail-hero-content">
          <Link className="project-back" to="/progetti">← Tutti i progetti</Link>
          <motion.p className="section-label" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.12 }}>
            {project.status}{Boolean(project.themes[0]) && <> <span>—</span> {project.themes[0]}</>}
          </motion.p>
          <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}>
            {project.title}
          </motion.h1>
          <motion.p className="project-detail-subtitle" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}>
            {project.subtitle}
          </motion.p>
        </div>
      </section>

      <section className="project-detail-overview">
        <Reveal className="project-detail-intro"><p className="section-label">Il progetto</p><h2>{project.intro}</h2></Reveal>
        <Reveal className="project-detail-facts" delay={0.1}>
          <p><span>Periodo</span>{project.dateRange}</p>
          <p><span>Luogo</span>{project.location}</p>
          <p><span>Per chi</span>{project.audience}</p>
          <p><span>Area</span>{project.themes.join(", ")}</p>
        </Reveal>
      </section>

      <section className="project-detail-story">
        <Reveal className="project-detail-objective"><p className="section-label">L’intenzione</p><p>{project.objective}</p></Reveal>
        <div className="project-detail-blocks">{project.blocks.map((block, index) => <Reveal key={`${block.type}-${index}`} delay={index * 0.04}><ProjectBlockView block={block} /></Reveal>)}</div>
      </section>

      <ProjectVideo project={project} />

      {project.outcomes.length > 0 && (
        <section className="project-outcomes">
          <Reveal><p className="section-label">Cosa abbiamo attivato</p><h2><RichText value={project.outcomesHeading ?? defaultProjectOutcomesHeading} /></h2></Reveal>
          <Reveal className="project-outcomes-list" delay={0.1}><ol>{project.outcomes.map((outcome, index) => <li key={outcome}><span>0{index + 1}</span>{outcome}</li>)}</ol></Reveal>
        </section>
      )}

      {Boolean(project.links?.length || project.partners?.length || project.funders?.length || project.visibilityNote?.trim()) && (
        <section className="project-detail-notes">
          {project.links?.length ? <div><p className="section-label">Nel diario del progetto</p>{project.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} <Arrow /></a>)}</div> : null}
          {(project.partners?.length || project.funders?.length || project.visibilityNote?.trim()) ? <div><p className="section-label">Reti e trasparenza</p>{project.partners?.length ? <p>Con {project.partners.join(", ")}.</p> : null}{project.funders?.length ? <p>Sostenuto da {project.funders.join(", ")}.</p> : null}{project.visibilityNote?.trim() ? <p>{project.visibilityNote}</p> : null}</div> : null}
        </section>
      )}

      {project.cta && project.cta.label.trim() && project.cta.href.trim() ? <section className="project-detail-cta"><p>Questo progetto può diventare anche uno spazio per te.</p><Link to={project.cta.href}>{project.cta.label} <Arrow /></Link></section> : null}

      {related.length > 0 && <section className="project-related"><p className="section-label">Altri progetti</p><div>{related.map((altro) => <Link key={altro.slug} to={`/progetti/${altro.slug}`}><div className="project-related-image"><img src={altro.cover} alt="" loading="lazy" style={imageCropStyle(altro.coverCrop)} /></div>{Boolean(altro.themes[0]) && <span>{altro.themes[0]}</span>}<h2>{altro.title}</h2><p>{altro.subtitle}</p><b>Scopri <Arrow /></b></Link>)}</div></section>}
    </main>
  );
}
