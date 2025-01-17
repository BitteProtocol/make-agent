"use client";

import { BitteAiChat, BitteOpenAPISpec } from "@bitte-ai/chat";
import "@bitte-ai/chat/style.css";
import { useBitteWallet, Wallet } from "@mintbase-js/react";
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

declare const __APP_DATA__: {
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


const Main: React.FC = () => {
  const { selector } = useBitteWallet();
  const [wallet, setWallet] = useState<Wallet>();

  useEffect(() => {
    const fetchWallet = async () => {
      const walletInstance = await selector.wallet();
      setWallet(walletInstance);
    };
    if (selector) fetchWallet();
  }, [selector]);

  console.log('__APP_DATA__', __APP_DATA__.bitteApiKey);

  return (
    <main>
      <Header />
      <div>
        <BitteAiChat
          options={{ agentImage: bitteAgent.image, agentName: bitteAgent.name, localAgent: __APP_DATA__.localAgent }}
          agentid={__APP_DATA__.localAgent.pluginId}
          wallet={{ near: { wallet } }}
          apiUrl={__APP_DATA__.bitteApiUrl}
          key={__APP_DATA__.bitteApiKey}
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
