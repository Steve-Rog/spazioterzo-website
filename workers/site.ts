import { createRequestHandler } from "react-router";

/**
 * Worker che serve il sito pubblico: i file statici li gestisce Cloudflare prima di arrivare qui,
 * tutto il resto passa dal renderer di React Router (le pagine hanno bisogno del server perché
 * i contenuti arrivano dall'API e i metadati devono essere già nell'HTML).
 */
const handler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

/** Gli indirizzi del sito vero. Tutto il resto è una copia di lavoro. */
const domìniPubblici = new Set(["spazioterzo.it", "www.spazioterzo.it"]);

export default {
  async fetch(request) {
    const risposta = await handler(request);

    // Il dominio di sviluppo serve gli stessi testi del sito vero: senza questo header
    // finirebbe nei motori di ricerca come un doppione, rubandogli posizioni.
    if (!domìniPubblici.has(new URL(request.url).hostname)) {
      const intestazioni = new Headers(risposta.headers);
      intestazioni.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(risposta.body, { status: risposta.status, statusText: risposta.statusText, headers: intestazioni });
    }

    return risposta;
  },
} satisfies ExportedHandler;
