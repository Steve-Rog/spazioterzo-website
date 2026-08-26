type BrandLogoProps = {
  className?: string;
  href?: string;
};

export function BrandLogo({ className = "", href = "#top" }: BrandLogoProps) {
  return (
    <a href={href} className={`brand ${className}`.trim()} aria-label="Spazio Terzo, home">
      <img src="/assets/logo_spazioterzo_negative.svg" alt="Spazio Terzo" />
    </a>
  );
}
