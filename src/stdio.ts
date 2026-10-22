import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { ImsgClient } from "./imsg/client.js";
import { ImsgRunner } from "./imsg/runner.js";
import { createMcpServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const reader = new ImsgClient(new ImsgRunner(config));
  const server = createMcpServer(reader);
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`imessage-mcp failed to start: ${message}`);
  process.exitCode = 1;
});
