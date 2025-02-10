import { describe, it, expect, vi, beforeEach } from "vitest";

import { validateEnv } from "../../src/utils/env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear and reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should not throw when all required env vars are present", () => {
    process.env.BITTE_API_KEY = "test-key";

    expect(() => validateEnv()).not.toThrow();
  });

  it("should throw when BITTE_API_KEY is missing", () => {
    delete process.env.BITTE_API_KEY;

    expect(() => validateEnv()).toThrow(
      "Missing required environment variables: BITTE_API_KEY\n" +
        "Please ensure these are set in your .env file",
    );
  });

  it("should throw when BITTE_API_KEY is empty", () => {
    process.env.BITTE_API_KEY = "";

    expect(() => validateEnv()).toThrow(
      "Missing required environment variables: BITTE_API_KEY\n" +
        "Please ensure these are set in your .env file",
    );
  });

  it("should handle multiple missing env vars", () => {
    // In case you add more required vars in the future
    const requiredEnvVars = ["BITTE_API_KEY"];
    requiredEnvVars.forEach((key) => delete process.env[key]);

    expect(() => validateEnv()).toThrow(
      `Missing required environment variables: ${requiredEnvVars.join(", ")}\n` +
        "Please ensure these are set in your .env file",
    );
  });
});
