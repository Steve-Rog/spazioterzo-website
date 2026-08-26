import { useState } from "react";
import { Arrow } from "../ui/Arrow";
import { BrandLogo } from "../ui/BrandLogo";

type SiteHeaderProps = {
  currentPage?: "home" | "people";
};

const navigation = [
  { href: "/#chi-siamo", label: "Associazione", page: "home" },
  { href: "/#percorsi", label: "Cosa facciamo", page: "home" },
  { href: "/persone", label: "Le persone", page: "people" },
  { href: "/#territorio", label: "Sul territorio", page: "home" },
];

export function SiteHeader({ currentPage = "home" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <BrandLogo href="/#top" />
      <button
        type="button"
        className="menu-button"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "Chiudi" : "Menu"}
      </button>
      <nav id="main-navigation" className={`site-nav ${menuOpen ? "open" : ""}`}>
        {navigation.map((item) => (
          <a
            key={item.href}
            aria-current={currentPage === "people" && item.page === "people" ? "page" : undefined}
            href={item.href}
            onClick={closeMenu}
          >
            {item.label}
          </a>
        ))}
        <a href="/#contatti" onClick={closeMenu}>Contatti <Arrow /></a>
      </nav>
    </header>
  );
}
