export type XMbSpec = {
  "account-id": string;
  assistant: {
    name: string;
    description: string;
    instructions: string;
    tools?: XMbSpecTools[];
    chainIds?: number[];
    categories?: string[];
    version?: string;
    repo?: string;
  };
  email?: string;
};

type XMbSpecTools = {
  type: string;
};

export type VerifyData = {
  accountId: string;
  email: string;
  repo: string;
  version?: string;
  categories?: string[];
  chainIds?: number[];
};

export function validateXMbSpec(xMbSpec: unknown): asserts xMbSpec is XMbSpec {
  if (!xMbSpec || typeof xMbSpec !== "object") {
    throw new Error("x-mb spec must be an object");
  }

  const spec = xMbSpec as Record<string, unknown>;

  // Validate required fields
  if (!spec["account-id"] || typeof spec["account-id"] !== "string") {
    throw new Error("x-mb spec must contain account-id as string");
  }

  if (!spec.assistant || typeof spec.assistant !== "object") {
    throw new Error("x-mb spec must contain assistant object");
  }

  const assistant = spec.assistant as Record<string, unknown>;

  // Validate required assistant fields
  const requiredStringFields = ["name", "description", "instructions"] as const;
  for (const field of requiredStringFields) {
    if (!assistant[field] || typeof assistant[field] !== "string") {
      throw new Error(`assistant must contain ${field} as string`);
    }
  }

  // Validate optional fields
  if (assistant.tools !== undefined) {
    if (!Array.isArray(assistant.tools)) {
      throw new Error("tools must be an array");
    }
    for (const tool of assistant.tools) {
      if (!tool || typeof tool !== "object") {
        throw new Error("each tool must be an object");
      }
      if (!("type" in tool) || typeof tool.type !== "string") {
        throw new Error("each tool must have a type string");
      }
    }
  }

  if (assistant.chainIds !== undefined) {
    if (
      !Array.isArray(assistant.chainIds) ||
      !assistant.chainIds.every((id) => typeof id === "number")
    ) {
      throw new Error("chainIds must be an array of numbers");
    }
  }

  if (assistant.categories !== undefined) {
    if (
      !Array.isArray(assistant.categories) ||
      !assistant.categories.every((cat) => typeof cat === "string")
    ) {
      throw new Error("categories must be an array of strings");
    }
  }

  // Validate optional string fields
  const optionalStringFields = ["version", "repo"] as const;
  for (const field of optionalStringFields) {
    if (
      assistant[field] !== undefined &&
      typeof assistant[field] !== "string"
    ) {
      throw new Error(`${field} must be a string`);
    }
  }

  if (spec.email !== undefined && typeof spec.email !== "string") {
    throw new Error("email must be a string");
  }
}
