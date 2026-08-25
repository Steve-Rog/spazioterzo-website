type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <a href="#top" className={`brand ${className}`.trim()} aria-label="Spazio Terzo, home">
      <img src="/assets/logo_spazioterzo_negative.svg" alt="Spazio Terzo" />
    </a>
  );
}
