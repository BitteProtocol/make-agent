import os from "os";
import { join } from "path";

const getWalletUrl = (isTestnet: boolean = false): string =>
  isTestnet ? "https://testnet.wallet.bitte.ai" : "https://wallet.bitte.ai";

export interface BitteUrls {
  BITTE_WALLET_URL: string;
  BASE_URL: string;
  PLAYGROUND_URL: string;
  SIGN_MESSAGE_URL: string;
  SIGN_MESSAGE_SUCCESS_URL: string;
}

export const getBitteUrls = (isTestnet: boolean = false): BitteUrls => {
  const BITTE_WALLET_URL = getWalletUrl(isTestnet);
  return {
    BITTE_WALLET_URL,
    BASE_URL: `${BITTE_WALLET_URL}/api/ai-plugins`,
    PLAYGROUND_URL: `${BITTE_WALLET_URL}/smart-actions/prompt/what%20can%20you%20help%20me%20with%3F?mode=debug&agentId=`,
    SIGN_MESSAGE_URL: `${BITTE_WALLET_URL}/sign-message`,
    SIGN_MESSAGE_SUCCESS_URL: `${BITTE_WALLET_URL}/success`,
  };
};

export const CONFIG_DIR = join(os.homedir(), ".ai-agent-cli");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");
export const AI_PLUGIN_PATH = ".well-known/ai-plugin.json";
export const SIGN_MESSAGE_PORT = 6969;
export const SIGN_MESSAGE = "Register Bitte Agent!";
export const BITTE_CONFIG_ENV_KEY = "BITTE_CONFIG";
export const BITTE_KEY_ENV_KEY = "BITTE_KEY";
