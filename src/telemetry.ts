import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { LoggerProvider, BatchLogRecordProcessor, SimpleLogRecordProcessor, ConsoleLogRecordExporter } from "@opentelemetry/sdk-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { logs } from "@opentelemetry/api-logs"

let started = false

export interface TelemetryConfig {
  serviceName: string
  environment?: string
  exporterUrl: string
  metricsExporterUrl?: string   
  logsExporterUrl?: string
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
    [ATTR_SERVICE_NAME]: config.serviceName,
    "deployment.environment": config.environment ?? "dev",
  })

const logProcessors = []

if (config.environment !== "production") {
  logProcessors.push(
    new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
  )
}

if (config.logsExporterUrl) {
  logProcessors.push(
    new BatchLogRecordProcessor(
      new OTLPLogExporter({ url: config.logsExporterUrl })
    )
  )
}

const loggerProvider = new LoggerProvider({
  resource,
  processors: logProcessors,   
})

logs.setGlobalLoggerProvider(loggerProvider)
  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    metricReader, 
    logRecordProcessor: new BatchLogRecordProcessor(   // ← add this
      new OTLPLogExporter({ url: config.logsExporterUrl })
    ),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
  started = true
}