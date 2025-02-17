import {
  validateBittePluginSpec,
  type BitteExtensionSchema,
} from "bitte-ai-spec";

import { deployedUrl } from "../utils/deployed-url.ts";
import { getHostname, getSpecUrl } from "../utils/url.ts";

export async function setup(
  optionsUrl?: string,
): Promise<{ pluginId: string; xMbSpec: BitteExtensionSchema }> {
  const url = optionsUrl || deployedUrl;

  if (!url) {
    throw new Error("Deployed URL could not be determined.");
  }

  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);

  const { valid, schema, errorMessage } =
    await validateBittePluginSpec(specUrl);

  if (!valid || !schema) {
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return { pluginId, xMbSpec: schema["x-mb"] };
}
