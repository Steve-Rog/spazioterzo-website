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

/** L'apex è l'unico indirizzo pubblico: `www` viene reindirizzato qui. */
const dominioCanonico = "spazioterzo.it";
const dominiPubblici = new Set([dominioCanonico, "www.spazioterzo.it"]);

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Evita contenuti duplicati, conservando percorso e parametri di campagne/link condivisi.
    if (url.hostname === "www.spazioterzo.it") {
      url.protocol = "https:";
      url.hostname = dominioCanonico;
      return Response.redirect(url.toString(), 301);
    }

    const risposta = await handler(request);

    // Il dominio di sviluppo serve gli stessi testi del sito vero: senza questo header
    // finirebbe nei motori di ricerca come un doppione, rubandogli posizioni.
    if (!dominiPubblici.has(url.hostname)) {
      const intestazioni = new Headers(risposta.headers);
      intestazioni.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(risposta.body, { status: risposta.status, statusText: risposta.statusText, headers: intestazioni });
    }

    return risposta;
  },
} satisfies ExportedHandler;
