import type { ReactNode } from "react";
import type { SiteSettingsContent } from "../../../shared/content-schema";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type PublicPageShellProps = {
  site: SiteSettingsContent;
  currentPage: "home" | "people" | "projects";
  children: ReactNode;
};

/**
 * Cornice unica delle pagine pubbliche. Viene usata anche nell'anteprima del
 * back office: header e footer non possono quindi divergere dalla pagina vera.
 */
export function PublicPageShell({ site, currentPage, children }: PublicPageShellProps) {
  return <>
    <SiteHeader identity={site.identity} currentPage={currentPage} />
    {children}
    <SiteFooter identity={site.identity} />
  </>;
}
