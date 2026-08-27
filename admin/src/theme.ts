import { ActionIcon, Button, createTheme, Menu, Modal, Drawer, Tabs } from "@mantine/core";

/**
 * Stessi caratteri del sito pubblico, ma scala e pesi da strumento di lavoro.
 * I pulsanti hanno due sole misure: "sm" per le azioni di una schermata, "xs" per quelle dentro una scheda.
 */
export const adminTheme = createTheme({
  primaryColor: "orange",
  defaultRadius: "sm",
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  fontFamilyMonospace: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: "600" },
  components: {
    Button: Button.extend({
      defaultProps: { size: "sm" },
      styles: { root: { fontWeight: 600 }, label: { letterSpacing: "-.005em" } },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: "lg", radius: "sm" },
    }),
    Tabs: Tabs.extend({
      defaultProps: { keepMounted: false },
    }),
    Menu: Menu.extend({
      defaultProps: { shadow: "md", radius: "sm", withinPortal: true },
    }),
    Modal: Modal.extend({
      defaultProps: { radius: "sm", overlayProps: { backgroundOpacity: 0.5, blur: 2 } },
    }),
    Drawer: Drawer.extend({
      defaultProps: { overlayProps: { backgroundOpacity: 0.5, blur: 2 } },
    }),
  },
});
