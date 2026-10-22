import type { z } from "zod";

export class NdjsonParseError extends Error {
  constructor(
    readonly lineNumber: number,
    readonly reason: string,
  ) {
    super(`Invalid NDJSON on line ${lineNumber}: ${reason}`);
    this.name = "NdjsonParseError";
  }
}

export function parseNdjson<T>(input: string, schema: z.ZodType<T>): T[] {
  const records: T[] = [];
  const lines = input.split(/\r?\n/u);

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    let candidate: unknown;
    try {
      candidate = JSON.parse(line);
    } catch {
      throw new NdjsonParseError(index + 1, "line is not valid JSON");
    }

    const result = schema.safeParse(candidate);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path.length ? issue.path.join(".") : "record";
      throw new NdjsonParseError(
        index + 1,
        `${path}: ${issue?.message ?? "schema validation failed"}`,
      );
    }

    records.push(result.data);
  }

  return records;
}
