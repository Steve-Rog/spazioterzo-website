import { BrandLogo } from "../ui/BrandLogo";
import type { SiteSettingsContent } from "../../../shared/content-schema";

/** Chiusura comune delle pagine pubbliche: usa esclusivamente l'identità pubblicata. */
export function SiteFooter({ identity }: { identity: SiteSettingsContent["identity"] }) {
  const phones = identity.phones?.filter(Boolean) ?? (identity.phone ? [identity.phone] : []);

  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <BrandLogo className="footer-brand" identity={identity} tone="light" />
          {identity.footerTagline && <p>{identity.footerTagline}</p>}
        </div>
        <div className="site-footer-details">
          <section>
            <p className="site-footer-label">Identità</p>
            <p className="site-footer-value">{identity.legalForm}</p>
            {identity.taxId && <p className="site-footer-tax"><span>P. IVA / Cod. Fiscale</span>{identity.taxId}</p>}
          </section>
          <section>
            <p className="site-footer-label">Sede</p>
            {identity.address && (identity.mapUrl ? <a className="site-footer-value site-footer-address" href={identity.mapUrl} target="_blank" rel="noreferrer">{identity.address}<br />{identity.city} ↗</a> : <p className="site-footer-value">{identity.address}<br />{identity.city}</p>)}
          </section>
          <section>
            <p className="site-footer-label">Contatti</p>
            <a className="site-footer-value site-footer-email" href={`mailto:${identity.email}`}>{identity.email}</a>
            {phones.length > 0 && <div className="site-footer-phones">{phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>)}</div>}
          </section>
          {identity.socialLinks.length > 0 && <section>
            <p className="site-footer-label">Social</p>
            <nav className="footer-socials" aria-label="Social network">{identity.socialLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</nav>
          </section>}
        </div>
      </div>
      <div className="site-footer-bottom">
        <p>© {new Date().getFullYear()} {identity.organizationName}</p>
        <p className="site-footer-credit">Designed &amp; developed with <span aria-label="love">♥</span> by <a href="https://github.com/Steve-Rog" target="_blank" rel="noreferrer">Stefano Raniolo</a></p>
        <p>{identity.city}, {identity.country}</p>
      </div>
    </footer>
  );
}
