import { context, trace } from "@opentelemetry/api"

export type LogLevel = "info" | "error" | "debug" | "warn"

export interface LoggerOptions {
  serviceName?: string
}

export class Logger {
  constructor(private options: LoggerOptions = {}) {}

  private getOtelContext() {
    const span = trace.getSpan(context.active())

    if (!span) return {}

    const sc = span.spanContext()

    return {
      traceId: sc.traceId,
      spanId: sc.spanId,
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    const record = {
      level,
      message,
      service: this.options.serviceName,
      timestamp: new Date().toISOString(),
      ...this.getOtelContext(),
      data,
    }

    console.log(JSON.stringify(record))
  }

  info(msg: string, data?: any) {
    this.log("info", msg, data)
  }

  error(msg: string, data?: any) {
    this.log("error", msg, data)
  }

  debug(msg: string, data?: any) {
    this.log("debug", msg, data)
  }

  warn(msg: string, data?: any) {
    this.log("warn", msg, data)
  }
}
