// telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"

let started = false

export function initTelemetry() {
  if (started) return

  const sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations()
    ],
  })

  sdk.start()
  started = true
}