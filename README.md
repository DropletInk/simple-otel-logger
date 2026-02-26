# simple-otel-logger

## overview
simple-otel-logger is a lightweight TypeScript logging library that produces structured JSON logs enriched with OpenTelemetry trace context. It easy to integrate consistent observability across services. Designed for simplicity, type safety, and extensibility in modern Node.js applications.

## Features
- Structured JSON logging
- OpenTelemetry context injection
- Level-based logging
- TypeScript-first design


## ⚙️ Requirements

```bash
node >= 18
typescript
@opentelemetry/api
```

## Installation Process
### Install the Library
```
npm install git+https://github.com/DropletInk/simple-otel-logger.git
```

## Usage Examples
## Import the logger
```
import { ConsoleLogger } from "simple-otel-logger"
```
## Create a logger instance

```
const logger = new ConsoleLogger({
  serviceName: "auth-service",
})
```
## Write logs
```
logger.info("login_attempt", { email: "user@gmail.com" })
logger.error("login_failed", { reason: "invalid_password" })
logger.warn("rate_limit_near")
logger.debug("payload_received", { size: 123 })
```
## ConsoleLogger output:
```
{
  "level": "info",
  "message": "login_attempt",
  "service": "auth-service",
  "timestamp": "2026-02-13T10:00:00.000Z",
  "traceId": "...",
  "spanId": "...",
  "data": {
    "email": "user@gmail.com"
  }
}
```

