"use client";

import { BitteAiChat } from "@bitte-ai/chat";
import type { BitteOpenAPISpec } from "@bitte-ai/chat";
import "@bitte-ai/chat/style.css";
import { useBitteWallet } from "@mintbase-js/react";
import type { Wallet } from "@mintbase-js/react";
import { useEffect, useState } from "react";

import "./shims";
import "@bitte-ai/chat/style.css";
import { Header } from "./Header";

const bitteAgent = {
  id: "bitte-assistant",
  name: "Bitte Assistant",
  description:
    "Bitte assistant for interacting with NFTs and Fungible Tokens (FTs) on NEAR Protocol.  Users can query, mint, transfer NFTs, transfer FTs, create drops, and swap tokens.",
  verified: true,
  image: "/bitte.svg",
};

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
      <div>
        <BitteAiChat
          options={{ agentImage: bitteAgent.image, agentName: bitteAgent.name, localAgent: config.localAgent }}
          agentid={config.localAgent.pluginId}
          wallet={{ near: { wallet } }}
          apiUrl={config.bitteApiUrl}
          apiKey={config.bitteApiKey}
          colors={{
            generalBackground: "#18181A",
            messageBackground: "#0A0A0A",
            textColor: "#FAFAFA",
            buttonColor: "#000000",
            borderColor: "#334155",
          }}
        />
      </div>
    </main>
  );
};

export default Main;
