// import * as opentelemetry from '@opentelemetry/sdk-node';
// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// import {
//   ATTR_SERVICE_NAME,
// } from '@opentelemetry/semantic-conventions';

// let started = false

// export interface TelemetryConfig {
//   serviceName: string
//   environment?: string
//   traceexporterUrl?: string 
//   metricexporterUrl?:string
// }

// export function initTelemetry(config: TelemetryConfig) {
//   if (started) return

//   // const exporter = new OTLPTraceExporter({
//   //   url: config.exporterUrl,
//   // })

//   const sdk = new opentelemetry.NodeSDK({
//     resource: resourceFromAttributes({
//       [ATTR_SERVICE_NAME]: config.serviceName
//     }),
//     traceExporter: new OTLPTraceExporter({
//     url: config.traceexporterUrl,
//     headers: {},
//     }),
//     metricReader: new PeriodicExportingMetricReader({
//       exporter: new OTLPMetricExporter({
//         url: config.metricexporterUrl, 
//         headers: {}, 
//       }),
//     }),
//     instrumentations: [
//       getNodeAutoInstrumentations(),
//     ],
//   })

//   sdk.start()
//   started = true
// }

import { NodeSDK } from "@opentelemetry/sdk-node"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
 import { resourceFromAttributes } from '@opentelemetry/resources';

let started = false

export interface TelemetryConfig {
  serviceName: string
  environment?: string
  exporterUrl?: string  
}

export function initTelemetry(config: TelemetryConfig) {
  if (started) return

  const exporter = new OTLPTraceExporter({
    url: config.exporterUrl,
  })

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      "deployment.environment": config.environment ?? "dev",
    }),

    spanProcessor: new BatchSpanProcessor(exporter),

    instrumentations: [
      getNodeAutoInstrumentations(),
    ],
  })

  sdk.start()
  started = true
}