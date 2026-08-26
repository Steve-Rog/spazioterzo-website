import { Arrow } from "../ui/Arrow";
import { SiteHeader } from "../layout/SiteHeader";

export function Hero() {
  return (
    <section className="hero" id="top">
      <SiteHeader />

      <div className="hero-copy">
        <h1 className="entrance delay-1">Lo spazio condiviso diventa<br /><em> cura.</em></h1>
      </div>

      <div className="hero-meta">
        <span>Catania · dal 2014</span>
        <a href="#contatti">Scrivici <Arrow /></a>
      </div>
      <div className="hero-grain" />
    </section>
  );
}
