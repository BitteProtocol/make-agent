import SwaggerParser from "@apidevtools/swagger-parser";

export async function validateOpenApiSpec(url: string | URL): Promise<boolean> {
    console.log("Validating OpenAPI specification...");

    try {
        // Validate the OpenAPI spec
        await SwaggerParser.validate(url.toString());
        console.log("OpenAPI specification is valid.");
        return true;
    } catch (error) {
        console.error("OpenAPI specification is invalid:", error);
        return false;
    }
}

export async function parseAccountId(url: string | URL): Promise<string | undefined> {
    try {
        const api = await SwaggerParser.parse(url.toString()) as { [key: string]: any };
        if ('x-mb' in api && typeof api['x-mb'] === 'object' && api['x-mb'] !== null) {
            const xMb = api['x-mb'] as Record<string, unknown>;
            if ('account-id' in xMb) {
                const accountId = xMb['account-id'];
                if (typeof accountId === 'string') {
                    return accountId;
                }
                // TODO: Add support for array of account IDs
            }
        }
        return undefined;
    } catch (error) {
        console.error("Error parsing OpenAPI specification:", error);
        return undefined;
    }
}