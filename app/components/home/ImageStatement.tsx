import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useSpring, useTransform } from "framer-motion";
import { durata, useEntrata } from "../ui/use-entrata";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function ImageStatement({ content }: { content: SiteSettingsContent }) {
  const statementRef = useRef<HTMLElement>(null);
  const [finePointer, setFinePointer] = useState(false);
  const { anima, reduceMotion } = useEntrata(statementRef);
  const inVista = useInView(statementRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({ target: statementRef, offset: ["start end", "end start"] });
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], [-58, 58]), { stiffness: 82, damping: 24, mass: 0.45 });
  const imageStyle = content.home.imageStatement.image ? { "--statement-image": `url(${content.home.imageStatement.image})` } as React.CSSProperties : undefined;

  useEffect(() => {
    const query = window.matchMedia("(min-width: 721px) and (pointer: fine)");
    const updatePointer = () => setFinePointer(query.matches);
    updatePointer();
    query.addEventListener("change", updatePointer);
    return () => query.removeEventListener("change", updatePointer);
  }, []);

  return (
    // La fascia si apre dai bordi mentre entra in pagina. Senza JavaScript il ritaglio non c'è
    // affatto: `anima` resta falso e l'immagine sta già larga.
    <motion.section
      ref={statementRef}
      className="image-statement"
      aria-label="Persone in ascolto"
      animate={anima ? { clipPath: inVista ? "inset(0% 0% 0% 0%)" : "inset(16% 9% 16% 9%)" } : undefined}
      transition={durata(inVista, reduceMotion ? 0 : 1.15)}
    >
      <motion.div
        className="image-statement-photo"
        style={{ ...imageStyle, ...(finePointer && !reduceMotion ? { y: imageY } : {}) }}
        animate={anima ? { scale: inVista ? 1 : 1.22 } : undefined}
        whileHover={finePointer && !reduceMotion ? { scale: 1.07 } : undefined}
        transition={durata(inVista, reduceMotion ? 0 : 1.3)}
      />
      <p className="photo-caption">{content.home.imageStatement.caption}</p>
      <span className="vertical-word">{content.home.imageStatement.verticalWord}</span>
    </motion.section>
  );
}
