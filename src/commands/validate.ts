import { validateBittePluginSpec } from "bitte-ai-spec";
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const validateCommand = new Command()
  .name("validate")
  .description("Validate a plugin spec from a file or URL")
  .argument("<source>", "Path to spec file or URL of the spec")
  .action(async (source: string) => {
    try {
      let spec: string | object = source;

      // If source is a file path, read the contents
      if (!source.startsWith("http")) {
        const filePath = path.resolve(process.cwd(), source);
        try {
          const fileContents = await readFile(filePath, "utf-8");
          spec = JSON.parse(fileContents);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            throw new Error(`File not found: ${filePath}`);
          }
          const errorMessage =
            error instanceof Error ? error.message : JSON.stringify(error);
          throw new Error(`Error reading/parsing file: ${errorMessage}`);
        }
      }

      console.log(`Validating spec from: ${source}`);
      const { valid, schema, errorMessage } =
        await validateBittePluginSpec(spec);

      if (!valid || !schema) {
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ Spec validation successful");
      console.log("Account ID:", schema["x-mb"]["account-id"]);
      console.log("Assistant Name:", schema["x-mb"]["assistant"]["name"]);
      console.log("Server URL:", schema["servers"]?.[0]?.url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(errorMessage);
      process.exit(1);
    }
  });
