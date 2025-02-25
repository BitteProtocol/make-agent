import { BitteAiChat, type BitteOpenAPISpec } from "@bitte-ai/chat";
import "@bitte-ai/chat/style.css";
import { type Wallet } from "@bitte-ai/react";
import React from "react";

import { Header } from "./Header";
import { UseSendTransactionReturnType, UseSwitchChainReturnType } from "wagmi";

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
  wallet?: Wallet;
  address?: string;
  sendTransaction?: UseSendTransactionReturnType["sendTransaction"];
  switchChain?: UseSwitchChainReturnType["switchChain"];
  hash?: string;
}

export const ChatContent: React.FC<ChatContentProps> = ({
  config,
  wallet,
  address,
  sendTransaction,
  switchChain,
  hash,
}) => {
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
