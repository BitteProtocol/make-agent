import { Command } from "commander";
import { execSync } from "child_process";
import { existsSync } from "fs";
import * as path from "path";
import type { ExecSyncOptions } from "child_process";

export const newCommand = new Command()
  .name("new")
  .description("Create a new AI agent from the boilerplate")
  .argument("[name]", "Name of the agent directory")
  .action(async (name: string | undefined) => {
    const repoUrl = "https://github.com/BitteProtocol/agent-next-boilerplate.git";
    const dirName = name || "agent-next-boilerplate";
    
    // Check if directory already exists
    if (existsSync(dirName)) {
      console.error(`Error: Directory '${dirName}' already exists`);
      process.exit(1);
    }

    try {
      console.log(`Creating new agent in directory: ${dirName}`);
      console.log("Cloning boilerplate repository...");
      
      const execOptions: ExecSyncOptions = { stdio: "inherit" };
      execSync(`git clone ${repoUrl} ${dirName}`, execOptions);
      
      // Remove the .git directory to start fresh
      execSync(`rm -rf ${path.join(dirName, ".git")}`, execOptions);
      
      console.log("\nSuccess! Created new agent at", path.resolve(dirName));
      console.log("\nNext steps:");
      console.log(`  cd ${dirName}`);
      console.log("  npm install");
      console.log("  npm run dev");
    } catch (error: unknown) {
      console.error("Failed to create new agent:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
