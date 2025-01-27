import { BitteWalletContextProvider } from "@mintbase-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";
import "@near-wallet-selector/modal-ui/styles.css";

const BitteWalletSetup = {
  network: "mainnet",
  callbackUrl: typeof window !== "undefined" ? window.location.origin : "",
  contractAddress: "",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BitteWalletContextProvider {...BitteWalletSetup} onlyBitteWallet={true}>
      <App />
    </BitteWalletContextProvider>
  </StrictMode>,
);