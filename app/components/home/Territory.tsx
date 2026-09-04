import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { SplitHeading } from "../ui/SplitHeading";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

function TerritoryOrbit() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: orbitRef, offset: ["start end", "end start"] });
  const spring = { stiffness: 88, damping: 25, mass: 0.42 };

  // Ogni elemento percorre un arco reale del proprio anello: non è una traslazione libera,
  // quindi il rapporto individuo → gruppo → comunità rimane leggibile durante lo scroll.
  const communityAngle = useSpring(useTransform(scrollYProgress, [0, 1], [-76, 86]), spring);
  const groupAngle = useSpring(useTransform(scrollYProgress, [0, 1], [36, 194]), spring);
  const satelliteAngle = useSpring(useTransform(scrollYProgress, [0, 1], [-140, 135]), spring);
  const communityCounterAngle = useSpring(useTransform(scrollYProgress, [0, 1], [76, -86]), spring);
  const groupCounterAngle = useSpring(useTransform(scrollYProgress, [0, 1], [-36, -194]), spring);

  return (
    <motion.div ref={orbitRef} className="territory-orbit" role="img" aria-label="Individuo, gruppo e comunità: tre cerchi concentrici della cura">
      <motion.span className="territory-orbit-track territory-orbit-community-track" aria-hidden="true" style={{ rotate: reduceMotion ? -76 : communityAngle }}>
        <motion.span className="territory-orbit-label territory-orbit-community" style={{ rotate: reduceMotion ? 76 : communityCounterAngle }}>Comunità</motion.span>
      </motion.span>
      <motion.span className="territory-orbit-track territory-orbit-group-track" aria-hidden="true" style={{ rotate: reduceMotion ? 36 : groupAngle }}>
        <motion.span className="territory-orbit-label territory-orbit-group" style={{ rotate: reduceMotion ? -36 : groupCounterAngle }}>Gruppo</motion.span>
      </motion.span>
      <motion.span className="territory-orbit-satellite" aria-hidden="true" style={{ rotate: reduceMotion ? -140 : satelliteAngle }} />
      <span className="territory-orbit-individual" aria-hidden="true">Individuo</span>
    </motion.div>
  );
}

export function Territory({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="territory" id="territorio">
      <TerritoryOrbit />
      <div className="territory-copy">
        <Reveal><SectionLabel>Sul territorio</SectionLabel></Reveal>
        <SplitHeading value={content.home.territory.heading} />
        <Reveal delay={0.16}>
          <p><RichText value={content.home.territory.body} /></p>
          <a className="button-dark" href={content.home.territory.ctaHref}>{content.home.territory.ctaLabel} <Arrow /></a>
        </Reveal>
      </div>
    </section>
  );
}
