import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@near-wallet-selector/modal-ui/styles.css";
import App from "./App.tsx";
import ContextProvider from "./context/index.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </StrictMode>
);
