import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
  LoggerProvider,
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
  type LogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { logs } from "@opentelemetry/api-logs"
import {
  SingleLineJsonLogRecordExporter,
  MultiLineJsonLogRecordExporter,
} from "./console-exporters.js"
import { BaggageLogRecordProcessor } from "./baggage-log-processor.js"
import { BaggageSpanProcessor } from "./baggage-span-processor.js"
import { DEFAULT_BAGGAGE_KEYS, setBaggageKeys } from "./baggage.js"

let started = false
let sdkRef: NodeSDK | undefined
let loggerProviderRef: LoggerProvider | undefined

export interface TelemetryConfig {
  serviceName: string
  environment?: string
  exporterUrl: string
  metricsExporterUrl?: string
  logsExporterUrl?: string
  baggageKeys?: string[]
}

function keysFromEnv(): string[] | undefined {
  const raw = process.env.OTEL_BAGGAGE_LOG_KEYS
  if (!raw) return undefined
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
}

function buildLogProcessors(config: TelemetryConfig): LogRecordProcessor[] {
  const processors: LogRecordProcessor[] = [new BaggageLogRecordProcessor()]

  if (config.environment === "development") {
    processors.push(new SimpleLogRecordProcessor(new MultiLineJsonLogRecordExporter()))
  } else if (process.env.OTEL_LOG_CONSOLE === "true") {
    processors.push(new SimpleLogRecordProcessor(new SingleLineJsonLogRecordExporter()))
  }

  if (config.logsExporterUrl) {
    processors.push(
      new BatchLogRecordProcessor(new OTLPLogExporter({ url: config.logsExporterUrl }))
    )
  }

  return processors
}

function buildSpanProcessors(config: TelemetryConfig): SpanProcessor[] {
  const processors: SpanProcessor[] = [
    new BaggageSpanProcessor(),
    new BatchSpanProcessor(new OTLPTraceExporter({ url: config.exporterUrl })),
  ]

  if (process.env.OTEL_LOG_CONSOLE === "true") {
    processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()))
  }

  return processors
}

function createSdk(config: TelemetryConfig): NodeSDK {
  setBaggageKeys(config.baggageKeys ?? keysFromEnv() ?? DEFAULT_BAGGAGE_KEYS)

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    "deployment.environment": config.environment ?? "dev",
  })

  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: config.metricsExporterUrl }),
    exportIntervalMillis: 5000,
  })

  loggerProviderRef = new LoggerProvider({
    resource,
    processors: buildLogProcessors(config),
  })
  logs.setGlobalLoggerProvider(loggerProviderRef)

  return new NodeSDK({
    resource,
    spanProcessors: buildSpanProcessors(config),
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  })
}

/** Create and start telemetry immediately. */
export function initTelemetry(config: TelemetryConfig): void {
  if (started) return
  sdkRef = createSdk(config)
  sdkRef.start()
  started = true
}

/** Returns a function that starts telemetry later (or undefined if already started). */
export function getTelemetrySdkInitializer(config: TelemetryConfig) {
  if (started) return undefined
  const sdk = createSdk(config)

  return () => {
    sdk.start()
    sdkRef = sdk
    started = true
  }
}

/** Flush and stop. Call on SIGTERM so the last logs/spans are not lost. */
export async function shutdownTelemetry(): Promise<void> {
  await Promise.allSettled([sdkRef?.shutdown(), loggerProviderRef?.shutdown()])
  started = false
}