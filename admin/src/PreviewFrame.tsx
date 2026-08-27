import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MemoryRouter } from "react-router";
import { MotionConfig } from "framer-motion";
import globalCss from "../../app/styles/global.css?inline";
import homeCss from "../../app/styles/home.css?inline";
import peopleCss from "../../app/styles/people.css?inline";
import projectsCss from "../../app/styles/projects.css?inline";

const fogliDelSito = [globalCss, homeCss, peopleCss, projectsCss].join("\n");

/**
 * Disegna i componenti veri del sito dentro un riquadro isolato.
 * Serve l'iframe perché i fogli di stile pubblici agiscono su selettori globali (body, h1, a…)
 * che altrimenti riscriverebbero l'aspetto del back office.
 */
export function PreviewFrame({ children, width = 1280, height = 820, className = "" }: { children: ReactNode; width?: number; height?: number; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [documento, setDocumento] = useState<Document | null>(null);

  useEffect(() => {
    const finestra = frame.current?.contentWindow;
    const doc = finestra?.document;
    if (!doc) return;
    doc.open();
    doc.write('<!doctype html><html lang="it"><head><meta charset="utf-8"></head><body><div id="anteprima"></div></body></html>');
    doc.close();
    const stile = doc.createElement("style");
    stile.textContent = `${fogliDelSito}\nbody { margin: 0; width: ${width}px; overflow-x: hidden; }`;
    doc.head.append(stile);
    setDocumento(doc);
  }, [width]);

  const radice = documento?.getElementById("anteprima");

  return <>
    <iframe ref={frame} className={`preview-frame ${className}`.trim()} title="Anteprima del sito" tabIndex={-1} style={{ width, height }} />
    {radice && createPortal(
      // niente animazioni d'ingresso: in un riquadro ridotto lascerebbero il contenuto invisibile
      <MotionConfig reducedMotion="always"><MemoryRouter>{children}</MemoryRouter></MotionConfig>,
      radice,
    )}
  </>;
}
