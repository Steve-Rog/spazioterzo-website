import type { SiteSettingsContent } from "../../../shared/content-schema";

type BrandLogoProps = {
  className?: string;
  href?: string;
  identity?: SiteSettingsContent["identity"];
  tone?: "light" | "dark";
};

export function BrandLogo({ className = "", href = "#top", identity, tone = "light" }: BrandLogoProps) {
  const organizationName = identity?.organizationName || "Spazio Terzo";
  const logo = tone === "dark"
    ? identity?.logoDark || identity?.logoLight || "/assets/logo_spazioterzo.svg"
    : identity?.logoLight || identity?.logoDark || "/assets/logo_spazioterzo_negative.svg";
  return (
    <a href={href} className={`brand ${className}`.trim()} aria-label={`${organizationName}, home`}>
      <img src={logo} alt={organizationName} />
    </a>
  );
}
