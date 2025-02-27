import { EvmWalletConnector } from "./evm/EvmWalletConnector";
import { NearWalletConnector } from "./near/WalletConnector";

export const Header = (): JSX.Element => {
  return (
    <header>
      <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-8">
        <EvmWalletConnector />
        <NearWalletConnector />
      </div>
    </header>
  );
};
