import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";

let started = false;

export interface TelemetryConfig {
  serviceName: string;
  environment?: string;
  exporterUrl: string;
  metricsExporterUrl?: string;
  logsExporterUrl?: string;
}

type LogDestination = "console" | "otlp" | "all" | "none";

function getLogDestination(): LogDestination {
  const value = process.env.OTEL_LOG_DESTINATION?.toLocaleLowerCase();
  if (
    value === "console" ||
    value === "otlp" ||
    value === "all" ||
    value === "none"
  ) {
    return value;
  }
  return "otlp";
}

export function initTelemetry(config: TelemetryConfig) {
  if (started) return;

  const traceExporter = new OTLPTraceExporter({
    url: config.exporterUrl,
  });

  const metricExporter = new OTLPMetricExporter({
    url: config.metricsExporterUrl,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  });

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    "deployment.environment": config.environment ?? "dev",
  });

  const logDestination = getLogDestination();
  const logProcessors = [];

  if (logDestination === "console" || logDestination === "all") {
    logProcessors.push(
      new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    );
  }

  if (
    (logDestination === "otlp" || logDestination === "all") &&
    config.logsExporterUrl
  ) {
    logProcessors.push(
      new BatchLogRecordProcessor(
        new OTLPLogExporter({ url: config.logsExporterUrl }),
      ),
    );
  }

  const loggerProvider = new LoggerProvider({
    resource,
    processors: logProcessors,
  });

  logs.setGlobalLoggerProvider(loggerProvider);

  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  started = true;
}

export function getTelemetrySdkInitializer(config: TelemetryConfig) {
  if (started) return;

  const traceExporter = new OTLPTraceExporter({
    url: config.exporterUrl,
  });

  const metricExporter = new OTLPMetricExporter({
    url: config.metricsExporterUrl,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  });

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    "deployment.environment": config.environment ?? "dev",
  });

  const spanProcessors: SpanProcessor[] = [
    new BatchSpanProcessor(traceExporter),
  ];

  if (
    config.environment !== "production" ||
    process.env.OTEL_LOG_CONSOLE === "true"
  ) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  const logDestination = getLogDestination();
  const logProcessors = [];

  if (logDestination === "console" || logDestination === "all") {
    logProcessors.push(
      new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    );
  }

  if (
    (logDestination === "otlp" || logDestination === "all") &&
    config.logsExporterUrl
  ) {
    logProcessors.push(
      new BatchLogRecordProcessor(
        new OTLPLogExporter({ url: config.logsExporterUrl }),
      ),
    );
  }

  const loggerProvider = new LoggerProvider({
    resource,
    processors: logProcessors,
  });

  logs.setGlobalLoggerProvider(loggerProvider);

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  return () => {
    sdk.start();
    started = true;
  };
}
