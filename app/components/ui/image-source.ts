/**
 * Misure delle foto per il browser.
 *
 * L'originale caricato dalla redazione resta intatto su R2: le versioni leggere le costruisce
 * Cloudflare alla consegna (`/cdn-cgi/image/…`), una per ogni larghezza utile, nel formato che
 * il browser di chi guarda sa leggere (AVIF, WebP, altrimenti l'originale). Così una foto sola
 * serve tutti gli schermi, e cambiare qualità o formato è cambiare questi parametri — non
 * ricaricare le immagini a mano.
 *
 * Si contano le trasformazioni **uniche**, non le visite: le larghezze qui sotto sono poche
 * apposta, perché ognuna in più moltiplica il conto per il numero di foto del sito.
 */

const larghezze = [480, 768, 1024, 1440, 1920];
const qualita = 78;

/**
 * Passa dalle trasformazioni solo la roba caricata nel back office. Restano com'erano:
 * i vettoriali (un SVG non si ridimensiona), i file locali dello sviluppo e i percorsi relativi
 * dentro il sito — su `localhost` `/cdn-cgi/` non esiste e l'immagine sparirebbe dall'anteprima.
 */
const trasformabile = (url: string) => url.startsWith("https://") && !url.endsWith(".svg");

/**
 * Una singola misura. `onerror=redirect` è la rete di sicurezza: se la trasformazione non si può
 * fare, il browser riceve l'originale invece di un buco nella pagina.
 */
export function foto(url: string, larghezza: number) {
  if (!trasformabile(url)) return url;
  return `/cdn-cgi/image/width=${larghezza},format=auto,quality=${qualita},onerror=redirect/${url}`;
}

/** L'elenco delle misure disponibili: il browser sceglie da sé, guardando schermo e densità. */
export function fotoSrcSet(url: string, massimo = 1920) {
  if (!trasformabile(url)) return undefined;
  const scelte = larghezze.filter((larghezza) => larghezza <= massimo);
  return scelte.map((larghezza) => `${foto(url, larghezza)} ${larghezza}w`).join(", ");
}

/**
 * Le foto che stanno in un `background` CSS non hanno `srcset`: qui la misura è una sola,
 * scelta larga perché la fascia occupa tutta la pagina.
 */
export const fotoDiSfondo = (url: string, larghezza = 1920) => `url(${foto(url, larghezza)})`;
