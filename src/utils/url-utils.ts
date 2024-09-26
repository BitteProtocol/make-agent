import { AI_PLUGIN_PATH } from "../config/constants";
import { parseAccountId } from "../services/openapi-service";

export function getHostname(url: string): string {
    return new URL(url).hostname;
}

export function getSpecUrl(baseUrl: string): URL {
    return new URL(`${baseUrl}/${AI_PLUGIN_PATH}`);
  }
  
  export async function getAccountId(
    baseUrl: string
  ): Promise<string | undefined> {
    try {
      const specUrl = getSpecUrl(baseUrl);
      return await parseAccountId(specUrl);
    } catch (error) {
      console.error("Error getting accountId from app URL:", error);
      return undefined;
    }
  }
  