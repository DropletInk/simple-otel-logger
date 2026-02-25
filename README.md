# simple-otel-logger

## Using npm link (dev mode)

### In logger project:

```bash
npm link
```

### In your app project:

```bash
npm link simple-otel-logger
```


## ⚙️ Requirements

```bash
node >= 18
typescript
@opentelemetry/api
```

## Basic Usage
```bash
import { Logger } from "simple-otel-logger"

const logger = new Logger({
  serviceName: "auth-service"
})

logger.info("Application started")
logger.warn("Cache miss")
logger.error("Login failed", { userId: 42 })
logger.debug("Debug details", { step: 2 })
```
