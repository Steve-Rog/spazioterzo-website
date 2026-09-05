import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Arrow } from "../ui/Arrow";
import { BrandLogo } from "../ui/BrandLogo";
import type { SiteSettingsContent } from "../../../shared/content-schema";
import { useMotoRidotto } from "../ui/use-entrata";

type SiteHeaderProps = {
  currentPage?: "home" | "people" | "projects";
  identity?: SiteSettingsContent["identity"];
};

const navigation = [
  { href: "/#chi-siamo", label: "Associazione", page: "home" },
  { href: "/#percorsi", label: "Cosa facciamo", page: "home" },
  { href: "/progetti", label: "Progetti", page: "projects" },
  { href: "/persone", label: "Le persone", page: "people" },
  { href: "/#territorio", label: "Sul territorio", page: "home" },
];

export function SiteHeader({ currentPage = "home", identity }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pinThreshold, setPinThreshold] = useState(0);
  const reduceMotion = useMotoRidotto();
  const { scrollY } = useScroll();
  useEffect(() => {
    const updatePinThreshold = () => {
      const hero = document.querySelector<HTMLElement>("[data-site-hero]");
      // Il cambio arriva dopo la hero: anche gli ultimi pixel restano parte della scena iniziale.
      const nextThreshold = hero
        ? Math.max(0, hero.getBoundingClientRect().bottom + window.scrollY)
        : 0;

      setPinThreshold(nextThreshold);
      setIsPinned(window.scrollY > nextThreshold);
    };

    updatePinThreshold();
    window.addEventListener("resize", updatePinThreshold);
    return () => window.removeEventListener("resize", updatePinThreshold);
  }, [currentPage]);

  useMotionValueEvent(scrollY, "change", (latest) => setIsPinned((current) => {
    const next = latest > pinThreshold;
    return current === next ? current : next;
  }));
  const closeMenu = () => setMenuOpen(false);
  const inverse = !isPinned || menuOpen;
  const logoTone = inverse ? "light" : "dark";

  return (
    <motion.header
        className={`site-header${isPinned ? " is-pinned" : ""}${menuOpen ? " menu-open" : ""}`}
        animate={{ backgroundColor: isPinned && !menuOpen ? "rgba(244, 241, 233, 0.96)" : "rgba(19, 43, 53, 0)", color: inverse ? "#f4f1e9" : "#132b35", boxShadow: isPinned && !menuOpen ? "0 8px 24px rgba(19, 43, 53, 0.10)" : "0 0 0 rgba(19, 43, 53, 0)" }}
        transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div key={logoTone} className="site-header-logo" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.15 }}>
            <BrandLogo href="/#top" identity={identity} tone={logoTone} />
          </motion.div>
        </AnimatePresence>
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
              aria-current={currentPage === item.page ? "page" : undefined}
              href={item.href}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
          <a href="/#contatti" onClick={closeMenu}>Contatti <Arrow /></a>
        </nav>
    </motion.header>
  );
}
