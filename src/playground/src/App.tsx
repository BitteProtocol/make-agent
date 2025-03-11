"use client";

import { BitteAiChat, type BitteOpenAPISpec } from "@bitte-ai/chat";
import "@bitte-ai/chat/style.css";
import { type Wallet, useBitteWallet } from "@bitte-ai/react";
import { useEffect, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";

import { Header } from "./components/Header";
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
};

const Main: React.FC = (): JSX.Element => {
  const { selector } = useBitteWallet();
  const [wallet, setWallet] = useState<Wallet>();
  const [config, setConfig] = useState<AppConfig>();

  const { address } = useAccount();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { switchChain } = useSwitchChain();

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

  useEffect(() => {
    const fetchWallet = async (): Promise<void> => {
      const walletInstance = await selector.wallet();
      setWallet(walletInstance);
    };
    if (selector) fetchWallet();
  }, [selector]);

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <Header />
      <div id="ai-chat">
        <BitteAiChat
          options={{
            agentImage: "/bitte.svg",
            agentName: config.localAgent.spec["x-mb"]?.assistant?.name,
            localAgent: config.localAgent,
          }}
          agentId={config.localAgent.pluginId}
          wallet={{
            near: { wallet },
            evm: {
              sendTransaction,
              switchChain,
              address,
              hash,
            },
          }}
          apiUrl={config.bitteApiUrl}
          historyApiUrl="/api/history"
          apiKey={config.bitteApiKey}
        />
      </div>
    </main>
  );
};

export default Main;
