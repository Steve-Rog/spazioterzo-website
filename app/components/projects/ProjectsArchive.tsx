import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { SiteHeader } from "../layout/SiteHeader";
import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { type Project } from "./content";
import type { SiteSettingsContent } from "../../../shared/content-schema";

function ProjectRow({ project, index, featured = false }: { project: Project; index: number; featured?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <Reveal className={`projects-row${featured ? " projects-row-featured" : ""} projects-row-${index}`} delay={index * 0.08} amount={0.1}>
      <Link className="projects-row-link" to={`/progetti/${project.slug}`} aria-label={`Apri il progetto ${project.title}`}>
        <motion.figure
          className="projects-row-image"
          whileHover={reduceMotion ? undefined : { scale: 1.018 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={project.cover} alt={project.coverAlt} />
          <figcaption>{project.status}</figcaption>
        </motion.figure>
        <div className="projects-row-copy">
          <p className="projects-row-meta">{project.themes[0]} <span>—</span> {project.location}</p>
          <h2>{project.title}</h2>
          <p className="projects-row-subtitle">{project.subtitle}</p>
          <span className="projects-row-action">Scopri il progetto <Arrow /></span>
        </div>
      </Link>
    </Reveal>
  );
}

export function ProjectsArchive({ projects, site }: { projects: Project[]; site: SiteSettingsContent }) {
  const reduceMotion = useReducedMotion();
  const [featured, ...remainingProjects] = projects;

  return (
    <main className="projects-page">
      <section className="projects-hero" id="top">
        <SiteHeader currentPage="projects" identity={site.identity} />
        <div className="projects-hero-visual" aria-hidden="true" />
        <div className="projects-hero-content">
          <motion.p
            className="section-label"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            03 — Progetti
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.82, delay: reduceMotion ? 0 : 0.11, ease: [0.22, 1, 0.36, 1] }}
          >
            Dove la cura<br />diventa <em>azione comune.</em>
          </motion.h1>
          <motion.p
            className="projects-hero-intro"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            Esperienze, incontri e pratiche che prendono forma con le persone e nel territorio.
          </motion.p>
        </div>
      </section>

      <section className="projects-archive" aria-label="Archivio progetti">
        <div className="projects-archive-heading">
          <p className="section-label">Progetti in corso</p>
          <p>Ogni progetto è un punto di partenza: una pratica condivisa, costruita dentro relazioni reali.</p>
        </div>
        <ProjectRow project={featured} index={0} featured />
        <div className="projects-archive-secondary">
          {remainingProjects.map((project, index) => <ProjectRow key={project.slug} project={project} index={index + 1} />)}
        </div>
      </section>
    </main>
  );
}
