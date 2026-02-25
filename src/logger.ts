import { context, trace } from "@opentelemetry/api"
import pino from "pino"
import fs from "fs"
import path from "path"

const logFilePath = path.join(process.cwd(), "app.log")

export type LogLevel = "info" | "error" | "debug" | "warn"

export interface LoggerOptions {
  serviceName?: string
}

export interface LogRecord<T = unknown> {
  message: string
  data?: T
  traceId?: string
  spanId?: string
  level?: LogLevel
  service?: string
  timestamp?: string
}

export interface Logger {
  log(level: LogLevel, record: LogRecord): void

  info<T = unknown>(message: string, data?: T): void
  error<T = unknown>(message: string, data?: T): void
  debug<T = unknown>(message: string, data?: T): void
  warn<T = unknown>(message: string, data?: T): void
}

export function getOtelContext() {
  const span = trace.getSpan(context.active())
  if (!span) return {}

  const sc = span.spanContext()

  return {
    traceId: sc.traceId,
    spanId: sc.spanId,
  }
}

export class ConsoleLogger implements Logger {
  constructor(private options: LoggerOptions = {}) {}

  buildRecord(level: LogLevel, message: string, data?: any) {
    return {
      level,
      message,
      service: this.options.serviceName,
      timestamp: new Date().toISOString(),
      ...getOtelContext(),
      data,
    }
  }

  log(level: LogLevel, record: any) {
    const out = JSON.stringify(record)

    fs.appendFileSync(logFilePath, out)

    switch (level) {
      case "info":
        console.info(out)
        break

      case "debug":
        console.debug(out)
        break

      case "warn":
        console.warn(out)  
        break

      case "error":
        console.error(out)  
        break

      default:
        console.log(out)
    }
  }

  info(message: string, data?: any): void {
    const record = this.buildRecord("info", message, data)
    this.log("info", record)
  }

  error(message: string, data?: any): void {
    const record = this.buildRecord("error", message, data)
    this.log("error", record)
  }

  debug(message: string, data?: any): void {
    const record = this.buildRecord("debug", message, data)
    this.log("debug", record)
  }

  warn(message: string, data?: any): void {
    const record = this.buildRecord("warn", message, data)
    this.log("warn", record)
  }
}

export class PinoLogger implements Logger {
  private logger = pino(
    {},
    pino.destination({
      dest: "app.log",
      sync: false,
    })
  )

  log(level: LogLevel, record: any): void {
    this.logger[level](record, record.message)
  }

  info(msg: string, data?: any) {
    const record = {
      message: msg,
      ...getOtelContext(),
      data,
    }
    this.log("info", record)
  }

  error(msg: string, data?: any) {
    const record = {
      message: msg,
      ...getOtelContext(),
      data,
    }
    this.log("error", record)
  }

  warn(msg: string, data?: any) {
    const record = {
      message: msg,
      ...getOtelContext(),
      data,
    }
    this.log("warn", record)
  }

  debug(msg: string, data?: any) {
    const record = {
      message: msg,
      ...getOtelContext(),
      data,
    }
    this.log("debug", record)
  }
}
