import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { AppConfig } from "../config.js";

const execFileAsync = promisify(execFile);

export class ImsgCommandError extends Error {
  constructor(
    message: string,
    readonly code?: string | number,
  ) {
    super(message);
    this.name = "ImsgCommandError";
  }
}

export class ImsgRunner {
  constructor(private readonly config: AppConfig) {}

  async run(args: readonly string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.config.imsgBin, [...args], {
        encoding: "utf8",
        timeout: this.config.commandTimeoutMs,
        maxBuffer: this.config.maxOutputBytes,
        windowsHide: true,
      });
      return stdout;
    } catch (error) {
      const commandError = error as NodeJS.ErrnoException & {
        killed?: boolean;
      };

      if (commandError.code === "ENOENT") {
        throw new ImsgCommandError(
          "The imsg executable was not found. Install it or set IMESSAGE_MCP_IMSG_BIN.",
          commandError.code,
        );
      }

      if (commandError.killed || commandError.code === "ETIMEDOUT") {
        throw new ImsgCommandError(
          `The imsg command exceeded the ${this.config.commandTimeoutMs} ms timeout.`,
          commandError.code,
        );
      }

      throw new ImsgCommandError(
        "The imsg command failed. Check macOS permissions and the local diagnostic logs.",
        commandError.code,
      );
    }
  }
}
