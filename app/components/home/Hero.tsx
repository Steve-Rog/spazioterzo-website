import { useState } from "react";
import { Arrow } from "../ui/Arrow";
import { BrandLogo } from "../ui/BrandLogo";

const navigation = [
  { href: "#chi-siamo", label: "Associazione" },
  { href: "#percorsi", label: "Cosa facciamo" },
  { href: "#territorio", label: "Sul territorio" },
];

export function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <section className="hero" id="top">
      <header className="nav-wrap">
        <BrandLogo />
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Chiudi" : "Menu"}
        </button>
        <nav id="main-navigation" className={menuOpen ? "open" : ""}>
          {navigation.map((item) => (
            <a key={item.href} onClick={closeMenu} href={item.href}>{item.label}</a>
          ))}
          <a onClick={closeMenu} href="#contatti">Contatti <Arrow /></a>
        </nav>
      </header>

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
