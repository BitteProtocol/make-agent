export type XMbSpec = {
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
  "account-id"?: string;
};

// TODO(bh2smith): Should this be an enum? Or union of all supported tools?
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

type ValidationResult = { valid: true } | { valid: false; error: string };

function validateXMbSpecHelper(xMbSpec: unknown): ValidationResult {
  if (!xMbSpec || typeof xMbSpec !== "object") {
    return { valid: false, error: "x-mb spec must be an object" };
  }

  const spec = xMbSpec as Record<string, unknown>;

  // Validate required fields
  if (!spec.assistant || typeof spec.assistant !== "object") {
    return { valid: false, error: "x-mb spec must contain assistant object" };
  }

  const assistant = spec.assistant as Record<string, unknown>;

  // Validate required assistant fields
  const requiredStringFields = ["name", "description", "instructions"] as const;
  for (const field of requiredStringFields) {
    if (!assistant[field] || typeof assistant[field] !== "string") {
      return {
        valid: false,
        error: `assistant must contain ${field} as string`,
      };
    }
  }

  // Validate optional fields
  if (assistant.tools !== undefined) {
    if (!Array.isArray(assistant.tools)) {
      return { valid: false, error: "tools must be an array" };
    }
    for (const tool of assistant.tools) {
      if (!tool || typeof tool !== "object") {
        return { valid: false, error: "each tool must be an object" };
      }
      if (!("type" in tool) || typeof tool.type !== "string") {
        return { valid: false, error: "each tool must have a type string" };
      }
    }
  }

  if (assistant.chainIds !== undefined) {
    if (
      !Array.isArray(assistant.chainIds) ||
      !assistant.chainIds.every((id) => typeof id === "number")
    ) {
      return { valid: false, error: "chainIds must be an array of numbers" };
    }
  }

  if (assistant.categories !== undefined) {
    if (
      !Array.isArray(assistant.categories) ||
      !assistant.categories.every((cat) => typeof cat === "string")
    ) {
      return { valid: false, error: "categories must be an array of strings" };
    }
  }

  // Validate optional string fields
  const optionalStringFields = ["version", "repo"] as const;
  for (const field of optionalStringFields) {
    if (
      assistant[field] !== undefined &&
      typeof assistant[field] !== "string"
    ) {
      return { valid: false, error: `${field} must be a string` };
    }
  }

  if (spec.email !== undefined && typeof spec.email !== "string") {
    return { valid: false, error: "email must be a string" };
  }

  return { valid: true };
}

// Type guard (for use in if statements)
export function isXMbSpec(xMbSpec: unknown): xMbSpec is XMbSpec {
  return validateXMbSpecHelper(xMbSpec).valid;
}

// Assertion function (for throwing errors)
export function validateXMbSpec(xMbSpec: unknown): asserts xMbSpec is XMbSpec {
  const result = validateXMbSpecHelper(xMbSpec);
  if (!result.valid) {
    throw new Error(result.error);
  }
}

// Helper function to get validation error without throwing
export function getXMbSpecValidationError(xMbSpec: unknown): string | null {
  const result = validateXMbSpecHelper(xMbSpec);
  return result.valid ? null : result.error;
}
