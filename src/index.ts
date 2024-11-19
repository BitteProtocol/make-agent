#!/usr/bin/env node
import { program } from "commander";
import dotenv from "dotenv";

import packageJson from "../package.json";
import { contractCommand } from "./commands/contract";
import { deleteCommand } from "./commands/delete";
import { deployCommand } from "./commands/deploy";
import { devCommand } from "./commands/dev";
import { registerCommand } from "./commands/register";
import { updateCommand } from "./commands/update";

dotenv.config();

program
  .name("make-agent")
  .description("CLI tool for managing AI agents")
  .version(packageJson.version);

program.addCommand(devCommand);

program.addCommand(deployCommand);

program.addCommand(contractCommand);

program.addCommand(registerCommand);

program.addCommand(updateCommand);

program.addCommand(deleteCommand);

program.parse();
