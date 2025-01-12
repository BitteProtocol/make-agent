# Make Agent CLI

**The swiss army knife for multi-chain AI agents**

Make Agent CLI is a powerful command-line tool designed to streamline the management and deployment of AI agents across multiple chains. This tool simplifies the process of making your AI agents discoverable and registering them as plugins.


## Usage

### Running the CLI

To run the Make Agent CLI:

```bash
npx make-agent dev -p 3000
```

### Available Commands

Currently, the CLI supports the following command:

1. ### **`dev`**: Make your AI agent discoverable and register the plugin
   
   Usage:
   ```bash
   npx make-agent dev -p <port_number>
   ```
   
   Options:
   - `-p, --port <number>`: Specify the local port to expose (optional). \\

   If no port is provided, the command will search for a node instance running in the current directory and assume its port.

2. ### **`deploy`**: Deploy your AI agent, making it discoverable and registering it as a plugin

   Usage:
   ```bash
   npx make-agent deploy [options]
   ```

   Options:
   - `-u, --url <url>`: Specify the deployment URL (optional)

   If no URL is provided, the command will attempt to determine the deployed URL automatically.

3. ### **`register`**: Register a new plugin with a URL

   Usage:
   ```bash
   npx make-agent register [options]
   ```

   Options:
   - `-u, --url <url>`: Specify the deployment URL (optional)

   If no URL is provided, the command will attempt to determine the deployed URL automatically.

4. ### **`update`**: Update an existing AI agent plugin

   Usage:
   ```bash
   npx make-agent update [options]
   ```

   Options:
   - `-u, --url <url>`: Specify the deployment URL (optional)

   If no URL is provided, the command will attempt to determine the deployed URL automatically.
5. ### **`contract`**: Scaffold a basic agent from a NEAR contract that has an ABI
   Usage:
   ```bash
   npx make-agent contract
   ```
   You will be prompted to select a contractId, add a description with instructions on how the agent should use the contract and an output directory

6. ### **`delete`**: Delete your AI agent plugin

   Usage:
   ```bash
   npx make-agent delete [options]
   ```

   Options:
   - `-u, --url <url>`: Specify the deployment URL (optional)

   If no URL is provided, the command will attempt to determine the deployed URL automatically.

7. ### **`verify`**: Request your plugin's verification

   Usage:
   ```bash
   npx make-agent verify -u <url> -e <email> -r <repoUrl> -v <versionNumber>
   ```

   Options:
   - `-u, --url <url>`: (required) Specify the url of the deployed plugin
   - `-e, --email <email>`: (required) Provide an email so we can contact you regarding the verification process
   - `-r, --repo <repoUrl>`: (required) To verify a plugin we need the url for a public repository containing the plugin's code
   - `-v, --version <versionNumber>`: (optional) Specify the version of the plugin in case of an update
   


## Development

This project was created using `bun init` in Bun v1.1.20. To start developing:

1. Clone the repository
2. Run `bun install` to install dependencies
3. Modify the code in the `commands` and `services` directories as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
