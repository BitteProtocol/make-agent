import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

import { Modal } from "../Modal";
import { WalletOptions } from "./WalletOptions";

export const EvmWalletConnector = (): JSX.Element => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isEVMConnectModalOpen, setIsEVMConnectModalOpen] = useState(false);

  if (isConnected) {
    return (
      <div className="connected-wallet-container">
        <p className="break-all">{address}</p>
        <button className="connect-button" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        className="connect-button"
        onClick={() => setIsEVMConnectModalOpen(true)}
      >
        Connect EVM Wallet
      </button>
      <appkit-connect-button label="EVM Account" />

      <Modal
        isOpen={isEVMConnectModalOpen}
        closeModal={() => setIsEVMConnectModalOpen(false)}
      >
        <div className="font-semibold text-xl">Connect Wallet</div>

        <WalletOptions />
      </Modal>
    </>
  );
};
