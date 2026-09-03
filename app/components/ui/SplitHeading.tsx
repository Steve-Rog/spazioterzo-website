import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { durata, useEntrata } from "./use-entrata";
import type { RichText as RichTextValue, RichTextMark } from "../../../shared/content-schema";

type Parola = { testo: string; marks?: RichTextMark[]; href?: string };

const chiusa = { y: "115%", opacity: 0 };
const aperta = { y: "0%", opacity: 1 };

/**
 * Spezza il titolo in parole tenendo gli spazi fuori dalle maschere.
 *
 * Gli spazi restano testo normale: se finissero dentro un inline-block il browser
 * smetterebbe di poterci mandare a capo e i titoli lunghi uscirebbero dalla colonna.
 */
function inParole(value: RichTextValue): Parola[] {
  return value.flatMap((span) =>
    span.text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((testo) => ({ testo, marks: span.marks, href: span.href })),
  );
}

function decora(parola: Parola) {
  let contenuto: React.ReactNode = parola.testo;
  if (parola.marks?.includes("italic")) contenuto = <em>{contenuto}</em>;
  if (parola.marks?.includes("highlight")) contenuto = <mark>{contenuto}</mark>;
  if (parola.marks?.includes("link") && parola.href) contenuto = <a href={parola.href}>{contenuto}</a>;
  return contenuto;
}

type SplitHeadingProps = {
  value: RichTextValue;
  as?: "h1" | "h2";
  className?: string;
  id?: string;
  /** "subito" per il titolo già in pagina al caricamento, "inQuadro" per quelli che si raggiungono scorrendo. */
  attesa?: "subito" | "inQuadro";
  delay?: number;
};

/**
 * Titolo che sale una parola alla volta da dietro una maschera.
 *
 * Il traguardo si osserva sul titolo intero, non sulla singola parola: sotto la maschera la
 * parola è ritagliata via, e un IntersectionObserver puntato lì non la vedrebbe entrare mai.
 */
export function SplitHeading({ value, as = "h2", className, id, attesa = "inQuadro", delay = 0 }: SplitHeadingProps) {
  const elemento = useRef<HTMLHeadingElement>(null);
  const { anima, reduceMotion } = useEntrata(elemento, attesa);
  const inVista = useInView(elemento, { once: true, amount: 0.2 });
  const Tag = as;
  const subito = attesa === "subito";
  const parte = subito || inVista;

  let indice = -1;

  return (
    <Tag ref={elemento} className={className} id={id}>
      {inParole(value).map((parola, posizione) => {
        if (!parola.testo.trim()) return <span key={posizione}> </span>;
        indice += 1;
        const ritardo = reduceMotion ? 0 : delay + indice * 0.055;
        const moto = durata(parte, reduceMotion ? 0 : 0.82, ritardo);

        return (
          // Il titolo del primo schermo parte chiuso solo dopo l'idratazione: `initial` viene letto
          // alla comparsa, quindi lo si fa ricomparire cambiandogli la chiave.
          <span className="parola" key={subito ? `${posizione}-${anima}` : posizione}>
            {subito ? (
              <motion.span initial={anima ? chiusa : false} animate={aperta} transition={moto}>
                {decora(parola)}
              </motion.span>
            ) : (
              <motion.span animate={anima ? (inVista ? aperta : chiusa) : undefined} transition={moto}>
                {decora(parola)}
              </motion.span>
            )}
          </span>
        );
      })}
    </Tag>
  );
}
