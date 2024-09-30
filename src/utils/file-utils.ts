import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import dotenv from 'dotenv';

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
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    const envEntry = `${key}=${value}`;
    
    let envPath = envFiles.find(file => existsSync(file));

    if (envPath) {
        appendFileSync(envPath, `\n${envEntry}`);
    } else {
        envPath = '.env';
        writeFileSync(envPath, envEntry);
    }

    dotenv.config();
    dotenv.config({ path: `.env.local`, override: true });
}