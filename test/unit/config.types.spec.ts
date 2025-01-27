import {validateXMbSpec} from "../../src/config/types";

type ArbitraryObject = { [key: string]: unknown };
describe("src/config", () => {
  it("validateXMbSpec fails", () => {
    let spec: ArbitraryObject = {};
    expect(() => validateXMbSpec(spec)).toThrow("x-mb spec must contain account-id as string");
    
    spec["account-id"] = "name";
    expect(() => validateXMbSpec(spec)).toThrow("x-mb spec must contain assistant object");
    let assistant: ArbitraryObject = {};
    spec.assistant  = assistant;
    expect(() => validateXMbSpec(spec)).toThrow("assistant must contain name as string");
    assistant.name = "assistantName";
    expect(() => validateXMbSpec(spec)).toThrow("assistant must contain description as string");
    assistant.description = "assistantDescription";
    expect(() => validateXMbSpec(spec)).toThrow("assistant must contain instructions as string");
    assistant.instructions = "assistantInstructions";

    // Checkpoint
    expect(spec).toStrictEqual({
      "account-id": "name",
      assistant: {
        name: "assistantName",
        description: "assistantDescription",
        instructions: "assistantInstructions",
      },
    });
    // TODO: This does not seem correct?
    expect(validateXMbSpec(spec)).toBeUndefined();
  });
});