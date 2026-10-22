# imessage-mcp

A safety-first Model Context Protocol server for reading and sending messages through
the [`imsg`](https://imsg.sh/) macOS CLI.

The project is under active development. The current scaffold contains only the typed
configuration, validated NDJSON parser, and read-only `imsg` adapter. It does **not**
yet expose MCP tools or send messages.

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

## Planned safety model

- Read output is parsed and validated before it reaches an MCP client.
- Message text is treated as untrusted data rather than agent instructions.
- Sending will use a two-stage prepare/confirm workflow with one-use approval tokens.
- Remote access will require authenticated, origin-validated transport.
- Digest processing will use a durable row-ID checkpoint and advance it only after
  successful delivery.
