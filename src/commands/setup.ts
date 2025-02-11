import type { XMbSpec } from "../config/types.ts";
import { deployedUrl } from "../utils/deployed-url.ts";
import { validateAndParseOpenApiSpec } from "../utils/openapi.ts";
import { getHostname, getSpecUrl } from "../utils/url.ts";

export async function setup(
  optionsUrl?: string,
): Promise<{ pluginId: string; xMbSpec: XMbSpec }> {
  const url = optionsUrl || deployedUrl;

  if (!url) {
    throw new Error("Deployed URL could not be determined.");
  }

  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);
  const xMbSpec = await validateAndParseOpenApiSpec(specUrl);
  if (!xMbSpec) {
    throw new Error("OpenAPI specification validation failed.");
  }
  return { pluginId, xMbSpec };
}
