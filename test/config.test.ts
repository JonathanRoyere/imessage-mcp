import { describe, expect, test } from "bun:test";

import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  test("uses safe defaults", () => {
    expect(loadConfig({})).toEqual({
      imsgBin: "imsg",
      commandTimeoutMs: 15_000,
      maxOutputBytes: 10 * 1_024 * 1_024,
    });
  });

  test("coerces environment values", () => {
    expect(
      loadConfig({
        IMESSAGE_MCP_IMSG_BIN: "/custom/imsg",
        IMESSAGE_MCP_COMMAND_TIMEOUT_MS: "2500",
        IMESSAGE_MCP_MAX_OUTPUT_BYTES: "4096",
      }),
    ).toEqual({
      imsgBin: "/custom/imsg",
      commandTimeoutMs: 2500,
      maxOutputBytes: 4096,
    });
  });
});
