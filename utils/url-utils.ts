import { AI_PLUGIN_PATH } from "../config/constants";

export function getHostname(url: string): string {
  return new URL(url).hostname;
}

export function getSpecUrl(baseUrl: string): URL {
  return new URL(`${baseUrl}/${AI_PLUGIN_PATH}`);
}
