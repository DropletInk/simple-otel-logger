import { context, trace } from "@opentelemetry/api"
import pino, { Logger as PinoInstance } from "pino"

export type LogLevel = "info" | "error" | "debug" | "warn"

export interface LoggerOptions {
  base?:Record<string,unknown>
  customLevels?:string
}

export interface LogRecord<T> {
  message: string
  data?: T
  traceId?: string
  spanId?: string
  level: LogLevel | string
  timestamp?: string
  [key:string]: unknown
}

export interface Logger {
  log<T>(level: LogLevel, record: LogRecord<T>): void

  info<T>(message: string, data?: T): void
  error<T>(message: string, data?: T): void
  debug<T>(message: string, data?: T): void
  warn<T>(message: string, data?: T): void

  buildRecord<T>(level: LogLevel, message: string, data?: T):LogRecord<T>
}

export function getOtelContext(): { traceId?: string; spanId?: string }{
  const span = trace.getSpan(context.active())

  //console.log(trace.getSpan(context.active()))
  if (!span) return {}

  const sc = span.spanContext()

  return {
    traceId: sc.traceId,
    spanId: sc.spanId,
  }
}

export class ConsoleLogger implements Logger {
  constructor(private options: LoggerOptions = {}) {}

  buildRecord<T>(level: LogLevel | string, message: string, data?: T):LogRecord<T> {
    return {
      level: this.options.customLevels ?? level ,
      timestamp: new Date().toISOString(),
      ...(this.options.base ?? {}),
      message,
      ...getOtelContext(),
      data,
    }
  }

  log<T>(level: LogLevel, record:LogRecord<T>) {
    const out = JSON.stringify(record)

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

  info<T>(message: string, data?: T): void {
    const record = this.buildRecord("info", message, data)
    this.log("info", record)
  }

  error<T>(message: string, data?: T): void {
    const record = this.buildRecord("error", message, data)
    this.log("error", record)
  }

  debug<T>(message: string, data?: T): void {
    const record = this.buildRecord("debug", message, data)
    this.log("debug", record)
  }

  warn<T>(message: string, data?: T): void {
    const record = this.buildRecord("warn", message, data)
    this.log("warn", record)
  }
}


export class PinoLogger implements Logger {

  private logger: PinoInstance

  constructor(private options: LoggerOptions = {}) {
    this.logger = pino({
      base: {
        ...(this.options.base ?? {}),
      }
    })
  }

  buildRecord<T>(level: LogLevel, message: string, data?: T): LogRecord<T> {
    return {
      level: this.options.customLevels ?? level ,
      ...(this.options.base),
      timestamp: new Date().toISOString(),
      message,
      ...getOtelContext(),
      ...(data !== undefined && { data })
    }
  }

  log<T>(level: LogLevel, record: LogRecord<T>): void {
    this.logger[level](record)
  }

  info<T>(message: string, data?: T): void {
    const record = this.buildRecord("info", message, data)
    this.log("info", record)
  }

  error<T>(message: string, data?: T): void {
    const record = this.buildRecord("error", message, data)
    this.log("error", record)
  }

  warn<T>(message: string, data?: T): void {
    const record = this.buildRecord("warn", message, data)
    this.log("warn", record)
  }

  debug<T>(message: string, data?: T): void {
    const record = this.buildRecord("debug", message, data)
    this.log("debug", record)
  }
}