import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Hero({ content }: { content: SiteSettingsContent }) {
  const heroRef = useRef<HTMLElement>(null);
  const [animateEntrance, setAnimateEntrance] = useState(false);
  const [enableDepth, setEnableDepth] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 56]), { stiffness: 80, damping: 26, mass: 0.45 });
  const imageStyle = content.home.hero.heroImage ? { "--hero-image": `url(${content.home.hero.heroImage})` } as React.CSSProperties : undefined;

  // L'entrata parte solo dopo l'idratazione: senza JavaScript il manifesto resta subito leggibile.
  useEffect(() => {
    if (!reduceMotion) setAnimateEntrance(true);
  }, [reduceMotion]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 721px) and (pointer: fine)");
    const updateDepth = () => setEnableDepth(query.matches);
    updateDepth();
    query.addEventListener("change", updateDepth);
    return () => query.removeEventListener("change", updateDepth);
  }, []);

  return (
    <section ref={heroRef} className="hero" id="top" style={imageStyle} data-site-hero>
      <motion.div
        className="hero-image"
        aria-hidden="true"
        style={enableDepth && !reduceMotion ? { y: imageY } : undefined}
        animate={enableDepth && !reduceMotion ? { scale: [1.025, 1.045, 1.025] } : undefined}
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
      />
      <div className="site-header-slot" aria-hidden="true" />

      <div className="hero-copy">
        <motion.h1
          initial={animateEntrance ? { opacity: 0, y: 42 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.92, delay: reduceMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <RichText value={content.home.hero.headline} />
        </motion.h1>
      </div>

      <motion.div
        className="hero-meta"
        initial={animateEntrance ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.62, delay: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>{content.home.hero.meta}</span>
        <a href="#contatti">{content.home.hero.ctaLabel} <Arrow /></a>
      </motion.div>
      <div className="hero-grain" />
    </section>
  );
}
