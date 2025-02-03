import { BitteWalletContextProvider } from "@mintbase-js/react";
import Cookies from 'js-cookie';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@near-wallet-selector/modal-ui/styles.css";
import "@near-wallet-selector/modal-ui/styles.css";
import App from "./App.tsx";
import ContextProvider from "./context/index.tsx";
import "./index.css";
const BitteWalletSetup = {
  network: "mainnet",
  callbackUrl: typeof window !== "undefined" ? window.location.origin : "",
  contractAddress: "",
};

const cookies = Cookies.get("wagmi");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BitteWalletContextProvider {...BitteWalletSetup} onlyBitteWallet={true}>
      <ContextProvider cookies={cookies}>
        <App />
      </ContextProvider>
    </BitteWalletContextProvider>
  </StrictMode>
);
