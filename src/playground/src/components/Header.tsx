import { useBitteWallet } from "@mintbase-js/react";
import ConnectDialog from "./ConnectDialog";
import ManageAccountsDialog from "./ManageAccountsDialog";

import { useState } from "react";
import { useAccount } from "wagmi";
export const Header = (): JSX.Element => {
  const [isConnectModalOpen, setConnectModalOpen] = useState<boolean>(false);

  const { isConnected: isNearConnected, connect } = useBitteWallet();

  const handleSignIn = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const { isConnected } = useAccount();

  return (
    <header>
      {!isConnected && !isNearConnected && (
        <ConnectDialog
          isOpen={isConnectModalOpen}
          setConnectModalOpen={setConnectModalOpen}
        />
      )}
      {(isConnected || isNearConnected) && (
        <ManageAccountsDialog
          isOpen={isConnectModalOpen}
          setConnectModalOpen={setConnectModalOpen}
          isConnected={isConnected}
          isNearConnected={isNearConnected}
          handleSignIn={handleSignIn}
        />
      )}
    </header>
  );
};
