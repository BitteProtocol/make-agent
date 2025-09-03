import { AI_PLUGIN_PATH } from "../config/constants";

export function getHostname(url: string): string {
  return new URL(url).hostname;
}

export function getSpecUrl(baseUrl: string): URL {
  // Removes trailing slash from baseUrl:
  const normalised = new URL(baseUrl);
  return new URL(`${normalised.origin}/${AI_PLUGIN_PATH}`);
}
