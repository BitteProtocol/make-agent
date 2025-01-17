import { Command } from "commander";

export const registerCommand = new Command()
  .name("register")
  .description("(Deprecated)")
  .action(async () => {
    console.log(
      "The 'register' command has been deprecated. Use 'deploy' instead.",
    );
  });
