import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function ImageStatement({ content }: { content: SiteSettingsContent }) {
  const statementRef = useRef<HTMLElement>(null);
  const [finePointer, setFinePointer] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: statementRef, offset: ["start end", "end start"] });
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], [-26, 26]), { stiffness: 82, damping: 24, mass: 0.45 });
  const imageStyle = content.home.imageStatement.image ? { "--statement-image": `url(${content.home.imageStatement.image})` } as React.CSSProperties : undefined;

  useEffect(() => {
    const query = window.matchMedia("(min-width: 721px) and (pointer: fine)");
    const updatePointer = () => setFinePointer(query.matches);
    updatePointer();
    query.addEventListener("change", updatePointer);
    return () => query.removeEventListener("change", updatePointer);
  }, []);

  return (
    <section ref={statementRef} className="image-statement" aria-label="Persone in ascolto">
      <motion.div
        className="image-statement-photo"
        style={{ ...imageStyle, ...(finePointer && !reduceMotion ? { y: imageY } : {}) }}
        initial={false}
        whileHover={finePointer && !reduceMotion ? { scale: 1.07 } : undefined}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <p className="photo-caption">{content.home.imageStatement.caption}</p>
      <span className="vertical-word">{content.home.imageStatement.verticalWord}</span>
    </section>
  );
}
