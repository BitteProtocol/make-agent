import dotenv from "dotenv";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  readFile,
  writeFile,
  appendToEnv,
  removeFromEnv,
} from "../../src/utils/file";

// Mock all the fs functions and dotenv
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

describe("File utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readFile", () => {
    it("should read file content", () => {
      vi.mocked(readFileSync).mockReturnValue("file content");

      const content = readFile("test.txt");

      expect(content).toBe("file content");
      expect(readFileSync).toHaveBeenCalledWith("test.txt", "utf-8");
    });
  });

  describe("writeFile", () => {
    it("should create directory if it does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeFile("dir/test.txt", "content");

      expect(mkdirSync).toHaveBeenCalledWith("dir", { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith("dir/test.txt", "content");
    });

    it("should not create directory if it exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      writeFile("dir/test.txt", "content");

      expect(mkdirSync).not.toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith("dir/test.txt", "content");
    });
  });

  describe("appendToEnv", () => {
    it("should append to existing .env file", async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === ".env");

      await appendToEnv("KEY", "value");

      expect(appendFileSync).toHaveBeenCalledWith(".env", "\nKEY=value");
      // 2 for removeFromEnv, 2 for appendToEnv
      expect(dotenv.config).toHaveBeenCalledTimes(2 + 2);
    });

    it("should create .env file if none exists", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await appendToEnv("KEY", "value");

      expect(writeFileSync).toHaveBeenCalledWith(".env", "KEY=value");
      // 2 for removeFromEnv, 2 for appendToEnv
      expect(dotenv.config).toHaveBeenCalledTimes(2 + 2);
    });

    it("should handle multiline values", async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === ".env");

      await appendToEnv("KEY", "line1\nline2");

      expect(appendFileSync).toHaveBeenCalledWith(".env", "\nKEY=line1line2");
    });
  });

  describe("removeFromEnv", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("KEY1=value1\nKEY2=value2\n");
    });

    // it("should remove specified key from env file", async () => {
    //   await removeFromEnv("KEY1");

    //   expect(writeFileSync).toHaveBeenCalledWith(".env", "KEY2=value2");
    //   expect(dotenv.config).toHaveBeenCalledTimes(2);
    // });

    // it("should handle key not found in env file", async () => {
    //   await removeFromEnv("KEY3");

    //   expect(writeFileSync).not.toHaveBeenCalled();
    //   expect(dotenv.config).toHaveBeenCalledTimes(2);
    // });

    it("should remove empty lines after key removal", async () => {
      vi.mocked(readFileSync).mockReturnValue("KEY1=value1\n\nKEY2=value2\n\n");

      await removeFromEnv("KEY1");

      expect(writeFileSync).toHaveBeenCalledWith(".env", "KEY2=value2");
    });
  });
});
