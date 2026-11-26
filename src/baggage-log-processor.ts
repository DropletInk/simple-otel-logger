import { context as otelContext, propagation, type Context } from "@opentelemetry/api"
import type { LogRecordProcessor, SdkLogRecord } from "@opentelemetry/sdk-logs"
import { getBaggageKeys } from "./baggage.js"

export interface BaggageLogProcessorOptions {
  keys?: readonly string[]
  prefix?: string
  filter?: (key: string) => boolean
}

export class BaggageLogRecordProcessor implements LogRecordProcessor {
  private readonly prefix: string

  constructor(private readonly options: BaggageLogProcessorOptions = {}) {
    this.prefix = options.prefix ?? ""
  }

  onEmit(logRecord: SdkLogRecord, ctx?: Context): void {
    const bag = propagation.getBaggage(ctx ?? otelContext.active())
    if (!bag) return

    const keys = this.options.keys ?? getBaggageKeys()
    for (const key of keys) {
      if (this.options.filter && !this.options.filter(key)) continue
      const value = bag.getEntry(key)?.value
      if (value !== undefined) logRecord.setAttribute(`${this.prefix}${key}`, value)
    }
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}