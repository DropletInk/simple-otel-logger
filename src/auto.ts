import 'dotenv/config' 
import { getTelemetrySdkInitializer } from "./telemetry.js"
const traceUrl = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
const metricURL = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
const logsURL = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT

if (!traceUrl) {
  throw new Error("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is missing")
}

const config = {
  serviceName: process.env.OTEL_SERVICE_NAME ||"unknown service",
  environment: process.env.NODE_ENV || "development",
  exporterUrl: traceUrl,
  metricsExporterUrl: metricURL,
  logsExporterUrl: logsURL
}

if (config.serviceName) {
  getTelemetrySdkInitializer(config)
}