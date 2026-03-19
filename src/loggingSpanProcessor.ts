import {
  SpanProcessor,
  ReadableSpan,
} from "@opentelemetry/sdk-trace-base"

import { Logger } from "./logger.js"

export class LoggingSpanProcessor implements SpanProcessor {
  constructor(private logger: Logger) {}

  onStart() {}

  onEnd(span: ReadableSpan) {
    const durationMs =
      (span.endTime[0] - span.startTime[0]) * 1000 +
      (span.endTime[1] - span.startTime[1]) / 1e6

    const ctx = span.spanContext()

    this.logger.info(`${span.name} -> (Done)`, {
      durationMs,
    })
  }

  shutdown() {
    return Promise.resolve()
  }

  forceFlush() {
    return Promise.resolve()
  }
}