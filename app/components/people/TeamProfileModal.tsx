import { Modal } from "@mantine/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TeamMember } from "./content";
import { portraitCropStyle } from "./image-crop";

type TeamProfileModalProps = {
  teamMembers: TeamMember[];
  activeMemberIndex: number | null;
  onClose: () => void;
  onActiveMemberChange: (index: number) => void;
};

export function TeamProfileModal({ teamMembers, activeMemberIndex, onClose, onActiveMemberChange }: TeamProfileModalProps) {
  const reduceMotion = useReducedMotion();
  const selectedIndex = activeMemberIndex ?? 0;
  const activeMember = activeMemberIndex === null ? null : teamMembers[selectedIndex];
  const previousIndex = (selectedIndex - 1 + teamMembers.length) % teamMembers.length;
  const nextIndex = (selectedIndex + 1) % teamMembers.length;

  return (
    <Modal
      opened={activeMember !== null}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      title={<span className="visually-hidden">Profilo di {activeMember?.name}</span>}
      classNames={{ content: "profile-modal-content", body: "profile-modal-body", header: "profile-modal-header" }}
      transitionProps={{ transition: "fade", duration: reduceMotion ? 0 : 220 }}
      overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
    >
      {activeMember && <TeamProfileContent
        member={activeMember}
        index={selectedIndex}
        total={teamMembers.length}
        previous={teamMembers[previousIndex]}
        next={teamMembers[nextIndex]}
        onClose={onClose}
        onPrevious={() => onActiveMemberChange(previousIndex)}
        onNext={() => onActiveMemberChange(nextIndex)}
      />}
    </Modal>
  );
}

type TeamProfileContentProps = {
  member: TeamMember;
  index: number;
  total: number;
  previous?: TeamMember;
  next?: TeamMember;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

/** Corpo del profilo: dentro la finestra sul sito, da solo nell'anteprima del back office. */
export function TeamProfileContent({ member, index, total, previous, next, onClose, onPrevious, onNext }: TeamProfileContentProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="profile-modal-shell">
      {onClose && (
        <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Chiudi il profilo">
          <span>Chiudi</span><b aria-hidden="true">×</b>
        </button>
      )}

      <div className="profile-modal-layout">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            className="profile-modal-photo"
            key={member.image}
            initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 0 0 100%)", scale: 1.04 }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)", scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, clipPath: "inset(0 100% 0 0)", scale: .99 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.77, 0, 0.18, 1] }}
          >
            <img src={member.image} alt={`Ritratto di ${member.name}`} style={portraitCropStyle(member)} />
            <figcaption>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</figcaption>
          </motion.figure>
        </AnimatePresence>

        <div className="profile-modal-copy">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              className="profile-modal-profile"
              key={member.name}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="profile-modal-index">0{index + 1} — Le persone</p>
              <h2>{member.name}</h2>
              <p className="profile-modal-role">{member.role}</p>
              <div className="profile-modal-bio">
                {member.bio.map((paragraph, posizione) => <p key={`${posizione}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
              </div>
              {member.quote && (
                <blockquote>
                  <p>“{member.quote}”</p>
                  {member.quoteAuthor && <cite>— {member.quoteAuthor}</cite>}
                </blockquote>
              )}
            </motion.article>
          </AnimatePresence>

          {previous && next && onPrevious && onNext && (
            <nav className="profile-modal-nav" aria-label="Sfoglia le persone">
              <button type="button" onClick={onPrevious}>
                <span>← Precedente</span>
                {previous.name}
              </button>
              <button type="button" onClick={onNext}>
                <span>Successiva →</span>
                {next.name}
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
