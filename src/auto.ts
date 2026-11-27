import dotenv from "dotenv"

dotenv.config()

import { initTelemetry } from "./telemetry.js"

const traceUrl = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
const metricsUrl = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
const logsUrl = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT

if (!traceUrl) {
  throw new Error("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is missing")
}

const baggageKeys = (process.env.BAGGAGE_KEYS ?? "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean)

initTelemetry({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "unknown-service",
  environment: process.env.NODE_ENV ?? "development",
  exporterUrl: traceUrl,
  metricsExporterUrl: metricsUrl,
  logsExporterUrl: logsUrl,
  baggageKeys,
})