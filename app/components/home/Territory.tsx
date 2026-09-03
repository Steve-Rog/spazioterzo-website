import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

function TerritoryOrbit() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: orbitRef, offset: ["start end", "end start"] });
  const spring = { stiffness: 74, damping: 24, mass: 0.45 };

  // Un breve arco, non un loop: lo scroll fa emergere il rapporto tra individuo,
  // gruppo e comunità senza trasformare il diagramma in un effetto decorativo.
  const communityX = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [-32, 14, 42]), spring);
  const communityY = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [24, -30, 9]), spring);
  const groupX = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [38, -15, -45]), spring);
  const groupY = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [-22, 32, -15]), spring);
  const individualX = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [-12, 14, 22]), spring);
  const individualY = useSpring(useTransform(scrollYProgress, [0, 0.55, 1], [12, -15, 8]), spring);

  return (
    <motion.div ref={orbitRef} className="territory-orbit" role="img" aria-label="Individuo, gruppo e comunità: tre cerchi concentrici della cura">
      <motion.span className="territory-orbit-community" aria-hidden="true" style={reduceMotion ? undefined : { x: communityX, y: communityY }}>Comunità</motion.span>
      <motion.span className="territory-orbit-group" aria-hidden="true" style={reduceMotion ? undefined : { x: groupX, y: groupY }}>Gruppo</motion.span>
      <motion.span className="territory-orbit-individual" aria-hidden="true" style={reduceMotion ? undefined : { x: individualX, y: individualY }}>Individuo</motion.span>
    </motion.div>
  );
}

export function Territory({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="territory" id="territorio">
      <TerritoryOrbit />
      <Reveal className="territory-copy">
        <SectionLabel>Sul territorio</SectionLabel>
        <h2><RichText value={content.home.territory.heading} /></h2>
        <p><RichText value={content.home.territory.body} /></p>
        <a className="button-dark" href={content.home.territory.ctaHref}>{content.home.territory.ctaLabel} <Arrow /></a>
      </Reveal>
    </section>
  );
}
