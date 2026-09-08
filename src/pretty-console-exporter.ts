import type {
  LogRecordExporter,
  ReadableLogRecord,
} from "@opentelemetry/sdk-logs";
import type { ExportResult } from "@opentelemetry/core";
import { ExportResultCode } from "@opentelemetry/core";

const COLORS: Record<string, string> = {
  ERROR: "\x1b[31m",
  WARN: "\x1b[33m",
  INFO: "\x1b[36m",
  DEBUG: "\x1b[90m",
};
const RESET = "\x1b[0m";

export class PrettyConsoleLogRecordExporter implements LogRecordExporter {
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const log of logs) {
      const color = COLORS[log.severityText ?? "INFO"] ?? "";
      const time = new Date(log.hrTime[0] * 1000)
        .toISOString()
        .split("T")[1]
        .slice(0, -1);
      const service = log.resource.attributes["service.name"];

      let line = `${color}[${time}] ${log.severityText} (${service})${RESET}`;
      if (log.eventName) line += ` ${color}${log.eventName}${RESET} -`;
      line += ` ${log.body}`;

      console.log(line);

      const attrs = log.attributes;
      if (attrs && Object.keys(attrs).length) {
        console.log(`    attrs: ${JSON.stringify(attrs)}`);
      }
      if (log.spanContext?.traceId) {
        console.log(`    trace: ${log.spanContext.traceId}`);
      }
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
