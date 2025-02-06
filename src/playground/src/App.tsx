import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { InfoList } from "./components/InfoList";
import { ActionButtonList } from "./components/ActionButtonList";
import { metadata, networks, projectId, wagmiAdapter } from "./config";

import { createAppKit } from "@reown/appkit/react";
import "./App.css";

const queryClient = new QueryClient();

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: "light" as const,
  themeVariables: {
    "--w3m-accent": "#000000",
  },
};

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function App(): JSX.Element {
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [signedMsg, setSignedMsg] = useState<string>("");
  const [balance, setBalance] = useState<string>("");

  const receiveHash = (hash: `0x${string}`): void => {
    setTransactionHash(hash); // Update the state with the transaction hash
  };

  const receiveSignedMsg = (signedMsg: string): void => {
    setSignedMsg(signedMsg); // Update the state with the transaction hash
  };

  const receivebalance = (balance: string): void => {
    setBalance(balance);
  };

  return (
    <div className={"pages"}>
      <img
        src="/reown.svg"
        alt="Reown"
        style={{ width: "150px", height: "150px" }}
      />
      <h1>AppKit Wagmi React dApp Example</h1>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <appkit-button />
          <ActionButtonList
            sendHash={receiveHash}
            sendSignMsg={receiveSignedMsg}
            sendBalance={receivebalance}
          />
          <div className="advice">
            <p>
              This projectId only works on localhost. <br />
              Go to{" "}
              <a
                href="https://cloud.reown.com"
                target="_blank"
                className="link-button"
                rel="Reown Cloud"
              >
                Reown Cloud
              </a>{" "}
              to get your own.
            </p>
          </div>
          <InfoList
            hash={transactionHash}
            signedMsg={signedMsg}
            balance={balance}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;