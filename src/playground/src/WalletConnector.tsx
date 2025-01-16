import { useBitteWallet } from "@mintbase-js/react";

export const NearWalletConnector = () => {
  const { isConnected, selector, connect, activeAccountId } = useBitteWallet();

  const handleSignout = async () => {
    const wallet = await selector.wallet();
    return wallet.signOut();
  };

  const handleSignIn = async () => {
    return connect();
  };

  // ... existing code ...

  if (!isConnected) {
    return (
      <button className="connect-button" onClick={handleSignIn}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div>
      <p>You are connected as {activeAccountId}</p>
      <div className="container">
        <button className="disconnect-button" onClick={handleSignout}>
          {" "}
          Disconnect{" "}
        </button>
      </div>
    </div>
  );
};
