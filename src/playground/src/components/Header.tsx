import { EvmWalletConnector } from "./evm/EvmWalletConnector";
import { NearWalletConnector } from "./near/WalletConnector";

export const Header = (): JSX.Element => {
  return (
    <header>
      <div>
        <EvmWalletConnector />
      </div>
      <div>
        <NearWalletConnector />
      </div>
    </header>
  );
};
