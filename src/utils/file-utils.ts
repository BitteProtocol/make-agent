import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';

export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf-8');
}

export function writeFile(filePath: string, content: string): void {
    const dirPath = filePath.split('/').slice(0, -1).join('/');
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
    writeFileSync(filePath, content);
}

export async function appendToEnv(key: string, value: string): Promise<void> {
    const envPath = '.env';
    const envEntry = `${key}=${value}`;
    
    if (existsSync(envPath)) {
        appendFileSync(envPath, `\n${envEntry}`);
    } else {
        appendFileSync(envPath, envEntry);
    }
}