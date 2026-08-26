import type { SiteSettingsContent } from "../../../shared/content-schema";

type BrandLogoProps = {
  className?: string;
  href?: string;
  identity?: SiteSettingsContent["identity"];
};

export function BrandLogo({ className = "", href = "#top", identity }: BrandLogoProps) {
  const organizationName = identity?.organizationName || "Spazio Terzo";
  const logo = identity?.logoLight || "/assets/logo_spazioterzo_negative.svg";
  return (
    <a href={href} className={`brand ${className}`.trim()} aria-label={`${organizationName}, home`}>
      <img src={logo} alt={organizationName} />
    </a>
  );
}
