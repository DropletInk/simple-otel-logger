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

export interface LogRecord {
  level: LogLevel | string
  message: string
  attributes?: AnyValueMap
  eventName?: string
  timestamp?: string
}

export interface Logger {
  log(level: LogLevel, record: LogRecord): void

  info(message: string, input?: LogInput): void
  error(message: string, input?: LogInput): void
  debug(message: string, input?: LogInput): void
  warn(message: string, input?: LogInput): void

  buildRecord(level: LogLevel, message: string, input?: LogInput): LogRecord
}

export function getTracer(name?: string) {
  return trace.getTracer(name ?? "default-tracer")
}

export function getOtelContext(): AnyValueMap {
  const span = trace.getSpan(context.active())
  if (!span) return {}

  const sc = span.spanContext()

  return {
    traceId: sc.traceId,
    spanId: sc.spanId,
  }
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
      span.setStatus({ code: 2 })
      throw err
    } finally {
      span.setAttributes({
        "app.operation": name,
        "app.success": true,
      })

      logger?.info(`${name} -> (Done)`)

      span.end()
    }
  })
}


const SEVERITY: Record<string, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info:  SeverityNumber.INFO,
  warn:  SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
}

export class OtelLogger implements Logger {
  private otelLogger = logs.getLogger("otel-logger")

  constructor(private options: LoggerOptions = {}) {}

  buildRecord(level: LogLevel, message: string, input?: LogInput): LogRecord {
    const { eventName, ...attributes } = input ?? {}

    return {
      level,
      message,
      eventName,
      attributes: {
        ...(this.options.base ?? {}),
        ...(attributes ?? {}),
      },
    }
  }

  log(level: LogLevel, record: LogRecord): void {
    this.otelLogger.emit({
      eventName: record.eventName,
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: record.message,
      attributes: record.attributes,
    })
  }

  info(message: string, input?: LogInput): void {
    this.log("info", this.buildRecord("info", message, input))
  }

  error(message: string, input?: LogInput): void {
    this.log("error", this.buildRecord("error", message, input))
  }

  debug(message: string, input?: LogInput): void {
    this.log("debug", this.buildRecord("debug", message, input))
  }

  warn(message: string, input?: LogInput): void {
    this.log("warn", this.buildRecord("warn", message, input))
  }
}

export class ConsoleLogger implements Logger {
  constructor(private options: LoggerOptions = {}) {}

  buildRecord(level: LogLevel, message: string, input?: LogInput): LogRecord {
    const { eventName, ...attributes } = input ?? {}

    return {
      level: this.options.customLevels ?? level,
      message,
      eventName,
      timestamp: new Date().toISOString(),
      attributes: {
        ...(this.options.base ?? {}),
        ...getOtelContext(),
        ...(attributes ?? {}),
      },
    }
  }

  log(level: LogLevel, record: LogRecord): void {
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

  info(message: string, input?: LogInput): void {
    this.log("info", this.buildRecord("info", message, input))
  }

  error(message: string, input?: LogInput): void {
    this.log("error", this.buildRecord("error", message, input))
  }

  debug(message: string, input?: LogInput): void {
    this.log("debug", this.buildRecord("debug", message, input))
  }

  warn(message: string, input?: LogInput): void {
    this.log("warn", this.buildRecord("warn", message, input))
  }
}


export class PinoLogger implements Logger {
  private logger: PinoInstance

  constructor(private options: LoggerOptions = {}) {
    this.logger = pino({
      base: {
        ...(this.options.base ?? {}),
      },
    })
  }

  buildRecord(level: LogLevel, message: string, input?: LogInput): LogRecord {
    const { eventName, ...attributes } = input ?? {}

    return {
      level: this.options.customLevels ?? level,
      message,
      eventName,
      timestamp: new Date().toISOString(),
      attributes: {
        ...(this.options.base ?? {}),
        ...getOtelContext(),
        ...(attributes ?? {}),
      },
    }
  }

  log(level: LogLevel, record: LogRecord): void {
    this.logger[level](record)
  }

  info(message: string, input?: LogInput): void {
    this.log("info", this.buildRecord("info", message, input))
  }

  error(message: string, input?: LogInput): void {
    this.log("error", this.buildRecord("error", message, input))
  }

  warn(message: string, input?: LogInput): void {
    this.log("warn", this.buildRecord("warn", message, input))
  }

  debug(message: string, input?: LogInput): void {
    this.log("debug", this.buildRecord("debug", message, input))
  }
}