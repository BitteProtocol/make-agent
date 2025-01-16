"use client";

import { BitteAiChat } from "@bitte-ai/chat";
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


const Main: React.FC = () => {
  const { selector } = useBitteWallet();
  const [wallet, setWallet] = useState<Wallet>();

  useEffect(() => {
    const fetchWallet = async () => {
      const walletInstance =  await selector.wallet();
      setWallet(walletInstance);
    };
    if (selector) fetchWallet();
  }, [selector]);

  return (
    <main>
      <Header />
      <div>
        <BitteAiChat
          options={{ agentImage: bitteAgent.image, agentName: bitteAgent.name }}
          agentid={bitteAgent.id}
          wallet={{ near: { wallet } }}
          apiUrl="/api/chat"
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
