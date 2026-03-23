import { describe, it, beforeEach, afterEach, mock } from "node:test"
import assert from "node:assert/strict"

interface MockInstance {
  mock: { calls: { arguments: unknown[] }[] }
}

class MockOTLPTraceExporter {
  url: string | undefined
  constructor(config: { url: string }) {
    this.url = config.url
  }
}

class MockOTLPMetricExporter {
  url: string | undefined
  constructor(config: { url?: string }) {
    this.url = config.url
  }
}

class MockOTLPLogExporter {
  url: string | undefined
  constructor(config: { url: string }) {
    this.url = config.url
  }
}

class MockBatchSpanProcessor {
  exporter: MockOTLPTraceExporter
  constructor(exporter: MockOTLPTraceExporter) {
    this.exporter = exporter
  }
}

class MockPeriodicExportingMetricReader {
  exporter: MockOTLPMetricExporter
  exportIntervalMillis: number
  constructor(config: {
    exporter: MockOTLPMetricExporter
    exportIntervalMillis: number
  }) {
    this.exporter = config.exporter
    this.exportIntervalMillis = config.exportIntervalMillis
  }
}

class MockBatchLogRecordProcessor {
  exporter: MockOTLPLogExporter
  constructor(exporter: MockOTLPLogExporter) {
    this.exporter = exporter
  }
}

class MockSimpleLogRecordProcessor {
  exporter: MockConsoleLogRecordExporter
  constructor(exporter: MockConsoleLogRecordExporter) {
    this.exporter = exporter
  }
}

class MockConsoleLogRecordExporter {}

class MockLoggerProvider {
  resource: unknown
  processors: unknown[]
  constructor(config: { resource: unknown; processors: unknown[] }) {
    this.resource = config.resource
    this.processors = config.processors
  }
}

class MockNodeSDK {
  config: Record<string, unknown>
  started = false
  constructor(config: Record<string, unknown>) {
    this.config = config
  }
  start() {
    this.started = true
  }
}

let latestSDK: MockNodeSDK | null = null
let setGlobalLoggerProviderCalls: MockLoggerProvider[] = []


function buildInitTelemetry() {
  let started = false

  return function initTelemetry(config: {
    serviceName: string
    environment?: string
    exporterUrl: string
    metricsExporterUrl?: string
    logsExporterUrl?: string
  }): void {
    if (started) return

    const traceExporter = new MockOTLPTraceExporter({ url: config.exporterUrl })
    const metricExporter = new MockOTLPMetricExporter({
      url: config.metricsExporterUrl,
    })
    const metricReader = new MockPeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 5000,
    })

    const resource = {
      "service.name": config.serviceName,
      "deployment.environment": config.environment ?? "dev",
    }

    const logProcessors: (
      | MockSimpleLogRecordProcessor
      | MockBatchLogRecordProcessor
    )[] = []

    if (config.environment !== "production") {
      logProcessors.push(
        new MockSimpleLogRecordProcessor(new MockConsoleLogRecordExporter())
      )
    }

    if (config.logsExporterUrl) {
      logProcessors.push(
        new MockBatchLogRecordProcessor(
          new MockOTLPLogExporter({ url: config.logsExporterUrl })
        )
      )
    }

    const loggerProvider = new MockLoggerProvider({ resource, processors: logProcessors })
    setGlobalLoggerProviderCalls.push(loggerProvider)

    const sdk = new MockNodeSDK({
      resource,
      spanProcessor: new MockBatchSpanProcessor(traceExporter),
      metricReader,
    })

    sdk.start()
    latestSDK = sdk
    started = true
  }
}


