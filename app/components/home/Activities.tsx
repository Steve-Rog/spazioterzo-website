import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { SplitHeading } from "../ui/SplitHeading";
import { RichText } from "../ui/RichText";
import { durata, useEntrata } from "../ui/use-entrata";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Activities({ content }: { content: SiteSettingsContent }) {
  const [activeActivity, setActiveActivity] = useState<number | null>(null);
  const elenco = useRef<HTMLDivElement>(null);
  const { anima, reduceMotion } = useEntrata(elenco);
  // L'elenco si osserva tutto insieme: così le righe entrano a scaletta invece che una per una,
  // ciascuna al proprio traguardo, che a scorrimento lento sembrerebbe un elenco che si sfalda.
  const inVista = useInView(elenco, { once: true, amount: 0.15 });

  return (
    <section className="services" id="percorsi">
      <div className="services-heading">
        <Reveal><SectionLabel>02 — Le nostre attività</SectionLabel></Reveal>
        <SplitHeading value={content.home.activities.heading} />
      </div>
      <div className="service-list" ref={elenco}>
        {content.home.activities.items.map((activity, index) => {
          const isActive = activeActivity === index;
          const contentId = `activity-${index}`;

          return (
            <motion.div
              className={`service-row ${isActive ? "active" : ""}`}
              key={activity.id}
              animate={anima ? (inVista ? { opacity: 1, x: 0 } : { opacity: 0, x: -42 }) : undefined}
              transition={durata(inVista, reduceMotion ? 0 : 0.62, reduceMotion ? 0 : index * 0.09)}
            >
              <button
                type="button"
                className="service-trigger"
                aria-expanded={isActive}
                aria-controls={contentId}
                onClick={() => setActiveActivity(isActive ? null : index)}
              >
                <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{activity.title}</h3>
                <span className="service-toggle" aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    id={contentId}
                    className="service-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p><RichText value={activity.description} /></p>
                    <a href="#contatti">Parliamone <Arrow /></a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
