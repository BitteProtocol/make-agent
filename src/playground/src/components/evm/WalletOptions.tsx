import { useConnect } from "wagmi";

export function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map((connector) => (
    <div
      className="wallet-option"
      key={connector.uid}
      onClick={() => connect({ connector })}
    >
      <div className="wallet-icon">
        <img
          src={
            connector.name.includes("Coinbase")
              ? "/assets/coinbase.svg"
              : connector.name.includes("MetaMask")
                ? "/assets/metamask.svg"
                : connector.name.includes("Phantom")
                  ? "/assets/phantom.svg"
                  : "/assets/evm_wallet_connector.svg"
          }
          width={60}
          height={60}
          alt={`${connector.name}-logo`}
        />
      </div>

      <p className="wallet-name">{connector.name}</p>
    </div>
  ));
}
