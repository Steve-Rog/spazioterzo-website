import { BrandLogo } from "../ui/BrandLogo";
import type { SiteSettingsContent } from "../../../shared/content-schema";

/** Chiusura comune delle pagine pubbliche: usa esclusivamente l'identità pubblicata. */
export function SiteFooter({ identity }: { identity: SiteSettingsContent["identity"] }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <BrandLogo className="footer-brand" identity={identity} tone="light" />
        <p>{identity.legalForm}<br />{identity.address && <>{identity.address}<br /></>}{identity.city}, {identity.country}{identity.phone && <><br /><a href={`tel:${identity.phone.replace(/\s/g, "")}`}>{identity.phone}</a></>}</p>
        {identity.socialLinks.length > 0 && <p className="footer-socials">{identity.socialLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</p>}
        <p className="footer-copyright">© {new Date().getFullYear()} {identity.organizationName}</p>
      </div>
    </footer>
  );
}
