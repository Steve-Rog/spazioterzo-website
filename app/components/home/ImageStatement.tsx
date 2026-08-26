import type { SiteSettingsContent } from "../../../shared/content-schema";

export function ImageStatement({ content }: { content: SiteSettingsContent }) {
  const imageStyle = content.home.imageStatement.image ? { "--statement-image": `url(${content.home.imageStatement.image})` } as React.CSSProperties : undefined;
  return (
    <section className="image-statement" aria-label="Persone in ascolto">
      <div className="image-statement-photo" style={imageStyle} />
      <p className="photo-caption">{content.home.imageStatement.caption}</p>
      <span className="vertical-word">{content.home.imageStatement.verticalWord}</span>
    </section>
  );
}