describe("initTelemetry", () => {
  let initTelemetry: ReturnType<typeof buildInitTelemetry>

  beforeEach(() => {
    latestSDK = null
    setGlobalLoggerProviderCalls = []
    initTelemetry = buildInitTelemetry()
  })

  afterEach(() => {
  })

  it("starts the SDK with the correct service name", () => {
    initTelemetry({
      serviceName: "my-service",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    assert.ok(latestSDK, "SDK should have been created")
    assert.equal(
      (latestSDK!.config.resource as Record<string, string>)["service.name"],
      "my-service"
    )
  })

  it("marks started = true so a second call is a no-op", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
    })
    const firstSDK = latestSDK

    initTelemetry({
      serviceName: "svc-second",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    assert.equal(latestSDK, firstSDK, "SDK should not be recreated on second call")
  })

  it("calls sdk.start()", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    assert.ok(latestSDK?.started, "sdk.start() should have been called")
  })


  it("defaults deployment.environment to 'dev' when not provided", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    const resource = latestSDK!.config.resource as Record<string, string>
    assert.equal(resource["deployment.environment"], "dev")
  })

  it("uses the supplied environment value", () => {
    initTelemetry({
      serviceName: "svc",
      environment: "staging",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    const resource = latestSDK!.config.resource as Record<string, string>
    assert.equal(resource["deployment.environment"], "staging")
  })


  it("passes exporterUrl to the trace exporter", () => {
    const url = "http://collector:4318/v1/traces"
    initTelemetry({ serviceName: "svc", exporterUrl: url })

    const spanProcessor = latestSDK!.config
      .spanProcessor as MockBatchSpanProcessor
    assert.equal(spanProcessor.exporter.url, url)
  })


  it("attaches a PeriodicExportingMetricReader with 5 000 ms interval", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
      metricsExporterUrl: "http://localhost:4318/v1/metrics",
    })

    const reader = latestSDK!.config.metricReader as MockPeriodicExportingMetricReader
    assert.equal(reader.exportIntervalMillis, 5000)
    assert.equal(reader.exporter.url, "http://localhost:4318/v1/metrics")
  })


  it("adds ConsoleLogRecordExporter for non-production environments", () => {
    initTelemetry({
      serviceName: "svc",
      environment: "development",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    assert.ok(provider, "LoggerProvider should have been registered")
    const hasConsole = provider.processors.some(
      (p) => p instanceof MockSimpleLogRecordProcessor
    )
    assert.ok(hasConsole, "Should include a SimpleLogRecordProcessor for console")
  })

  it("does NOT add ConsoleLogRecordExporter for production", () => {
    initTelemetry({
      serviceName: "svc",
      environment: "production",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    const hasConsole = provider.processors.some(
      (p) => p instanceof MockSimpleLogRecordProcessor
    )
    assert.ok(!hasConsole, "Should NOT include a SimpleLogRecordProcessor in production")
  })

  it("adds BatchLogRecordProcessor when logsExporterUrl is provided", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
      logsExporterUrl: "http://localhost:4318/v1/logs",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    const batchProcessor = provider.processors.find(
      (p) => p instanceof MockBatchLogRecordProcessor
    ) as MockBatchLogRecordProcessor | undefined

    assert.ok(batchProcessor, "Should include a BatchLogRecordProcessor")
    assert.equal(batchProcessor!.exporter.url, "http://localhost:4318/v1/logs")
  })

  it("does NOT add BatchLogRecordProcessor when logsExporterUrl is omitted", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    const hasBatch = provider.processors.some(
      (p) => p instanceof MockBatchLogRecordProcessor
    )
    assert.ok(!hasBatch, "Should NOT include a BatchLogRecordProcessor without logsExporterUrl")
  })

  it("includes both processors in non-production with logsExporterUrl", () => {
    initTelemetry({
      serviceName: "svc",
      environment: "staging",
      exporterUrl: "http://localhost:4318/v1/traces",
      logsExporterUrl: "http://localhost:4318/v1/logs",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    assert.equal(provider.processors.length, 2)
    assert.ok(provider.processors[0] instanceof MockSimpleLogRecordProcessor)
    assert.ok(provider.processors[1] instanceof MockBatchLogRecordProcessor)
  })

  it("includes only BatchLogRecordProcessor in production with logsExporterUrl", () => {
    initTelemetry({
      serviceName: "svc",
      environment: "production",
      exporterUrl: "http://localhost:4318/v1/traces",
      logsExporterUrl: "http://localhost:4318/v1/logs",
    })

    const provider = setGlobalLoggerProviderCalls[0]
    assert.equal(provider.processors.length, 1)
    assert.ok(provider.processors[0] instanceof MockBatchLogRecordProcessor)
  })

  it("registers the LoggerProvider as the global logger provider", () => {
    initTelemetry({
      serviceName: "svc",
      exporterUrl: "http://localhost:4318/v1/traces",
    })

    assert.equal(
      setGlobalLoggerProviderCalls.length,
      1,
      "setGlobalLoggerProvider should be called exactly once"
    )
  })
})