#!/usr/bin/env node
import { program } from 'commander';
import packageJson from "../package.json";
import { deployCommand } from './commands/deploy';
import { devCommand } from './commands/dev';

program
    .name('make-agent')
    .description('CLI tool for managing AI agents')
    .version(packageJson.version);

program.addCommand(devCommand);

program.addCommand(deployCommand);

// program
//     .addCommand(registerCommand);

// program
//     .addCommand(updateCommand);

// program
//     .addCommand(deleteCommand);

program.parse();