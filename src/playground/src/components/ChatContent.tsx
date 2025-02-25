import { BitteAiChat, type BitteOpenAPISpec } from "@bitte-ai/chat";
import "@bitte-ai/chat/style.css";
import { type Wallet, useBitteWallet } from "@bitte-ai/react";
import React, { useEffect, useState } from "react";
import { UseSendTransactionReturnType, UseSwitchChainReturnType } from "wagmi";

import { Header } from "./Header";

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

interface ChatContentProps {
  config: AppConfig;
  address?: string;
  sendTransaction?: UseSendTransactionReturnType["sendTransaction"];
  switchChain?: UseSwitchChainReturnType["switchChain"];
  hash?: string;
}

export const ChatContent: React.FC<ChatContentProps> = ({
  config,
  address,
  sendTransaction,
  switchChain,
  hash,
}) => {
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined);
  const { selector } = useBitteWallet();

  useEffect(() => {
    const fetchWallet = async (): Promise<void> => {
      if (selector) {
        const walletInstance = await selector.wallet();
        setWallet(walletInstance);
      }
    };
    fetchWallet();
  }, [selector]);

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
            evm:
              address && sendTransaction && switchChain
                ? {
                    address,
                    sendTransaction,
                    switchChain,
                    hash,
                  }
                : undefined,
          }}
          apiUrl={config.bitteApiUrl}
          historyApiUrl="/api/history"
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
