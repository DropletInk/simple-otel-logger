import { NodeSDK } from "@opentelemetry/sdk-node"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics"

import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"

let started = false

export interface TelemetryConfig {
  serviceName: string
  environment?: string
  exporterUrl: string
  metricsExporterUrl?: string   
}

export function initTelemetry(config: TelemetryConfig) {
  if (started) return

  const traceExporter = new OTLPTraceExporter({
    url: config.exporterUrl,
  })

  const metricExporter = new OTLPMetricExporter({
    url: config.metricsExporterUrl,
  })

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000, 
  })

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    "deployment.environment": config.environment ?? "dev",
  })

  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    metricReader, 
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
  started = true
}