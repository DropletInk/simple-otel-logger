import type {
  LogRecordExporter,
  ReadableLogRecord,
} from "@opentelemetry/sdk-logs";
import type { ExportResult } from "@opentelemetry/core";
import { ExportResultCode } from "@opentelemetry/core";
import util from "util";

/**
 * Canonical shape both exporters emit. Field NAMES and ORDER must stay
 * identical between dev console output and docker JSON output, or cross
 * environment debugging becomes a guessing game.
 */
function toRecord(log: ReadableLogRecord) {
  const [seconds, nanos] = log.hrTime;

  return {
    resource: {
      attributes: log.resource.attributes,
    },
    instrumentationScope: {
      name: log.instrumentationScope.name,
      version: log.instrumentationScope.version,
      schemaUrl: log.instrumentationScope.schemaUrl,
    },
    timestamp: seconds * 1_000_000 + Math.floor(nanos / 1000),
    traceId: log.spanContext?.traceId,
    spanId: log.spanContext?.spanId,
    traceFlags: log.spanContext?.traceFlags,
    severityText: log.severityText,
    severityNumber: log.severityNumber,
    eventName: log.eventName,
    body: log.body,
    attributes: log.attributes,
  };
}

/**
 * Used for docker / non-dev. One JSON object per line, same fields/order
 * as the dev console dump below — nothing renamed, nothing flattened.
 */
export class JsonConsoleLogRecordExporter implements LogRecordExporter {
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const log of logs) {
      process.stdout.write(JSON.stringify(toRecord(log)) + "\n");
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "\x1b[31m",
  WARN: "\x1b[33m",
  INFO: "\x1b[36m",
  DEBUG: "\x1b[90m",
};
const RESET = "\x1b[0m";

/**
 * Used for dev. Prints the exact same raw-object dump Node's default
 * console.log(record) produces (unquoted keys, multi-line, util.inspect
 * formatting) — just with the severityText/eventName lines colorized so
 * levels are easy to pick out at a glance. No fields added/removed/renamed.
 */
export class PrettyConsoleLogRecordExporter implements LogRecordExporter {
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const log of logs) {
      const record = toRecord(log);
      const color = LEVEL_COLOR[record.severityText ?? "INFO"] ?? "";

      // Plain util.inspect dump — identical to what console.log(record) emits.
      let out = util.inspect(record, {
        depth: null,
        colors: false,
        compact: false,
      });

      // Colorize just the severityText value, in place, on its own line.
      out = out.replace(
        /(severityText: ')([^']*)(')/,
        `$1${color}$2${RESET}$3`,
      );

      // Colorize the eventName value too, if present.
      if (record.eventName) {
        out = out.replace(
          /(eventName: ')([^']*)(')/,
          `$1${color}$2${RESET}$3`,
        );
      }

      console.log(out);
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}