import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
};

/**
 * Comparsa graduale dei blocchi mentre si scorre.
 *
 * L'effetto si accende solo dopo l'idratazione: se partisse dal server, l'HTML conterrebbe
 * `opacity: 0` e un visitatore che non riceve il JavaScript vedrebbe pagine mezze vuote,
 * con il testo presente nel sorgente ma invisibile. E si accende solo per ciò che è ancora
 * fuori schermo, altrimenti quello che si sta già leggendo sparirebbe per riapparire.
 */
export function Reveal({ children, className, delay = 0, amount = 0.2 }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const elemento = useRef<HTMLDivElement>(null);
  const [anima, setAnima] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const riquadro = elemento.current?.getBoundingClientRect();
    if (riquadro && riquadro.top < window.innerHeight) return;
    setAnima(true);
  }, [reduceMotion]);

  return (
    <motion.div
      ref={elemento}
      className={className}
      initial={anima ? { opacity: 0, y: 26 } : false}
      whileInView={anima ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
