import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function detectPort(): Promise<number | null> {
  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await tryDetectPort(attempt);
    if (result !== null) return result;

    if (attempt < maxAttempts) {
      await sleep(1000);
    }
  }
  return null;
}

async function tryDetectPort(attempt: number): Promise<number | null> {
  if (process.platform === "darwin") {
    return detectPortMacOS(attempt);
  } else if (process.platform === "linux") {
    return detectPortLinux(attempt);
  } else if (process.platform === "win32") {
    return detectPortWindows(attempt);
  }
  return null;
}

async function detectPortMacOS(attempt: number): Promise<number | null> {
  try {
    // Get PIDs of Node processes running in the current directory
    const { stdout: pidOutput } = await execAsync(
      `lsof -n | grep '${process.cwd()}' | grep node | awk '{print $2}' | uniq`,
    );
    const pids = pidOutput.trim().split("\n");

    if (pids.length === 0) {
      console.log(
        `Attempt ${attempt}/5: No Node.js processes found running in the current directory.`,
      );
      return null;
    }

    // Get ports for all node processes
    const { stdout: portOutput } = await execAsync(
      "lsof -n -i -P | grep LISTEN | grep node",
    );
    const portLines = portOutput.trim().split("\n");

    // Filter port lines by pid and then extract ports
    const ports = portLines
      .filter((line) => pids.some((pid) => line.includes(pid)))
      .map((line) => {
        const match = line.match(/:(\d+)/);
        return match?.[1] ? Number.parseInt(match[1], 10) : null;
      })
      .filter((port): port is number => port !== null);

    if (ports.length === 0) {
      console.log(
        `Attempt ${attempt}/5: No ports found for Node.js processes in the current directory.`,
      );
      return null;
    }

    if (ports.length > 1) {
      console.log(
        `Multiple ports found: ${ports.join(", ")}. Using the first one.`,
      );
    }

    return ports[0] ?? null;
  } catch (error) {
    console.log(
      `Attempt ${attempt}/5: lsof failed on macOS:`,
      (error as Error).message,
    );
    return null;
  }
}

async function detectPortLinux(attempt: number): Promise<number | null> {
  try {
    // Use ss to find listening ports for node/next-server processes
    const { stdout } = await execAsync(
      'ss -tulpn | grep -E "(node|next-server)"',
    );

    const match = stdout.match(/:(\d+)/);
    if (match && match[1]) {
      return Number.parseInt(match[1], 10);
    }

    console.log(
      `Attempt ${attempt}/5: No listening ports found for node/next-server processes`,
    );
    return null;
  } catch (error) {
    console.log(
      `Attempt ${attempt}/5: ss failed on Linux:`,
      (error as Error).message,
    );
    return null;
  }
}

async function detectPortWindows(attempt: number): Promise<number | null> {
  try {
    // Use netstat to find listening ports for node.exe
    const { stdout } = await execAsync(
      "netstat -ano | findstr :LISTENING | findstr node.exe",
    );

    const match = stdout.match(/:(\d+)/);
    if (match && match[1]) {
      return Number.parseInt(match[1], 10);
    }

    console.log(`Attempt ${attempt}/5: No listening ports found for node.exe`);
    return null;
  } catch (error) {
    console.log(
      `Attempt ${attempt}/5: netstat failed on Windows:`,
      (error as Error).message,
    );
    return null;
  }
}
