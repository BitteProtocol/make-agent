import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function detectPort(): Promise<number | null> {
  try {
    // For Unix-like systems (Linux, macOS)
    // Get PIDs of Node processes running in the current directory
    const { stdout: pidOutput } = await execAsync(`lsof -n | grep '${process.cwd()}' | grep node | awk '{print $2}' | uniq`);
    const pids = pidOutput.trim().split('\n');

    if (pids.length === 0) {
      console.log('No Node.js processes found running in the current directory.');
      return null;
    }

    // Get ports for all node processes
    const { stdout: portOutput } = await execAsync(`lsof -n -i -P | grep LISTEN | grep node`);
    const portLines = portOutput.trim().split('\n');
    
    // Filter port lines by pid and then extract ports
    const ports = portLines
      .filter(line => pids.some(pid => line.includes(pid)))
      .map(line => {
        const match = line.match(/:(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((port): port is number => port !== null);

    if (ports.length === 0) {
      console.log('No ports found for Node.js processes in the current directory.');
      return null;
    }

    if (ports.length > 1) {
      console.log(`Multiple ports found: ${ports.join(', ')}. Using the first one.`);
    }

    return ports[0];
  } catch (error) {
    // If lsof fails, it might be a Windows system or lsof is not installed
    try {
      // For Windows
      const { stdout } = await execAsync("netstat -ano | findstr :LISTENING | findstr node.exe");
      const match = stdout.match(/:(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } catch (winError) {
      console.error('Error detecting port:', winError);
    }
  }
  return null;
}