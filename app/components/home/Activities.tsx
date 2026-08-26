import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Activities({ content }: { content: SiteSettingsContent }) {
  const [activeActivity, setActiveActivity] = useState<number | null>(null);

  return (
    <section className="services" id="percorsi">
      <Reveal className="services-heading">
        <SectionLabel>02 — Le nostre attività</SectionLabel>
        <h2><RichText value={content.home.activities.heading} /></h2>
      </Reveal>
      <div className="service-list">
        {content.home.activities.items.map((activity, index) => {
          const isActive = activeActivity === index;
          const contentId = `activity-${index}`;

          return (
            <div className={`service-row ${isActive ? "active" : ""}`} key={activity.title}>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
