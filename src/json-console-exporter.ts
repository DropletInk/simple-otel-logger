import type {
  LogRecordExporter,
  ReadableLogRecord,
} from "@opentelemetry/sdk-logs";
import type { ExportResult } from "@opentelemetry/core";
import { ExportResultCode } from "@opentelemetry/core";

export class JsonConsoleLogRecordExporter implements LogRecordExporter {
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const log of logs) {
      process.stdout.write(
        JSON.stringify({
          timestamp: log.hrTime,
          severityText: log.severityText,
          severityNumber: log.severityNumber,
          eventName: log.eventName,
          body: log.body,
          attributes: log.attributes,
          traceId: log.spanContext?.traceId,
          spanId: log.spanContext?.spanId,
          resource: log.resource.attributes,
        }) + "\n",
      );
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
