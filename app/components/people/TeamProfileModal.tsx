import { Modal } from "@mantine/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { teamMembers } from "./content";

type TeamProfileModalProps = {
  activeMemberIndex: number | null;
  onClose: () => void;
  onActiveMemberChange: (index: number) => void;
};

export function TeamProfileModal({ activeMemberIndex, onClose, onActiveMemberChange }: TeamProfileModalProps) {
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
      {activeMember && (
        <div className="profile-modal-shell">
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Chiudi il profilo">
            <span>Chiudi</span><b aria-hidden="true">×</b>
          </button>

          <div className="profile-modal-layout">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                className="profile-modal-photo"
                key={activeMember.image}
                initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 0 0 100%)", scale: 1.04 }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)", scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, clipPath: "inset(0 100% 0 0)", scale: .99 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.77, 0, 0.18, 1] }}
              >
                <img src={activeMember.image} alt={`Ritratto di ${activeMember.name}`} />
                <figcaption>0{selectedIndex + 1} / 03</figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="profile-modal-copy">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  className="profile-modal-profile"
                  key={activeMember.name}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="profile-modal-index">0{selectedIndex + 1} — Le persone</p>
                  <h2>{activeMember.name}</h2>
                  <p className="profile-modal-role">{activeMember.role}</p>
                  <div className="profile-modal-bio">
                    {activeMember.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  <blockquote>
                    <p>“{activeMember.quote}”</p>
                    {activeMember.quoteAuthor && <cite>— {activeMember.quoteAuthor}</cite>}
                  </blockquote>
                </motion.article>
              </AnimatePresence>

              <nav className="profile-modal-nav" aria-label="Sfoglia le persone">
                <button type="button" onClick={() => onActiveMemberChange(previousIndex)}>
                  <span>← Precedente</span>
                  {teamMembers[previousIndex].name}
                </button>
                <button type="button" onClick={() => onActiveMemberChange(nextIndex)}>
                  <span>Successiva →</span>
                  {teamMembers[nextIndex].name}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
