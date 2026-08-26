import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function OriginStory({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="origin-story" aria-labelledby="origin-title">
      <Reveal className="origin-intro">
        <div>
          <SectionLabel>{content.home.origin.eyebrow}</SectionLabel>
          <p className="origin-prelude"><RichText value={content.home.origin.prelude} /></p>
        </div>
        <h2 id="origin-title"><RichText value={content.home.origin.heading} /></h2>
      </Reveal>
      <div className="origin-grid">
        <Reveal className="origin-statement">
          <p><RichText value={content.home.origin.statement} /></p>
        </Reveal>
        <Reveal className="origin-identity" delay={0.14} amount={0.25}>
          <p><RichText value={content.home.origin.identity} /></p>
        </Reveal>
      </div>
    </section>
  );
}
