# simple-otel-logger

## A lightweight structured logging and tracing utility for Node.js services using OpenTelemetry.

## It provides:
- Structured logging

- HTTP request/response logging middleware

- Automatic trace and span correlation

- Distributed tracing (Jaeger-compatible)

- Automatic telemetry initialization

- Zero-config telemetry bootstrap

## Features

- Structured JSON logging

- Automatic traceId and spanId injection

- HTTP request/response logging middleware

 - OpenTelemetry integration

- OTLP exporter support (traces, metrics, logs)

- Configurable log metadata

- Automatic telemetry bootstrap

- Environment-based configuration

## Installation
```bash
npm install git+https://github.com/DropletInk/simple-otel-logger.git
```
## ⚙️ Environment Configuration
```.env
Create a .env file in your service:

OTEL_SERVICE_NAME=auth-service

# Traces (Jaeger / OTLP)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Metrics (Prometheus via Collector)
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Logs (Loki / ELK via Collector)
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4318/v1/logs

NODE_ENV=production
```

## Enable Telemetry Automatically

### Import the module before import express and starting your server.
```typescript
import "@dropletink/simple-otel-logger/auto"
```

This will:

- Initialize OpenTelemetry

- Configure exporters

- Enable auto-instrumentation (HTTP, DB, etc.)
## Basic Logger Example
```typescript
import { ConsoleLogger } from "@dropletink/simple-otel-logger"

const logger = new ConsoleLogger({
  base: {
    service: "auth-service"
  }
})

const data = "my data"

logger.info("Application started",{data})
// logger.error("Application error",{data})
// logger.warn("Application warning",{data})
// logger.debug("Application debug",{data})

```

## Example output:
```json
{
  "service": "auth-service",
  "level": "info",
  "message": "Application started",
  "timestamp": "2026-03-13T10:00:00Z",
  "traceId": "f2b8c7...",
  "spanId": "1d9a2c..."
}
```
## HTTP Request Logging Middleware

### The library provides middleware to log HTTP requests and responses.

### Example:
```typescript
import express from "express"
import {
  ConsoleLogger,
  createHttpLoggerMiddleware
} from "@dropletink/simple-otel-logger"

const logger = new ConsoleLogger({
  base: { service: "api-server" }
})

const app = express()

app.use(
  createHttpLoggerMiddleware(logger, {
    environment: "production",

    getUserId: (req) => req.headers["x-user-id"],

    requestData: (req) => ({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    }),

    responseData: (req, res, duration) => ({
      method: req.method,
      url: req.originalUrl,
      handler: req.route?.stack?.at(-1)?.name,
      statusCode: res.statusCode,
      durationMs: duration
    })
  })
)

app.listen(3000)
```

## Example Logs

### Request log:
```json
{
  "message": "HTTP request received",
  "method": "GET",
  "url": "/users",
  "ip": "127.0.0.1"
}
```
### Response log:

```json
{
  "message": "HTTP response sent",
  "method": "GET",
  "url": "/users",
  "handler": "login"
  "statusCode": 200,
  "durationMs": 34,
}
```
## Custom Spans (Tracing)
### Create custom spans for business logic:
```typescript
import { withSpan } from "@dropletink/simple-otel-logger"

await withSpan("Save user data", async () => { 
  // your logic here 
})
```
## Observability Stack
### This library uses OpenTelemetry (OTLP), so it works with:
🔹 Traces

- Jaeger

- Grafana Tempo

🔹 Metrics
- Prometheus

🔹 Logs
- Loki

- ELK Stack

## Running Jaeger (Tracing)
```bash 
docker run -d --name jaeger \ 
-p 16686:16686 \ 
-p 4318:4318 \ 
jaegertracing/all-in-one:latest
```
## Logger Types

### The library currently supports two logger implementations.

## ConsoleLogger

### Logs structured JSON using the Node console.
```typescript
import { ConsoleLogger } from "@dropletink/simple-otel-logger"

const logger = new ConsoleLogger({
  base: {
    service: "auth-service"
  }
})
```

## PinoLogger

### High-performance structured logging using Pino.
```typescript
import { PinoLogger } from "@dropletink/simple-otel-logger"

const logger = new PinoLogger({
  serviceName: "auth-service"
})
```

## Provide a simple, extensible observability layer for:

- Microservices

- Distributed systems

- Production-grade debugging
