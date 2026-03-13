# simple-otel-logger

## A lightweight structured logging and tracing utility for Node.js services using OpenTelemetry.

## It provides:
- Structured logging

- HTTP request/response logging middleware

- Automatic trace and span correlation

- Support for both console logging and Pino

- Automatic telemetry initialization

- Designed for microservices built with Express.js.

## Features

- Structured JSON logging

- Automatic traceId and spanId injection

- HTTP request/response logging middleware

 - OpenTelemetry integration

- Pino and console logger support

- Configurable log metadata

- Automatic telemetry bootstrap

## Installation
```
npm install git+https://github.com/DropletInk/simple-otel-logger.git
```
## Enable Telemetry Automatically

### Import the module before import express and starting your server.
```
import "@dropletink/simple-otel-logger/auto"
```

This initializes OpenTelemetry instrumentation automatically.

## Basic Logger Example
```
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
```
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
```
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
```
{
  "message": "HTTP request received",
  "method": "GET",
  "url": "/users",
  "ip": "127.0.0.1"
}
```
### Response log:
```
{
  "message": "HTTP response sent",
  "method": "GET",
  "url": "/users",
  "handler": "login"
  "statusCode": 200,
  "durationMs": 34,
}
```
## Logger Types

### The library currently supports two logger implementations.

## ConsoleLogger

### Logs structured JSON using the Node console.
```
import { ConsoleLogger } from "@dropletink/simple-otel-logger"

const logger = new ConsoleLogger({
  base: {
    service: "auth-service"
  }
})
```

## PinoLogger

### High-performance structured logging using Pino.
```
import { PinoLogger } from "@dropletink/simple-otel-logger"

const logger = new PinoLogger({
  serviceName: "auth-service"
})
```