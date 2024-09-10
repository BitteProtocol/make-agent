import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

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