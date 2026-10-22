import { z } from "zod";

const ConfigSchema = z.object({
  imsgBin: z.string().trim().min(1),
  commandTimeoutMs: z.coerce.number().int().min(100).max(120_000),
  maxOutputBytes: z.coerce.number().int().min(1_024).max(100 * 1_024 * 1_024),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(
  environment: Record<string, string | undefined> = process.env,
): AppConfig {
  return ConfigSchema.parse({
    imsgBin: environment.IMESSAGE_MCP_IMSG_BIN ?? "imsg",
    commandTimeoutMs: environment.IMESSAGE_MCP_COMMAND_TIMEOUT_MS ?? 15_000,
    maxOutputBytes: environment.IMESSAGE_MCP_MAX_OUTPUT_BYTES ?? 10 * 1_024 * 1_024,
  });
}
