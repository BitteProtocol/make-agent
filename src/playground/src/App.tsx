"use client";

import { type BitteOpenAPISpec } from "@bitte-ai/chat";
import { BitteWalletContextProvider } from "@bitte-ai/react";
import { useEffect, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";

import { ChatContent } from "./components/ChatContent";
import "./shims";

type AppConfig = {
  localAgent: {
    pluginId: string;
    accountId: string;
    spec: BitteOpenAPISpec;
  };
  serverStartTime: string;
  environment: string;
  bitteApiKey: string;
  bitteApiUrl: string;
  network: string;
};

// Main App component that fetches config and sets up the wallet provider
const Main: React.FC = (): JSX.Element => {
  const [config, setConfig] = useState<AppConfig>();
  const { address } = useAccount();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    };
    fetchConfig();
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  const BitteWalletSetup = {
    network: config.network,
    callbackUrl: typeof window !== "undefined" ? window.location.origin : "",
    contractAddress: "",
  };

  return (
    <BitteWalletContextProvider {...BitteWalletSetup}>
      <ChatContent
        config={config}
        address={address}
        sendTransaction={sendTransaction}
        switchChain={switchChainAsync}
        hash={hash}
      />
    </BitteWalletContextProvider>
  );
};

export default Main;
