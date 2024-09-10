import { program } from 'commander';
import { devCommand } from './commands/dev';
import packageJson from "../package.json"

program
    .name('make-agent')
    .description('CLI tool for managing AI agents')
    .version(packageJson.version);

program
    .command('dev')
    .addCommand(devCommand);

// program
//     .command('register')
//     .addCommand(registerCommand);

// program
//     .command('update')
//     .addCommand(updateCommand);

// program
//     .command('delete')
//     .addCommand(deleteCommand);

program.parse();