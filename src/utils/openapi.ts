import SwaggerParser from "@apidevtools/swagger-parser";

import {
  getXMbSpecValidationError,
  isXMbSpec,
  type XMbSpec,
} from "../config/types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

//parsing and validation done together to avoid fetching spec twice
export async function validateAndParseOpenApiSpec(
  url: string | URL,
): Promise<XMbSpec | undefined> {
  try {
    const specUrl = url.toString();
    const specContent = await fetchWithRetry(specUrl);

    let apiResponse;
    try {
      apiResponse = JSON.parse(specContent);
    } catch (error: unknown) {
      console.error(
        "Failed to parse OpenAPI spec JSON:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return undefined;
    }

    try {
      await SwaggerParser.validate(apiResponse);
      console.log("OpenAPI specification is valid.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("OpenAPI validation failed:", error.message);
        if ("details" in error) {
          interface ValidationDetail {
            instancePath: string;
            message: string;
            params: Record<string, unknown>;
          }
          const details = (error as { details: ValidationDetail[] }).details;
          console.error(
            "Validation details:",
            details.map((detail) => ({
              path: detail.instancePath,
              error: detail.message,
              params: detail.params,
            })),
          );
        }
      }
      return undefined;
    }

    const xMbSpec = apiResponse["x-mb"];
    if (isXMbSpec(xMbSpec)) {
      return xMbSpec;
    }
    console.error("Invalid x-mb spec: ", getXMbSpecValidationError(xMbSpec));
    return undefined;
  } catch (error) {
    console.error(
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return undefined;
  }
}

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    JSON.parse(text);
    return text;
  } catch (error) {
    if (retries > 0) {
      console.log("Retrying...");
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}
