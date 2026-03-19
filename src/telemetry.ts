import { NodeSDK } from "@opentelemetry/sdk-node"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { LoggingSpanProcessor } from "./loggingSpanProcessor.js"
import type { Logger } from "./logger.js"

let started = false

interface TelemetryOptions {
  logger?: Logger
}

export function initTelemetry(options: TelemetryOptions = {}) {
  if (started) return

  const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    ...(options.logger && {
      spanProcessor: new LoggingSpanProcessor(options.logger),
    }),
  })

  sdk.start()
  started = true
}