import { describe, it, expect } from "vitest";

import { AI_PLUGIN_PATH } from "../../src/config/constants";
import { getHostname, getSpecUrl } from "../../src/utils/url";

describe("URL utilities", () => {
  describe("getHostname", () => {
    it("should extract hostname from a full URL", () => {
      expect(getHostname("https://example.com/path")).toBe("example.com");
    });

    it("should extract hostname from URL with port", () => {
      expect(getHostname("http://localhost:3000/path")).toBe("localhost");
    });

    it("should extract hostname from URL with subdomain", () => {
      expect(getHostname("https://api.example.com/path")).toBe(
        "api.example.com",
      );
    });

    it("should throw error for invalid URL", () => {
      expect(() => getHostname("not-a-url")).toThrow();
    });
  });

  describe("getSpecUrl", () => {
    it("should append AI_PLUGIN_PATH to base URL", () => {
      const baseUrl = "https://example.com";
      const expected = new URL(`${baseUrl}/${AI_PLUGIN_PATH}`);
      expect(getSpecUrl(baseUrl).toString()).toBe(expected.toString());
    });

    it("should handle base URLs with trailing slash", () => {
      const baseUrl = "https://example.com/";
      const expected = new URL(`https://example.com/${AI_PLUGIN_PATH}`);
      expect(getSpecUrl(baseUrl).toString()).toBe(expected.toString());
    });

    it("should work with localhost", () => {
      const baseUrl = "http://localhost:3000";
      const expected = new URL(`${baseUrl}/${AI_PLUGIN_PATH}`);
      expect(getSpecUrl(baseUrl).toString()).toBe(expected.toString());
    });

    it("should throw error for invalid base URL", () => {
      expect(() => getSpecUrl("not-a-url")).toThrow();
    });
  });
});
