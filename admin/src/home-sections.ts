export type PosizioneSezione = { anchor: string; top: number };

/**
 * Sezione che si sta leggendo: l'ultima il cui bordo superiore ha superato la soglia.
 * In fondo alla pagina vince sempre l'ultima, perché non raggiunge mai la soglia da sola.
 */
export function sezioneCorrente(posizioni: PosizioneSezione[], { soglia = 150, inFondo = false }: { soglia?: number; inFondo?: boolean } = {}): string {
  if (!posizioni.length) return "";
  if (inFondo) return posizioni[posizioni.length - 1].anchor;
  let corrente = posizioni[0].anchor;
  for (const posizione of posizioni) {
    if (posizione.top <= soglia) corrente = posizione.anchor;
  }
  return corrente;
}

export const inFondoAllaPagina = (scrollY: number, altezzaFinestra: number, altezzaDocumento: number, tolleranza = 4) =>
  scrollY + altezzaFinestra >= altezzaDocumento - tolleranza;
