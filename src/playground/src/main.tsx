import { BitteWalletContextProvider } from "@bitte-ai/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@near-wallet-selector/modal-ui/styles.css";
import App from "./App.tsx";
import ContextProvider from "./context/index.tsx";
import "./index.css";

const BitteWalletSetup = {
  network: "mainnet",
  callbackUrl: typeof window !== "undefined" ? window.location.origin : "",
  contractAddress: "",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BitteWalletContextProvider {...BitteWalletSetup} onlyBitteWallet={true}>
      <ContextProvider>
        <App />
      </ContextProvider>
    </BitteWalletContextProvider>
  </StrictMode>
);
