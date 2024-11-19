import dotenv from "dotenv";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "fs";

export function readFile(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

export function writeFile(filePath: string, content: string): void {
  const dirPath = filePath.split("/").slice(0, -1).join("/");
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  writeFileSync(filePath, content);
}

const ENV_FILES = [".env", ".env.local", ".env.development", ".env.production"];
export async function appendToEnv(key: string, value: string): Promise<void> {
  // clean up any previous insertion
  removeFromEnv(key);

  // make sure the value is in a single line (easier to remove)
  const formattedValue = value.replace(/\n/g, "");

  const envEntry = `${key}=${formattedValue}`;

  let envPath = ENV_FILES.find((file) => existsSync(file));

  if (envPath) {
    appendFileSync(envPath, `\n${envEntry}`);
  } else {
    envPath = ".env";
    writeFileSync(envPath, envEntry);
  }

  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
}

export async function removeFromEnv(key: string): Promise<void> {
  for (const envPath of ENV_FILES) {
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, "utf-8");
      const regex = new RegExp(`^${key}=.*\n?`, "gm");

      let updatedContent = envContent.replace(regex, "");

      // Remove empty lines
      updatedContent = updatedContent.replace(/^\s*[\r\n]|[\r\n]+$/gm, "");

      if (updatedContent !== envContent) {
        writeFileSync(envPath, updatedContent);
        console.log(`Removed ${key} from ${envPath}`);
      }
    }
  }

  // Reload environment variables
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
}
