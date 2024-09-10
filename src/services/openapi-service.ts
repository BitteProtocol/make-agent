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