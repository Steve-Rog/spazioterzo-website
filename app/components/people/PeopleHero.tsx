import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { type TeamMember } from "./content";
import { TeamProfileModal } from "./TeamProfileModal";
import { foto, fotoSrcSet } from "../ui/image-source";
import { portraitCropStyle } from "./image-crop";

function teamHeroCopy(count: number) {
  if (count === 0) return { heading: "Le persone.", intro: "I profili del team saranno disponibili a breve." };
  if (count === 1) return { heading: "Uno sguardo.", intro: "Una persona, un lavoro costruito nella relazione." };
  if (count === 2) return { heading: "Due sguardi.", intro: "Due persone, un lavoro costruito nella relazione." };
  if (count === 3) return { heading: "Tre sguardi.", intro: "Tre persone, un lavoro costruito nella relazione." };
  return { heading: "Più sguardi.", intro: `${count} persone, un lavoro costruito nella relazione.` };
}

export function PeopleHero({ teamMembers }: { teamMembers: TeamMember[] }) {
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 760px)");
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  const [foregroundMemberIndex, setForegroundMemberIndex] = useState<number | null>(null);
  const openingTimer = useRef<number | null>(null);
  const focusResetTimer = useRef<number | null>(null);
  const ignoreRestoredFocus = useRef(false);
  const copy = teamHeroCopy(teamMembers.length);

  useEffect(() => () => {
    if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
    if (focusResetTimer.current !== null) window.clearTimeout(focusResetTimer.current);
  }, []);

  const foregroundOffsets = isMobile
    ? [
      { x: "3vw", y: "-2vw" },
      { x: "0vw", y: "-3vw" },
      { x: "-3vw", y: "-2vw" },
    ]
    : [
      { x: "10vw", y: "-5vw" },
      { x: "-11vw", y: "9vw" },
      { x: "-5vw", y: "-8vw" },
    ];

  const portraitRotation = [-4, 4, -2];
  // gli scarti sono pensati per tre ritratti: con più persone si riusano invece di sparire
  const offsetFor = (index: number) => foregroundOffsets[index % foregroundOffsets.length];
  const rotationFor = (index: number) => portraitRotation[index % portraitRotation.length];

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
    // Mantine restituisce il focus al ritratto che ha aperto il modal: non deve
    // essere interpretato come una nuova selezione visiva al rientro nella hero.
    ignoreRestoredFocus.current = true;
    if (focusResetTimer.current !== null) window.clearTimeout(focusResetTimer.current);
    focusResetTimer.current = window.setTimeout(() => { ignoreRestoredFocus.current = false; }, 350);
    setActiveMemberIndex(null);
    setForegroundMemberIndex(null);
  };

  const foregroundFromFocus = (index: number) => {
    if (ignoreRestoredFocus.current) return;
    setForegroundMemberIndex(index);
  };

  return (
    <section className="people-hero" id="top" data-site-hero>
      <div className="site-header-slot" aria-hidden="true" />
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
          {copy.heading}<br />
          <em>Uno spazio.</em>
        </motion.h1>
        <motion.p
          className="people-hero-intro"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {copy.intro}
        </motion.p>
      </div>

      {teamMembers.length > 0 && <div
        className="people-hero-collage"
        aria-label={teamMembers.map((member) => member.name).join(", ")}
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
            onFocus={() => foregroundFromFocus(index)}
            onBlur={() => setForegroundMemberIndex(null)}
            initial={reduceMotion ? false : { opacity: 0, y: 56, rotate: rotationFor(index) * 2 }}
            animate={{
              opacity: foregroundMemberIndex === null || foregroundMemberIndex === index ? 1 : 0.62,
              x: foregroundMemberIndex === index ? offsetFor(index).x : "0vw",
              y: foregroundMemberIndex === index ? offsetFor(index).y : "0vw",
              scale: foregroundMemberIndex === index ? (isMobile ? 1.08 : 1.3) : foregroundMemberIndex === null ? 1 : (isMobile ? 0.9 : 0.86),
              rotate: foregroundMemberIndex === index ? 0 : rotationFor(index),
              zIndex: foregroundMemberIndex === index ? 7 : index + 1,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={foto(member.image, 768)} srcSet={fotoSrcSet(member.image, 1024)} sizes="(max-width: 900px) 33vw, 25vw" alt={`Ritratto di ${member.name}`} style={portraitCropStyle(member)} />
            <span className="people-hero-portrait-caption">
              <strong>{member.name}</strong>
              <small>Apri il profilo ↗</small>
            </span>
          </motion.button>
        ))}
      </div>}

      {teamMembers.length > 0 && <p className="people-scroll-cue">Scegli un ritratto <span>↗</span></p>}
      <div className="people-hero-grain" />
      <TeamProfileModal
        teamMembers={teamMembers}
        activeMemberIndex={activeMemberIndex}
        onClose={closeProfile}
        onActiveMemberChange={setActiveMemberIndex}
      />
    </section>
  );
}
