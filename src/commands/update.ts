import { Command } from "commander";

export const updateCommand = new Command()
  .name("update")
  .description("(Deprecated)")
  .action(async () => {
    console.log(
      "The 'update' command has been deprecated. Use 'deploy' instead.",
    );
  });
