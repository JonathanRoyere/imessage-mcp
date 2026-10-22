# imessage-mcp

A safety-first Model Context Protocol server for reading and sending messages through
the [`imsg`](https://imsg.sh/) macOS CLI.

The project is under active development. It currently exposes read-only tools over
local stdio. It does **not** send messages yet.

## Requirements

- macOS 14 or newer
- Bun 1.3 or newer
- [`imsg`](https://imsg.sh/install.html), when connecting to a real Messages database

## Development

```bash
bun install
bun run check
bun test
```

Tests use a temporary fake `imsg` executable. They do not access Messages.app,
`~/Library/Messages/chat.db`, contacts, or the network.

Copy `.env.example` values into the environment only when overriding the defaults.
Never commit message databases, local state, credentials, or message exports.

## Local MCP configuration

Install `imsg`, then point an MCP-compatible desktop or CLI client at the stdio
entrypoint. Use absolute paths because desktop applications may have a minimal `PATH`:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "/opt/homebrew/bin/bun",
      "args": [
        "run",
        "/absolute/path/to/imessage-mcp/src/stdio.ts"
      ],
      "env": {
        "IMESSAGE_MCP_IMSG_BIN": "/opt/homebrew/bin/imsg"
      }
    }
  }
}
```

Available tools:

- `list_chats`: lists recent or unread chats and their numeric IDs.
- `read_chat_history`: reads recent messages from one chat ID.

The process that launches the server needs Full Disk Access to read the Messages
database. Do not grant that permission until you are ready to test against real data.

## Planned safety model

- Read output is parsed and validated before it reaches an MCP client.
- Message text is treated as untrusted data rather than agent instructions.
- Sending will use a two-stage prepare/confirm workflow with one-use approval tokens.
- Remote access will require authenticated, origin-validated transport.
- Digest processing will use a durable row-ID checkpoint and advance it only after
  successful delivery.
