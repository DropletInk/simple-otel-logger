import type { LogRecordExporter, ReadableLogRecord } from "@opentelemetry/sdk-logs"
import type { ExportResult } from "@opentelemetry/core"
import { ExportResultCode } from "@opentelemetry/core"
import util from "util"

const COLORS: Record<string, string> = {
  ERROR: "\x1b[31m", WARN: "\x1b[33m", INFO: "\x1b[36m", DEBUG: "\x1b[90m",
}
const RESET = "\x1b[0m"
const DIM = "\x1b[2m"

export class PrettyConsoleLogRecordExporter implements LogRecordExporter {
  export(logs: ReadableLogRecord[], resultCallback: (result: ExportResult) => void): void {
    for (const log of logs) {
      const color = COLORS[log.severityText ?? "INFO"] ?? ""
      const time = new Date(log.hrTime[0] * 1000).toISOString().split("T")[1].slice(0, -1)
      const service = log.resource.attributes["service.name"]

      let header = `${color}[${time}] ${log.severityText} (${service})${RESET}`
      if (log.eventName) header += ` ${color}${log.eventName}${RESET} -`
      header += ` ${log.body}`

      console.log(header)

      const attrs = log.attributes
      if (attrs && Object.keys(attrs).length) {
        const formatted = util.inspect(attrs, { depth: null, colors: true, compact: false })
        const indented = formatted
          .split("\n")
          .map(line => `    ${line}`)
          .join("\n")
        console.log(`${DIM}    attributes:${RESET}`)
        console.log(indented)
      }

      if (log.spanContext?.traceId) {
        console.log(`${DIM}    traceId: ${log.spanContext.traceId}  spanId: ${log.spanContext.spanId}${RESET}`)
      }
    }
    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}