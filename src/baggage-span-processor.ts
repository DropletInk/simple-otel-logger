import { propagation, type Context } from "@opentelemetry/api"
import type { Span, SpanProcessor } from "@opentelemetry/sdk-trace-base"
import { getBaggageKeys } from "./baggage.js"

export class BaggageSpanProcessor implements SpanProcessor {
  constructor(private readonly keys?: readonly string[]) {}

  onStart(span: Span, parentContext: Context): void {
    const bag = propagation.getBaggage(parentContext)
    if (!bag) return

    for (const key of this.keys ?? getBaggageKeys()) {
      const value = bag.getEntry(key)?.value
      if (value !== undefined) span.setAttribute(key, value)
    }
  }

  onEnd(): void {}

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }
}