import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { SplitHeading } from "../ui/SplitHeading";
import { useEntrata } from "../ui/use-entrata";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Hero({ content }: { content: SiteSettingsContent }) {
  const heroRef = useRef<HTMLElement>(null);
  const [enableDepth, setEnableDepth] = useState(false);
  // Il primo schermo è già in pagina al caricamento: la sua entrata non aspetta lo scorrimento.
  const { anima, reduceMotion } = useEntrata(heroRef, "subito");
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const depthSpring = { stiffness: 80, damping: 26, mass: 0.45 };
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 96]), depthSpring);
  // Il manifesto sale più in fretta dell'immagine: è lo scarto fra i due a far leggere la profondità.
  const copyY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -132]), depthSpring);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const imageStyle = content.home.hero.heroImage ? { "--hero-image": `url(${content.home.hero.heroImage})` } as React.CSSProperties : undefined;

  useEffect(() => {
    const query = window.matchMedia("(min-width: 721px) and (pointer: fine)");
    const updateDepth = () => setEnableDepth(query.matches);
    updateDepth();
    query.addEventListener("change", updateDepth);
    return () => query.removeEventListener("change", updateDepth);
  }, []);

  const depth = enableDepth && !reduceMotion;

  return (
    <section ref={heroRef} className="hero" id="top" style={imageStyle} data-site-hero>
      <motion.div
        className="hero-image"
        aria-hidden="true"
        style={depth ? { y: imageY } : undefined}
        animate={depth ? { scale: [1.03, 1.075, 1.03] } : undefined}
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
      />
      <div className="site-header-slot" aria-hidden="true" />

      <motion.div className="hero-copy" style={depth ? { y: copyY, opacity: copyOpacity } : undefined}>
        <SplitHeading as="h1" value={content.home.hero.headline} attesa="subito" delay={0.12} />
      </motion.div>

      <motion.div
        className="hero-meta"
        // framer legge `initial` solo alla comparsa: la chiave fa ricomparire la riga
        // quando l'idratazione concede l'entrata.
        key={anima ? "anima" : "fermo"}
        initial={anima ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.62, delay: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>{content.home.hero.meta}</span>
        <a href="#contatti">{content.home.hero.ctaLabel} <Arrow /></a>
      </motion.div>
      <div className="hero-grain" />
    </section>
  );
}
