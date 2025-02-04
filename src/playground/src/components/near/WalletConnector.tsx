import { useBitteWallet } from "@mintbase-js/react";

export const NearWalletConnector = (): JSX.Element => {
  const { isConnected, selector, connect, activeAccountId } = useBitteWallet();

  const handleSignout = async (): Promise<void> => {
    const wallet = await selector.wallet();
    return wallet.signOut();
  };

  const handleSignIn = async (): Promise<void> => {
    return connect();
  };

  if (!isConnected) {
    return (
      <button className="connect-button" onClick={handleSignIn}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="connected-wallet-container">
      <p>{activeAccountId}</p>
      <button className="connect-button" onClick={handleSignout}>
        Disconnect
      </button>
    </div>
  );
};
