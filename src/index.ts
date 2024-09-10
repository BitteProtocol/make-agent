#!/usr/bin/env node
import { program } from 'commander';
import { devCommand } from './commands/dev';
import packageJson from "../package.json"

program
    .name('make-agent')
    .description('CLI tool for managing AI agents')
    .version(packageJson.version);

program.addCommand(devCommand);

// program
//     .addCommand(registerCommand);

// program
//     .addCommand(updateCommand);

// program
//     .addCommand(deleteCommand);

program.parse();