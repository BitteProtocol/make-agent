import os from 'os';
import { join } from 'path';

export const BASE_URL = "https://wallet.bitte.ai/api/ai-plugins";
export const CONFIG_DIR = join(os.homedir(), '.ai-agent-cli');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
export const AI_PLUGIN_PATH = ".well-known/ai-plugin.json";
export const PLAYGROUND_URL = "https://wallet.bitte.ai/smart-actions/prompt/what%20can%20you%20help%20me%20with%3F?mode=debug&agentId=";
export const SIGN_MESSAGE_PORT = 6969;
export const SIGN_MESSAGE_URL = "https://wallet.bitte.ai/sign-message";
export const SIGN_MESSAGE_SUCCESS_URL = "https://wallet.bitte.ai/success";
export const SIGN_MESSAGE = "Register Bitte Agent!"
export const BITTE_CONFIG_ENV_KEY = "BITTE_CONFIG"
export const BITTE_KEY_ENV_KEY = "BITTE_KEY"