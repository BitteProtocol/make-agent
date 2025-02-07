import { describe, it, expect } from "vitest";

import { isXMbSpec, validateXMbSpec } from "../../src/config/types";

type ArbitraryObject = { [key: string]: unknown };
describe("src/config", () => {
  it("validateXMbSpec complete flow", () => {
    expect(() => validateXMbSpec(null)).toThrow("x-mb spec must be an object");
    // Start with empty spec
    let spec: ArbitraryObject = {};
    expect(() => validateXMbSpec(spec)).toThrow(
      "x-mb spec must contain assistant object",
    );

    let assistant: ArbitraryObject = {};
    spec.assistant = assistant;
    expect(() => validateXMbSpec(spec)).toThrow(
      "assistant must contain name as string",
    );
    assistant.name = "assistantName";
    expect(() => validateXMbSpec(spec)).toThrow(
      "assistant must contain description as string",
    );
    assistant.description = "assistantDescription";
    expect(() => validateXMbSpec(spec)).toThrow(
      "assistant must contain instructions as string",
    );
    assistant.instructions = "assistantInstructions";

    // Checkpoint Valid XMbSpec
    expect(spec).toStrictEqual({
      assistant: {
        name: "assistantName",
        description: "assistantDescription",
        instructions: "assistantInstructions",
      },
    });
    expect(validateXMbSpec(spec)).toBeUndefined();
    expect(isXMbSpec(spec)).toBe(true);

    // Optional fields
    assistant.tools = null;
    expect(() => validateXMbSpec(spec)).toThrow("tools must be an array");
    assistant.tools = [];
    expect(validateXMbSpec(spec)).toBeUndefined();
    assistant.tools = [1];
    expect(() => validateXMbSpec(spec)).toThrow("each tool must be an object");
    assistant.tools = [{}];
    expect(() => validateXMbSpec(spec)).toThrow(
      "each tool must have a type string",
    );
    assistant.tools = [{ type: 1 }];
    expect(() => validateXMbSpec(spec)).toThrow(
      "each tool must have a type string",
    );
    assistant.tools = [{ type: "function" }];
    // TODO(bh2smith): Should the tool type be an enum?
    expect(validateXMbSpec(spec)).toBeUndefined();

    assistant.chainIds = null;
    expect(() => validateXMbSpec(spec)).toThrow("chainIds must be an array");
    assistant.chainIds = ["ethereum"];
    expect(() => validateXMbSpec(spec)).toThrow(
      "chainIds must be an array of number",
    );
    assistant.chainIds = [1, 2];
    expect(validateXMbSpec(spec)).toBeUndefined();

    assistant.categories = null;
    expect(() => validateXMbSpec(spec)).toThrow("categories must be an array");
    assistant.categories = [null];
    expect(() => validateXMbSpec(spec)).toThrow(
      "categories must be an array of strings",
    );
    assistant.categories = ["ethereum", "solana"];
    expect(validateXMbSpec(spec)).toBeUndefined();

    assistant.version = null;
    expect(() => validateXMbSpec(spec)).toThrow("version must be a string");
    assistant.version = "1.0.0";
    expect(validateXMbSpec(spec)).toBeUndefined();

    assistant.repo = null;
    expect(() => validateXMbSpec(spec)).toThrow("repo must be a string");

    assistant.repo = "https://github.com/example/repo";
    expect(validateXMbSpec(spec)).toBeUndefined();

    spec.email = 123;
    expect(() => validateXMbSpec(spec)).toThrow("email must be a string");

    spec.email = "test@example.com";
    expect(validateXMbSpec(spec)).toBeUndefined();

    // Full Example Spec:
    expect(spec).toStrictEqual({
      assistant: {
        name: "assistantName",
        description: "assistantDescription",
        instructions: "assistantInstructions",
        tools: [{ type: "function" }],
        chainIds: [1, 2],
        categories: ["ethereum", "solana"],
        version: "1.0.0",
        repo: "https://github.com/example/repo",
      },
      email: "test@example.com",
    });
  });

  it("validateXMbSpec real example (CoW Agent)", () => {
    const cowSpec = {
      "account-id": "max-normal.near",
      assistant: {
        name: "CoWSwap Assistant",
        description:
          "An assistant that generates EVM transaction data for CoW Protocol Interactions",
        instructions:
          "Encodes transactions as signature requests on EVM networks. This assistant is only for EVM networks. Passes the the transaction fields of the response to generate-evm-tx tool for signing and displays the meta content of the response to the user after signing. For selling native assets, such as ETH, xDAI, POL, BNB it uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE as the sellToken. It does not infer the chainId. Do not infer the token decimals. Use Token Units for sellAmountBeforeFee. Uses token symbols for sellToken and buyToken unless addresses are provided. Always passes evmAddress as the safeAddress on any request requiring safeAddress. The only supported chains for the cowswap endpoint are Ethereum, Gnosis, Arbitrum and Base. All network support for balance, weth and erc20 endpoints.",
        tools: [
          {
            type: "generate-evm-tx",
          },
        ],
        image: "https://near-cow-agent.vercel.app/cowswap.svg",
        categories: ["defi"],
        chainIds: [1, 100, 8453, 42161, 11155111],
      },
      image: "https://near-cow-agent.vercel.app/cowswap.svg",
    };
    expect(validateXMbSpec(cowSpec)).toBeUndefined();
    expect(isXMbSpec(cowSpec)).toBe(true);
  });
});
