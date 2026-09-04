import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { durata, useEntrata } from "./use-entrata";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
};

/**
 * Comparsa graduale dei blocchi mentre si scorre.
 *
 * L'effetto si accende solo dopo l'idratazione e solo per ciò che è ancora fuori schermo:
 * le due condizioni stanno in useEntrata, insieme alle ragioni.
 */
export function Reveal({ children, className, delay = 0, amount = 0.2 }: RevealProps) {
  const elemento = useRef<HTMLDivElement>(null);
  const { anima, reduceMotion } = useEntrata(elemento);
  const inVista = useInView(elemento, { once: true, amount });

  return (
    <motion.div
      ref={elemento}
      className={className}
      animate={anima ? (inVista ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }) : undefined}
      transition={durata(inVista, reduceMotion ? 0 : 0.7, reduceMotion ? 0 : delay)}
    >
      {children}
    </motion.div>
  );
}
