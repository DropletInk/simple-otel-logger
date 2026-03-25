import { context, trace } from "@opentelemetry/api"
import pino, { Logger as PinoInstance } from "pino"
import { logs, SeverityNumber ,type AnyValueMap} from "@opentelemetry/api-logs"

export type LogLevel = "info" | "error" | "debug" | "warn"

export interface LoggerOptions {
  base?: AnyValueMap
  customLevels?:string
}

export type LogInput = {
  eventName?: string
} & AnyValueMap

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
  log<T>(level: LogLevel, record: LogRecord<T>, event?: string): void
  
  info<T>(message: string, data?: T, event?: string): void
  error<T>(message: string, data?: T, event?: string): void
  debug<T>(message: string, data?: T, event?: string): void
  warn<T>(message: string, data?: T, event?: string): void

  buildRecord<T>(level: LogLevel, message: string, data?: T):LogRecord<T>
}

export function getTracer(name?: string) {
  return trace.getTracer(name ?? "default-tracer")
}
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  logger?: Logger
): Promise<T> {
  const tracer = getTracer(name)

  return tracer.startActiveSpan(name, async (span) => {

    try {
      return await fn()
    } catch (err) {
      span.recordException(err as Error)
      span.setAttributes({
        "app.success": false,
      })
      span.setStatus({ code: 2 })
      throw err
    } finally {

      span.setAttributes({
        "app.operation": name,
        "app.success": true,
      })

      if (logger) {
        logger.info(`${name} -> (Done)`)
      }

      span.end()
    }
  })
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

const SEVERITY: Record<string, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info:  SeverityNumber.INFO,
  warn:  SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
}

export class OtelLogger {
  private otelLogger = logs.getLogger("simple-otel-logger", "1.0.0")

  constructor(private options: LoggerOptions = {}) {}

  private emit(level: LogLevel, message: string, input?: LogInput) {
    const { eventName, ...data } = input ?? {}

    this.otelLogger.emit({
      eventName,
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: message,
      attributes: {
        ...(this.options.base ?? {}),
        ...(data ?? {}),
      },
    })
  }

  info(message: string, input?: LogInput) {
    this.emit("info", message, input)
  }

  debug(message: string, input?: LogInput) {
    this.emit("debug", message, input)
  }

  warn(message: string, input?: LogInput) {
    this.emit("warn", message, input)
  }

  error(message: string, input?: LogInput) {
    this.emit("error", message, input)
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