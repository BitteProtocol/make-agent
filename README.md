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

1. **dev**: Make your AI agent discoverable and register the plugin
   
   Usage:
   ```bash
   npx make-agent dev -p <port_number>
   ```
   
   Options:
   - `-p, --port <number>`: Specify the local port to expose (required)

2. **deploy**: Deploy your AI agent, making it discoverable and registering it as a plugin

   Usage:
   ```bash
   npx make-agent deploy [options]
   ```

   Options:
   - `-u, --url <url>`: Specify the deployment URL (optional)

   If no URL is provided, the command will attempt to determine the deployed URL automatically.

### Future Commands

The CLI is designed to support additional commands in the future, such as:

- `register`: For registering AI agents
- `update`: For updating existing AI agents
- `delete`: For removing AI agents

These commands are currently commented out in the code and will be implemented in future versions.

## Development

This project was created using `bun init` in Bun v1.1.20. To start developing:

1. Clone the repository
2. Run `bun install` to install dependencies
3. Modify the code in the `commands` and `services` directories as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
