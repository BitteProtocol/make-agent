import SwaggerParser from "@apidevtools/swagger-parser";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

//parsing and validation done together to avoid fetching spec twice
export async function validateAndParseOpenApiSpec(
  url: string | URL,
): Promise<{ isValid: boolean; accountId?: string }> {
  try {
    const specUrl = url.toString();
    const specContent = await fetchWithRetry(specUrl);

    const apiResponse = JSON.parse(specContent);
    await SwaggerParser.validate(apiResponse);
    console.log("OpenAPI specification is valid.");

    const accountId = apiResponse["x-mb"]?.["account-id"];

    return { isValid: true, accountId: accountId };
  } catch (error) {
    console.error(
      "Error in OpenAPI specification fetch, validation, or parsing:",
      error,
    );
    return { isValid: false };
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
