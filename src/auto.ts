import { initTelemetry } from "./telemetry.js"

const config = {
  serviceName: process.env.OTEL_SERVICE_NAME ||"unknown service",
  environment: process.env.NODE_ENV || "development",
  traceexporterUrl: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  //metricexporterUrl: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
}

if (config.serviceName) {
  initTelemetry(config)
}