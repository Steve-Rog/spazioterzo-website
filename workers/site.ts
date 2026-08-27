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

export default {
  fetch(request) {
    return handler(request);
  },
} satisfies ExportedHandler;
