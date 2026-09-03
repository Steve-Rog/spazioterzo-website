import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Decide se un blocco può animare la propria entrata.
 *
 * Vale per ogni effetto che parte da uno stato nascosto (opacità zero, parole sotto la maschera,
 * immagine ritagliata): l'HTML del server non deve mai contenerlo, altrimenti chi non riceve il
 * JavaScript resta davanti a una pagina vuota. Per questo si accende solo dopo l'idratazione.
 *
 * Con `attesa: "inQuadro"` si accende anche solo per ciò che è ancora fuori schermo: quello che
 * il visitatore sta già leggendo non deve sparire per riapparire.
 *
 * Attenzione a come si usa il risultato: framer-motion legge `initial` una volta sola, quando
 * l'elemento compare. Un `initial` che passa da `false` allo stato nascosto dopo l'idratazione
 * viene ignorato, e l'animazione non parte mai. Da qui le due strade dei consumatori: chi entra
 * scorrendo pilota `animate` con useInView, chi entra subito rimonta l'elemento con una `key`.
 */
export function useEntrata(elemento: RefObject<Element | null>, attesa: "subito" | "inQuadro" = "inQuadro") {
  const reduceMotion = useReducedMotion();
  const [anima, setAnima] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    const concedi = () => {
      if (attesa === "inQuadro") {
        const riquadro = elemento.current?.getBoundingClientRect();
        if (riquadro && riquadro.top < window.innerHeight) return;
      }
      setAnima(true);
    };

    // Con la scheda in secondo piano il browser ferma il ciclo delle animazioni: partire adesso
    // vorrebbe dire nascondere il blocco e lasciarcelo finché qualcuno non torna a guardare.
    if (document.visibilityState === "visible") {
      concedi();
      return;
    }
    const alRitorno = () => {
      if (document.visibilityState === "visible") concedi();
    };
    document.addEventListener("visibilitychange", alRitorno);
    return () => document.removeEventListener("visibilitychange", alRitorno);
  }, [elemento, attesa, reduceMotion]);

  return { anima, reduceMotion };
}

/**
 * Il passaggio allo stato nascosto avviene fuori schermo e deve essere istantaneo: animarlo
 * significherebbe far svanire il blocco proprio mentre qualcuno ci sta arrivando sopra.
 */
export const durata = (inVista: boolean, secondi: number, ritardo = 0) =>
  inVista ? { duration: secondi, delay: ritardo, ease: [0.22, 1, 0.36, 1] as const } : { duration: 0 };
