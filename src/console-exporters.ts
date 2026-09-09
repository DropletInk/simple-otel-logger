import type {
  LogRecordExporter,
  ReadableLogRecord,
} from "@opentelemetry/sdk-logs";
import type { ExportResult } from "@opentelemetry/core";
import { ExportResultCode } from "@opentelemetry/core";
import util from "util";

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
 */
export class SingleLineJsonLogRecordExporter implements LogRecordExporter {
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
  ERROR: "\x1b[31m", // red
  WARN: "\x1b[33m", // yellow
  INFO: "\x1b[32m", // green
  DEBUG: "\x1b[34m", // blue
};
const RESET = "\x1b[0m";

const COLORIZED_FIELDS = ["severityText", "eventName", "body", "traceId"] as const;

const COLORIZED_QUOTED_FIELDS = [
  "service.name",
  "deployment.environment",
] as const;

function colorizeQuotedFields(
  out: string,
  color: string,
  fields: readonly string[],
): string {
  for (const field of fields) {
    const escaped = field.replace(/\./g, "\\.");
    const pattern = new RegExp(`('${escaped}': ')([^']*)(')`);
    out = out.replace(pattern, `$1${color}$2${RESET}$3`);
  }
  return out;
}

/**
 * Colorizes the value of each named field
 */
function colorizeFields(
  out: string,
  color: string,
  fields: readonly string[],
): string {
  for (const field of fields) {
    const pattern = new RegExp(`(${field}: ')([^']*)(')`);
    out = out.replace(pattern, `$1${color}$2${RESET}$3`);
  }
  return out;
}

/**
 * Used for development
 */
export class MultiLineJsonLogRecordExporter implements LogRecordExporter {
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const log of logs) {
      const record = toRecord(log);
      const color = LEVEL_COLOR[record.severityText ?? "INFO"] ?? "";

      let out = util.inspect(record, {
        depth: null,
        colors: false,
        compact: false,
      });

      out = colorizeFields(out, color, COLORIZED_FIELDS);
      out = colorizeQuotedFields(out, color, COLORIZED_QUOTED_FIELDS);

      console.log(out);
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
