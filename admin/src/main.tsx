import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={{ primaryColor: "orange", defaultRadius: "sm", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Notifications position="bottom-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
);
