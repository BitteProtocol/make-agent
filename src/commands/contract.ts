import { exec, spawn } from "child_process";
import { Command } from "commander";
import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export const contractCommand = new Command()
  .name("contract")
  .description("Generate an AI agent from a Near Protocol contract")
  .action(async () => {
    try {
      const answers = await promptQuestions();
      const outputDir = path.resolve(answers.output);
      await fs.mkdir(outputDir, { recursive: true });
      await generateTypes(outputDir, answers.contract);
      const code = await generateAIAgent(answers, outputDir);
      await writeFiles(outputDir, code, answers.contract);
      await setupAndRunAgent(outputDir);

      console.log("AI agent execution completed successfully.");
      console.log(`AI agent generated successfully in ${answers.output}`);
    } catch (error) {
      console.error("Error generating AI agent");
      console.error("Error details:", error);
    }
  });

function showLoadingMessage(message: string): void {
  console.log(`${message}...`);
}

interface PromptAnswers {
  contract: string;
  description: string;
  output: string;
  accountId: string;
}

async function promptQuestions(): Promise<PromptAnswers> {
  // @ts-expect-error: Cannot find namespace 'inquirer'.ts(2503)
  const questions: inquirer.QuestionCollection<PromptAnswers> = [
    {
      type: "input",
      name: "contract",
      message: "Enter the Near Protocol contract name:",
      validate: (input: string) =>
        input.length > 0 || "Contract name is required",
    },
    {
      type: "input",
      name: "description",
      message: "Enter the contract description (agent instructions):",
      validate: (input: string) =>
        input.length > 0 || "Contract description is required",
    },
    {
      type: "input",
      name: "output",
      message:
        "Enter the output directory (press Enter for current directory):",
      default: ".",
    },
    {
      type: "input",
      name: "accountId",
      message: "Enter your near account ID to generate an API key:",
      validate: (input: string) =>
        input.length > 0 || "Near account ID is required",
    },
  ];

  return await inquirer.prompt<PromptAnswers>(questions);
}

async function generateTypes(
  outputDir: string,
  contract: string,
): Promise<void> {
  process.chdir(outputDir);
  showLoadingMessage("Generating types");
  await execAsync(`npx near2ts ${contract}`);
}

async function generateAIAgent(
  answers: {
    contract: string;
    description: string;
    accountId: string;
  },
  outputDir: string,
): Promise<string> {
  const apiUrl = "https://contract-to-agent.vercel.app/api/generate";

  showLoadingMessage("Generating AI agent");

  const typesContent = await fs.readFile(
    path.join(outputDir, "contract_types.ts"),
    "utf-8",
  );

  const postData = {
    contract: answers.contract,
    contractDescription: answers.description,
    accountId: answers.accountId,
    types: typesContent,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  if (response.status === 429) {
    throw new Error(
      "You have reached the daily prompt limit. Please try again tomorrow.",
    );
  }

  if (!response.ok) {
    console.error("Failed to generate AI agent");
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.code;
}

async function writeFiles(
  outputDir: string,
  code: string,
  contract: string,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(path.join(outputDir, "index.ts"), code);

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
    path.join(outputDir, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2),
  );

  const packageJson = {
    name: `near-contract-agent-${contract}`,
    version: "1.0.0",
    description: `AI agent for Near Protocol contract: ${contract}`,
    main: "dist/index.js",
    scripts: {
      build: "npx tsc ./index.ts",
      start: "node dist/index.js",
    },
    dependencies: {
      express: "^4.17.1",
      "@types/express": "^4.17.13",
      "make-agent": "latest",
      dotenv: "^10.0.0",
    },
    devDependencies: {
      typescript: "^4.5.4",
    },
  };
  await fs.writeFile(
    path.join(outputDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

async function setupAndRunAgent(outputDir: string): Promise<void> {
  process.chdir(outputDir);

  showLoadingMessage("Installing dependencies with npm install");
  await execAsync("npm install --legacy-peer-deps");

  showLoadingMessage("Running server");
  const serverProcess = spawn("npx", ["tsx", "./index.ts"]);

  serverProcess.stdout.on("data", (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`Server error: ${data}`);
  });

  // Wait for the server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Server is running")) {
        resolve(true);
      }
    });
  });

  showLoadingMessage("Running agent");
  const agentProcess = spawn("npx", ["make-agent", "dev", "-p", "8080"]);

  agentProcess.stdout.on("data", (data) => {
    console.log(`Agent: ${data}`);
  });

  agentProcess.stderr.on("data", (data) => {
    console.error(`Agent error: ${data}`);
  });

  agentProcess.on("close", (code) => {
    console.log(`make-agent process exited with code ${code}`);
    serverProcess.kill();
  });

  // Keep the main process running
  // TODO(bh2smith): This is bad practice. Find a better way to keep the process running.
  //  https://github.com/BitteProtocol/make-agent/issues/23
  await new Promise(() => {});
}
