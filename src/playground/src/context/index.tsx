import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import {
  cookieStorage,
  cookieToInitialState,
  createConfig,
  createStorage,
  http,
  WagmiProvider,
} from "wagmi";
import {
  arbitrum,
  avalanche,
  base,
  gnosis,
  mainnet,
  mode,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import {
  coinbaseWallet,
  metaMask,
  walletConnect,
  injected,
} from "wagmi/connectors";

// Set up queryClient
const queryClient = new QueryClient();

export const walletConnectId = "bec9baf14520229bcb8871edf03d868e";

if (!walletConnectId) {
  throw new Error("Wallet Connect ID is not defined");
}

const connectors =
  typeof window !== "undefined"
    ? [
        metaMask(),
        coinbaseWallet({ appName: "Bitte AI" }),
        walletConnect({ projectId: walletConnectId }),
        injected(),
      ]
    : [];

const config = createConfig({
  chains: [
    mainnet,
    sepolia,
    arbitrum,
    base,
    polygon,
    optimism,
    gnosis,
    mode,
    avalanche,
  ],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [gnosis.id]: http(),
    [mode.id]: http(),
    [avalanche.id]: http(),
  },
  storage: createStorage({
    storage: cookieStorage,
    key: "wagmi",
  }),
});

function ContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const initialState = cookieToInitialState(config);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
