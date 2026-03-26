# simple-otel-logger

## A lightweight structured logging and tracing utility for Node.js services using OpenTelemetry.

## It provides:
- Structured logging

- HTTP request/response logging middleware

- Automatic trace and span correlation

- Distributed tracing (Jaeger-compatible)

- Automatic telemetry initialization

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

OTEL_SERVICE_NAME=auth-service || or what will be your service name

# Traces - if you want to see the trace details configure the env variable name with "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT" and initailize the URL like -

OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Metrics - if you want to see the metrices configure the env variable name with "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT" and initailize the URL like -

OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Logs - if you want to see the logs configure the env variable name with "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT" and initailize the URL like -

OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4318/v1/logs

NODE_ENV=production || or what will be your current environment 
```
## Observability Stack
### This library uses OpenTelemetry (OTLP), so it works with:
🔹 if you want watch trace details you can use backend like 

- Jaeger
### run this comman in your terminal
```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```
### You view traces here
```bash
http://localhost:16686
```
## Note:
### By default, Jaeger runs in in-memory mode, which means:

- Traces are NOT persisted

- Restarting the container will delete all trace data
## Persistent Storage with Badger DB
### To persist traces across restarts, run Jaeger with Badger DB:
```bash
docker run -d --name jaeger \
  -v jaeger-data:/badger \
  -e SPAN_STORAGE_TYPE=badger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
  ```

  ## Benefits

- Traces are stored locally

- Data survives container restarts

- You can search old traces using traceId

🔹  if you want watch metrices you can use backend like 
- Prometheus

### run this comman in your terminal
```bash
docker run -d --name prometheus \
  -p 9090:9090 \
  prom/prometheus
```
### You view metrices here
```bash
http://localhost:9090
```
🔹 Logs
- Loki

### 1. Run Loki (log storage)
```bash
docker run -d --name loki \
  -p 3100:3100 \
  grafana/loki:latest
```
### Loki runs on:
```bash
http://localhost:3100
```
### 2. Run Grafana (UI to see logs)
```bash
docker run -d --name grafana \
  -p 3000:3000 \
  grafana/grafana
  ```
### Open:
```bash
http://localhost:3000
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
## Basic ConsoleLogger Example
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
  "spanId": "1d9a2c...",
  "data": {"key":"value",...}
}
```
## OtelLogger example
```typescript
import "@dropletink/simple-otel-logger/auto"
import { OtelLogger } from "@dropletink/simple-otel-logger"

const logger = new OtelLogger({
  base: { service: "auth-service" }
})

logger.info("user_login", {
  userId: "123",
  email: "user@email.com",
  eventName: "User.login"
})
```
## Example output
```json
{
  resource: {
    attributes: {
      'service.name': 'auth-service',
      'deployment.environment': 'development'
    }
  },
  instrumentationScope: {
    name: 'simple-otel-logger',
    version: '1.0.0',
    schemaUrl: undefined
  },
  timestamp: 1774506142377000,
  traceId: '1d644d5738990e0cc6735bc709a3e3ee',
  spanId: '217215648a04304a',
  traceFlags: 1,
  severityText: 'INFO',
  severityNumber: 9,
  eventName: 'User.login',
  body: 'login_success',
  attributes: {   
    userId: "123",
    email: "user@email.com"
   }
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
## OtelLogger
### opentelemetry logging with best logging structure
```typescript
const logger = new OtelLogger({
  base: { service: "auth-service" }
})

logger.info("user_login", {
  userId: "123",
  email: "user@email.com",
  eventName: "User.login"
})
```
## Provide a simple, extensible observability layer for:

- Microservices

- Distributed systems

- Production-grade debugging
