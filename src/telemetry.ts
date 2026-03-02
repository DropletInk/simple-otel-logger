// telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express"

let started = false

export function initTelemetry() {
  if (started) return

  const sdk = new NodeSDK({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  })

  sdk.start()
  started = true
}