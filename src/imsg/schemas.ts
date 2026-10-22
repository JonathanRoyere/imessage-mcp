import { z } from "zod";

const OptionalNullableString = z.string().nullable().optional();

export const ChatSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    identifier: z.string(),
    display_name: OptionalNullableString,
    contact_name: OptionalNullableString,
    guid: z.string().optional(),
    service: z.string().optional(),
    last_message_at: z.string().optional(),
    unread_count: z.number().int().nonnegative().optional(),
    is_group: z.boolean().optional(),
    participants: z.array(z.string()).optional(),
  })
  .passthrough();

export type Chat = z.infer<typeof ChatSchema>;

export const MessageSchema = z
  .object({
    id: z.number().int().positive(),
    chat_id: z.number().int().positive(),
    chat_identifier: z.string(),
    chat_name: OptionalNullableString,
    text: OptionalNullableString,
    is_from_me: z.boolean(),
    is_read: z.boolean().optional(),
    date: z.string(),
    date_read: OptionalNullableString,
  })
  .passthrough();

export type Message = z.infer<typeof MessageSchema>;
