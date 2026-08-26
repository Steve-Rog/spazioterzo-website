import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { SiteHeader } from "../layout/SiteHeader";
import { teamMembers } from "./content";
import { TeamProfileModal } from "./TeamProfileModal";

export function PeopleHero() {
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 760px)");
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  const [foregroundMemberIndex, setForegroundMemberIndex] = useState<number | null>(null);
  const openingTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
  }, []);

  const foregroundOffsets = [
    { x: "10vw", y: "-5vw" },
    { x: "-11vw", y: "9vw" },
    { x: "-5vw", y: "-8vw" },
  ];

  const portraitRotation = [-4, 4, -2];

  const clearScheduledOpen = () => {
    if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
    openingTimer.current = null;
  };

  const openMember = (index: number) => {
    clearScheduledOpen();
    setForegroundMemberIndex(index);

    if (canHover || !isMobile || reduceMotion) {
      setActiveMemberIndex(index);
      return;
    }

    openingTimer.current = window.setTimeout(() => setActiveMemberIndex(index), 210);
  };

  const closeProfile = () => {
    clearScheduledOpen();
    setActiveMemberIndex(null);
    setForegroundMemberIndex(null);
  };

  return (
    <section className="people-hero" id="top">
      <SiteHeader currentPage="people" />
      <div className="people-hero-content">
        <motion.p
          className="section-label"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          04 — Le persone
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 38 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          Tre sguardi.<br />
          <em>Uno spazio.</em>
        </motion.h1>
        <motion.p
          className="people-hero-intro"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          Tre professioniste e professionisti, un lavoro costruito nella relazione.
        </motion.p>
      </div>

      <div
        className="people-hero-collage"
        aria-label="Jacopo Raniolo, Sonja Brunetto e Ylenia D’Agostino"
        onPointerLeave={() => canHover && setForegroundMemberIndex(null)}
      >
        {teamMembers.map((member, index) => (
          <motion.button
            type="button"
            className={`people-hero-portrait people-hero-portrait-${index + 1}${foregroundMemberIndex === index ? " is-foreground" : ""}`}
            key={member.name}
            onClick={() => openMember(index)}
            aria-label={`Apri il profilo di ${member.name}`}
            onPointerEnter={(event) => canHover && event.pointerType === "mouse" && setForegroundMemberIndex(index)}
            onFocus={() => setForegroundMemberIndex(index)}
            onBlur={() => setForegroundMemberIndex(null)}
            initial={reduceMotion ? false : { opacity: 0, y: 56, rotate: index === 0 ? -8 : index === 1 ? 7 : -5 }}
            animate={{
              opacity: foregroundMemberIndex === null || foregroundMemberIndex === index ? 1 : 0.62,
              x: foregroundMemberIndex === index ? foregroundOffsets[index].x : "0vw",
              y: foregroundMemberIndex === index ? foregroundOffsets[index].y : "0vw",
              scale: foregroundMemberIndex === index ? 1.3 : foregroundMemberIndex === null ? 1 : 0.86,
              rotate: foregroundMemberIndex === index ? 0 : portraitRotation[index],
              zIndex: foregroundMemberIndex === index ? 7 : index + 1,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={member.image} alt={`Ritratto di ${member.name}`} />
            <span className="people-hero-portrait-caption">
              <strong>{member.name}</strong>
              <small>Apri il profilo ↗</small>
            </span>
          </motion.button>
        ))}
      </div>

      <p className="people-scroll-cue">Scegli un ritratto <span>↗</span></p>
      <div className="people-hero-grain" />
      <TeamProfileModal
        activeMemberIndex={activeMemberIndex}
        onClose={closeProfile}
        onActiveMemberChange={setActiveMemberIndex}
      />
    </section>
  );
}
