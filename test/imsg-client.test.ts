import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { AppConfig } from "../src/config.js";
import { ImsgClient } from "../src/imsg/client.js";
import { NdjsonParseError } from "../src/imsg/ndjson.js";
import { ImsgCommandError, ImsgRunner } from "../src/imsg/runner.js";

const FAKE_IMSG = `#!/usr/bin/env bun
const args = process.argv.slice(2);
if (args[0] === "chats") {
  console.log(JSON.stringify({
    id: 42,
    name: "Example Person",
    identifier: "iMessage;-;+15551234567",
    display_name: "Example Person",
    unread_count: args.includes("--unread-only") ? 2 : 0,
    is_group: false,
  }));
  process.exit(0);
}
if (args[0] === "history") {
  console.log(JSON.stringify({
    id: 9001,
    chat_id: Number(args[args.indexOf("--chat-id") + 1]),
    chat_identifier: "iMessage;-;+15551234567",
    chat_name: "Example Person",
    text: "hello",
    is_from_me: false,
    is_read: false,
    date: "2026-10-22T12:00:00Z",
  }));
  process.exit(0);
}
if (args[0] === "malformed") {
  console.log("not-json secret-message-body");
  process.exit(0);
}
console.error("unsupported fake command");
process.exit(2);
`;

describe("ImsgClient", () => {
  let temporaryDirectory: string;
  let executablePath: string;
  let config: AppConfig;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "imessage-mcp-test-"));
    executablePath = join(temporaryDirectory, "imsg");
    await writeFile(executablePath, FAKE_IMSG, "utf8");
    await chmod(executablePath, 0o700);
    config = {
      imsgBin: executablePath,
      commandTimeoutMs: 2_000,
      maxOutputBytes: 1024 * 1024,
    };
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  test("lists unread chats through the fake executable", async () => {
    const client = new ImsgClient(new ImsgRunner(config));
    const chats = await client.listChats({ limit: 5, unreadOnly: true });

    expect(chats).toHaveLength(1);
    expect(chats[0]?.id).toBe(42);
    expect(chats[0]?.unread_count).toBe(2);
  });

  test("reads and validates chat history", async () => {
    const client = new ImsgClient(new ImsgRunner(config));
    const messages = await client.readHistory({ chatId: 42, limit: 25 });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: 9001,
      chat_id: 42,
      text: "hello",
      is_from_me: false,
      is_read: false,
    });
  });

  test("does not echo malformed message content in validation errors", async () => {
    const runner = new ImsgRunner(config);

    await expect(runner.run(["malformed"]).then((value) => {
      const clientRunner = { run: async () => value };
      return new ImsgClient(clientRunner).listChats();
    })).rejects.toThrow(NdjsonParseError);

    try {
      const output = await runner.run(["malformed"]);
      await new ImsgClient({ run: async () => output }).listChats();
    } catch (error) {
      expect(String(error)).not.toContain("secret-message-body");
    }
  });

  test("reports a missing executable without leaking command arguments", async () => {
    const runner = new ImsgRunner({ ...config, imsgBin: join(temporaryDirectory, "missing") });

    await expect(runner.run(["history", "sensitive-value"])).rejects.toThrow(
      ImsgCommandError,
    );
    await expect(runner.run(["history", "sensitive-value"])).rejects.not.toThrow(
      "sensitive-value",
    );
  });
});
