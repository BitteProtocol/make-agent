import type {
  IJsonSchema,
  OpenAPIV3,
  OpenAPIV3_1,
} from "@scalar/openapi-types";
import { z } from "zod";
import { validate, dereference } from "@scalar/openapi-parser";

export const xMbKeySchemaZod = z.literal("x-mb");
export const xMbKey: z.infer<typeof xMbKeySchemaZod> = "x-mb";

// This is the reference schema for the "x-mb" extension.
export const extensionSchemaZod = z.object({
  type: z.literal("object"),
  title: z.string(),
  description: z.string(),
  required: z.array(z.literal("assistant")),
  properties: z.object({
    "account-id": z.object({ type: z.string(), description: z.string() }),
    email: z.object({
      type: z.string(),
      format: z.string(),
      description: z.string(),
    }),
    assistant: z.object({
      type: z.literal("object"),
      title: z.string(),
      description: z.string(),
      required: z.array(
        z.union([
          z.literal("name"),
          z.literal("description"),
          z.literal("instructions"),
        ])
      ),
      properties: z.object({
        name: z.object({ type: z.string(), description: z.string() }),
        description: z.object({ type: z.string(), description: z.string() }),
        instructions: z.object({ type: z.string(), description: z.string() }),
        image: z.object({
          type: z.string(),
          format: z.string(),
          description: z.string(),
        }),
        categories: z.object({
          type: z.string(),
          description: z.string(),
          items: z.object({ type: z.string() }),
        }),
        chainIds: z.object({
          type: z.string(),
          description: z.string(),
          items: z.object({ type: z.string() }),
        }),
        version: z.object({ type: z.string(), description: z.string() }),
        repo: z.object({
          type: z.string(),
          format: z.string(),
          description: z.string(),
        }),
        tools: z.object({
          type: z.string(),
          description: z.string(),
          items: z.object({
            type: z.string(),
            properties: z.object({
              type: z.object({
                type: z.string(),
                enum: z.array(
                  z.union([
                    z.literal("transfer-ft"),
                    z.literal("generate-transaction"),
                    z.literal("submit-query"),
                    z.literal("generate-image"),
                    z.literal("create-drop"),
                    z.literal("getSwapTransactions"),
                    z.literal("getTokenMetadata"),
                    z.literal("generate-evm-tx"),
                    z.literal("render-chart"),
                    z.literal("share-twitter"),
                    z.literal("sign-message"),
                  ])
                ),
                description: z.string(),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
});

/**
 * Zod schema for the entire OpenAPI + "x-mb" extension object.
 * This uses the above `xMbSchemaZod` as a nested property.
 */
export const openApiSchemaZod = z.object({
  openapi: z.string().describe("The OpenAPI version"),
  info: z.object({
    title: z.string().describe("The title of the API"),
    description: z.string().describe("A description of the API").optional(),
    version: z.string().describe("The version of the API"),
    license: z
      .object({
        name: z.string().describe("The name of the license"),
        url: z.string().describe("The URL of the license").optional(),
      })
      .optional(),
  }),
  paths: z.object({}).describe("The paths of the API"),
  // Use xMbKey in bracket notation to assign `xMbSchemaZod`
  [xMbKey]: extensionSchemaZod,
  servers: z
    .array(
      z.object({
        url: z.string().describe("The URL of the server"),
        description: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * The data shape for the "x-mb" extension (not the JSON schema).
 * This is how your code would *consume* the "x-mb" property at runtime.
 */
export type ExtensionSchema = IJsonSchema & z.infer<typeof extensionSchemaZod>;

/**
 * A specialized OpenAPI.Document type that *must* have "x-mb" as an extension,
 * typed as `BitteOpenApiExtension`. Only allows OpenAPI v3.0 or v3.1 specs.
 */
export type BitteOpenApiSpec =
  | OpenAPIV3.Document<{
      [xMbKey]: ExtensionSchema;
    }>
  | OpenAPIV3_1.Document<{
      [xMbKey]: ExtensionSchema;
    }>;

// JSON Schema object to be used as a $ref  //{ $ref: "https://your-domain.com/schemas/xMbExtension.json" },
export const extensionJsonSchema = {
  type: "object",
  title: "Bitte Extension Schema",
  description: "Additional metadata for the Bitte plugin extension...",
  required: ["assistant"],
  properties: {
    "account-id": {
      type: "string",
      description:
        "Specifies the NEAR blockchain account ID associated with the plugin...",
    },
    email: {
      type: "string",
      format: "email",
      description: "Specifies the email address associated with this plugin...",
    },
    assistant: {
      type: "object",
      title: "Agent Configuration",
      description: "...",
      required: ["name", "description", "instructions"],
      properties: {
        name: {
          type: "string",
          description: "The name of the agent. Example: 'Weather Agent'",
        },
        description: {
          type: "string",
          description: "A summary of the agent's functionalities",
        },
        instructions: {
          type: "string",
          description: "Instructions defining the agent's role",
        },
        image: {
          type: "string",
          format: "uri",
          description: "URL to an image representing the agent",
        },
        categories: {
          type: "array",
          description: "Tags that categorize your agent",
          items: { type: "string" },
        },
        chainIds: {
          type: "array",
          description: "Array of EVM chain IDs the agent operates on",
          items: { type: "number" },
        },
        version: {
          type: "string",
          description: "Version of the agent",
        },
        repo: {
          type: "string",
          format: "uri",
          description: "Link to the code repository for the agent",
        },
        tools: {
          type: "array",
          description: "List of tools the agent can use",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "transfer-ft",
                  "generate-transaction",
                  "submit-query",
                  "generate-image",
                  "create-drop",
                  "getSwapTransactions",
                  "getTokenMetadata",
                  "generate-evm-tx",
                  "render-chart",
                  "share-twitter",
                  "sign-message",
                ],
                description: "Provider-specific tool executable by the runtime",
              },
            },
          },
        },
      },
    },
  },
} satisfies ExtensionSchema;

export const referenceSpec: BitteOpenApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Bitte OpenAPI Agent Specification",
    description:
      "Reference spec for Bitte OpenAPI Agent Plugins and 'x-mb' extension",
    version: "1.0.0",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  paths: {},
  [xMbKey]: extensionJsonSchema,
  servers: [
    {
      url: "https://docs.bitte.ai",
      description: "Placeholder",
    },
  ],
};

// Helper type for x-mb assistant tools
const assistantToolSchema = z.object({
  type: z.enum([
    "transfer-ft",
    "generate-transaction",
    "submit-query",
    "generate-image",
    "create-drop",
    "getSwapTransactions",
    "getTokenMetadata",
    "generate-evm-tx",
    "render-chart",
    "share-twitter",
    "sign-message",
  ]),
});

// Schema for x-mb extension
export const xMbSchema = z.object({
  "account-id": z.string(),
  assistant: z.object({
    name: z.string(),
    description: z.string(),
    instructions: z.string(),
    image: z.string().optional(),
    tools: z.array(assistantToolSchema),
    categories: z.array(z.string()).optional(),
    chainIds: z.array(z.number()).optional(),
  }),
});

// compare xMbSchema and extensionSchemaZod

// validate xMbSchema against extensionSchemaZod
const xmbResult = xMbSchema.safeParse(openApiSchemaZod);
console.log(JSON.stringify(xmbResult.error, null, 2));
console.log(JSON.stringify(xmbResult.data, null, 2));
const errors = xmbResult.error;
if (errors) {
  // print the errors in a readable format (expected, received, path, message)
  console.log(errors.issues);
}

// Main validation function
export async function validateOpenApiSpec(spec: string | object) {
  try {
    // First validate basic OpenAPI structure
    const { valid, errors } = await validate(spec);

    if (!valid) {
      return {
        valid: false,
        errors: errors,
      };
    }

    // Dereference the spec
    const { schema } = await dereference(spec);

    // Check for x-mb extension
    if (!schema?.["x-mb"]) {
      return {
        valid: false,
        errors: ["Missing x-mb extension"],
      };
    }

    // Validate x-mb structure
    const xmbResult = xMbSchema.safeParse(schema["x-mb"]);

    if (!xmbResult.success) {
      return {
        valid: false,
        errors: xmbResult.error.errors,
      };
    }

    return {
      valid: true,
      schema: schema,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : JSON.stringify(error)],
    };
  }
}

const registryUrl = "https://api.bitte.ai/ai-plugins";
const registryResponse = await fetch(registryUrl);
const registry = await registryResponse.json();

// array of spec objects
const specs = registry.map((spec: string | object) => spec);


// TODO: temporary development tests.  Remove in favor of static tests
// Test function for external specs
export async function testExternalSpecs() {
  const specs = [
    "https://coingecko-ai.vercel.app/.well-known/ai-plugin.json",
    "https://near-cow-agent.vercel.app/.well-known/ai-plugin.json",
  ];

  for (const specUrl of specs) {
    console.log("\n=================================");
    console.log(`🔍 Testing spec: ${specUrl}`);
    console.log("=================================\n");

    try {
      const response = await fetch(specUrl);
      const spec = await response.json();

      const { valid, errors } = await validateOpenApiSpec(spec);

      if (valid) {
        console.log("✅ Validation successful!");
      } else {
        console.log("❌ Validation failed!");
        console.log("\nErrors found:");
        if (Array.isArray(errors)) {
          errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        } else {
          console.log("  ", errors);
        }
      }
    } catch (error) {
      console.log("❌ Error fetching or processing spec:");
      console.log("  ", error instanceof Error ? error.message : String(error));
    }
    console.log("\n");
  }
}

await testExternalSpecs();
