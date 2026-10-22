import { z } from "zod";

import { parseNdjson } from "./ndjson.js";
import type { ImsgRunner } from "./runner.js";
import { ChatSchema, MessageSchema, type Chat, type Message } from "./schemas.js";

const ListChatsOptionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  unreadOnly: z.boolean().default(false),
});

const ReadHistoryOptionsSchema = z.object({
  chatId: z.number().int().positive(),
  limit: z.number().int().min(1).max(500).default(50),
});

export class ImsgClient {
  constructor(private readonly runner: Pick<ImsgRunner, "run">) {}

  async listChats(options: { limit?: number; unreadOnly?: boolean } = {}): Promise<Chat[]> {
    const input = ListChatsOptionsSchema.parse(options);
    const args = ["chats", "--limit", String(input.limit), "--json"];
    if (input.unreadOnly) args.push("--unread-only");

    return parseNdjson(await this.runner.run(args), ChatSchema);
  }

  async readHistory(options: { chatId: number; limit?: number }): Promise<Message[]> {
    const input = ReadHistoryOptionsSchema.parse(options);
    return parseNdjson(
      await this.runner.run([
        "history",
        "--chat-id",
        String(input.chatId),
        "--limit",
        String(input.limit),
        "--json",
      ]),
      MessageSchema,
    );
  }
}
