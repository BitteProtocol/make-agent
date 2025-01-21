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
import { verifyCommand } from "./commands/verify";

dotenv.config();

program
  .name("make-agent")
  .description("CLI tool for managing AI agents")
  .version(packageJson.version);

program
  .addCommand(devCommand)
  .addCommand(deployCommand)
  .addCommand(contractCommand)
  .addCommand(registerCommand)
  .addCommand(updateCommand)
  .addCommand(deleteCommand)
  .addCommand(verifyCommand);

program.parse();
