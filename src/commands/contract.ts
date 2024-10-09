import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import inquirer from "inquirer";

const execAsync = promisify(exec);

function showLoadingMessage(message: string): void {
  console.log(`${message}...`);
}

export const contractCommand = new Command()
  .name("contract")
  .description("Generate an AI agent from a Near Protocol contract")
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'contract',
        message: 'Enter the Near Protocol contract name:',
        validate: (input: string) => input.length > 0 || 'Contract name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter the contract description (agent instructions):',
        validate: (input: string) => input.length > 0 || 'Contract description is required'
      },
      {
        type: 'input',
        name: 'output',
        message: 'Enter the output directory (press Enter for current directory):',
        default: '.',
      },
      {
        type: 'input',
        name: 'accountId',
        message: 'Enter your near account ID to generate an API key:',
        validate: (input: string) => input.length > 0 || 'Near account ID is required'
      }
    ];

    const answers = await inquirer.prompt<{
      contract: string;
      description: string;
      output: string;
      accountId: string;
    }>(questions as any);

    const apiUrl = new URL("https://contract-to-agent.vercel.app/api/generate");
    apiUrl.searchParams.append("contract", answers.contract);
    apiUrl.searchParams.append("contractDescription", answers.description);
    if (answers.accountId) {
      apiUrl.searchParams.append("accountId", answers.accountId);
    }

    showLoadingMessage("Generating AI agent");

    try {
      const response = await fetch(apiUrl.toString(), {
          method: 'GET',
      });

      if (!response.ok) {
          console.error('Failed to generate AI agent');
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { code } = await response.json();

      const outputDir = path.resolve(answers.output);

      await fs.mkdir(outputDir, { recursive: true });

      await fs.writeFile(path.join(outputDir, 'index.ts'), code);

      const tsConfig = {
        compilerOptions: {
          target: "es2018",
          module: "commonjs",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          outDir: "./dist",
        },
        include: ["*.ts"],
        exclude: ["node_modules"],
      };
      await fs.writeFile(
        path.join(answers.output, "tsconfig.json"),
        JSON.stringify(tsConfig, null, 2)
      );

      const packageJson = {
        name: `near-contract-agent-${answers.contract}`,
        version: "1.0.0",
        description: `AI agent for Near Protocol contract: ${answers.contract}`,
        main: "dist/index.js",
        scripts: {
          build: "npx tsc ./index.ts",
          start: "node dist/index.js",
        },
        dependencies: {
          express: "^4.17.1",
          "@types/express": "^4.17.13",
          "make-agent": "0.0.15-rc.2",
        },
        devDependencies: {
          typescript: "^4.5.4",
        },
      };
      await fs.writeFile(
        path.join(answers.output, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );
      process.chdir(outputDir);
      showLoadingMessage("Generating types");
      await execAsync(`npx near2ts ${answers.contract}`);

      showLoadingMessage("Installing dependencies with npm install");
      await execAsync("npm install --legacy-peer-deps");

      showLoadingMessage("Running server");
      execAsync("npx tsx ./index.ts"),
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const agentProcess = spawn('npx', ['make-agent', 'dev', '-p', '8080']);

      agentProcess.stdout.on("data", (data) => {
        console.log(`${data}`);
      });

      agentProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      agentProcess.on("close", (code) => {
        console.log(`make-agent process exited with code ${code}`);
      });

      console.log("AI agent execution completed successfully.");
      console.log(`AI agent generated successfully in ${answers.output}`);
    } catch (error) {
      console.error("Error generating AI agent");
      console.error("Error details:", error);
    }
  });
