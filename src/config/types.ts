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

export function isXMbSpec(xMbSpec: unknown): xMbSpec is XMbSpec {
  if (!xMbSpec || typeof xMbSpec !== "object") {
    return false;
  }

  const spec = xMbSpec as Record<string, unknown>;

  // Validate required fields
  if (!spec.assistant || typeof spec.assistant !== "object") {
    return false;
  }

  const assistant = spec.assistant as Record<string, unknown>;

  // Validate required assistant fields
  const requiredStringFields = ["name", "description", "instructions"] as const;
  for (const field of requiredStringFields) {
    if (!assistant[field] || typeof assistant[field] !== "string") {
      return false;
    }
  }

  // Validate optional fields
  if (assistant.tools !== undefined) {
    if (!Array.isArray(assistant.tools)) {
      return false;
    }
    for (const tool of assistant.tools) {
      if (!tool || typeof tool !== "object") {
        return false;
      }
      if (!("type" in tool) || typeof tool.type !== "string") {
        return false;
      }
    }
  }

  if (assistant.chainIds !== undefined) {
    if (
      !Array.isArray(assistant.chainIds) ||
      !assistant.chainIds.every((id) => typeof id === "number")
    ) {
      return false;
    }
  }

  if (assistant.categories !== undefined) {
    if (
      !Array.isArray(assistant.categories) ||
      !assistant.categories.every((cat) => typeof cat === "string")
    ) {
      return false;
    }
  }

  // Validate optional string fields
  const optionalStringFields = ["version", "repo"] as const;
  for (const field of optionalStringFields) {
    if (
      assistant[field] !== undefined &&
      typeof assistant[field] !== "string"
    ) {
      return false;
    }
  }

  if (spec.email !== undefined && typeof spec.email !== "string") {
    return false;
  }

  return true;
}
