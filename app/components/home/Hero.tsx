import { Arrow } from "../ui/Arrow";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Hero({ content }: { content: SiteSettingsContent }) {
  const imageStyle = content.home.hero.heroImage ? { "--hero-image": `url(${content.home.hero.heroImage})` } as React.CSSProperties : undefined;
  return (
    <section className="hero" id="top" style={imageStyle} data-site-hero>
      <div className="site-header-slot" aria-hidden="true" />

      <div className="hero-copy">
        <h1 className="entrance delay-1"><RichText value={content.home.hero.headline} /></h1>
      </div>

      <div className="hero-meta">
        <span>{content.home.hero.meta}</span>
        <a href="#contatti">{content.home.hero.ctaLabel} <Arrow /></a>
      </div>
      <div className="hero-grain" />
    </section>
  );
}
