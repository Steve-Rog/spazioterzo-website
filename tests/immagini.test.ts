import { describe, expect, it } from "vitest";
import { foto, fotoDiSfondo, fotoSrcSet } from "../app/components/ui/image-source";

const remota = "https://media.spazioterzo.it/media/2026-09/foto.jpg";

describe("misure delle foto", () => {
  it("chiede a Cloudflare la larghezza giusta, nel formato che il browser capisce", () => {
    expect(foto(remota, 768)).toBe(`/cdn-cgi/image/width=768,format=auto,quality=78,onerror=redirect/${remota}`);
  });

  it("offre più larghezze, così il telefono non scarica la versione da desktop", () => {
    const scelte = fotoSrcSet(remota)!.split(", ");
    expect(scelte).toHaveLength(5);
    expect(scelte[0]).toContain("width=480");
    expect(scelte[0]).toMatch(/ 480w$/);
    expect(scelte.at(-1)).toMatch(/ 1920w$/);
  });

  it("non propone misure più grandi dello spazio che l'immagine occupa", () => {
    expect(fotoSrcSet(remota, 1024)!.split(", ")).toHaveLength(3);
  });

  it("lascia stare quello che non si può trasformare", () => {
    // un vettoriale non si ridimensiona, e su localhost /cdn-cgi/ non esiste: l'anteprima
    // del back office resterebbe senza immagini
    expect(foto("/assets/logo_spazioterzo.svg", 768)).toBe("/assets/logo_spazioterzo.svg");
    expect(foto("http://localhost:8787/media/foto.jpg", 768)).toBe("http://localhost:8787/media/foto.jpg");
    expect(fotoSrcSet("https://media.spazioterzo.it/logo.svg")).toBeUndefined();
  });

  it("se la trasformazione non si può fare, si torna all'originale invece di lasciare un buco", () => {
    expect(foto(remota, 768)).toContain("onerror=redirect");
  });

  it("le foto di sfondo escono già dentro url()", () => {
    expect(fotoDiSfondo(remota)).toBe(`url(/cdn-cgi/image/width=1920,format=auto,quality=78,onerror=redirect/${remota})`);
  });
});
