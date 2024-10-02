// import { Command } from "commander";
// import { registerPlugin } from "../services/plugin-service";
// import { openPlayground } from "../services/tunnel-service";

// export const registerCommand = new Command()
//     .name('register')
//     .description('Register a new plugin with a URL')
//     .argument('<url>', 'URL of the plugin')
//     .action(async (url) => {
//         const pluginId = new URL(url).hostname;
//         const accountId = await getAccountId(url)
//         const result = await registerPlugin(pluginId, accountId);
//         if (result) {
//             const receivedId = await openPlayground(result);
//             console.log(`Received ID from playground: ${receivedId}`);
//         } else {
//             console.log('Registration failed.');
//         }
//     });