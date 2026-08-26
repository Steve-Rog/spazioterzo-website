import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import { App } from "./App";
import { adminTheme } from "./theme";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={adminTheme}>
      <Notifications position="bottom-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
);
