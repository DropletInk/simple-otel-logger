// src/logger.ts
import { context, trace } from "@opentelemetry/api";
import pino from "pino";
function getOtelContext() {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const sc = span.spanContext();
  return {
    traceId: sc.traceId,
    spanId: sc.spanId
  };
}
var ConsoleLogger = class {
  constructor(options = {}) {
    this.options = options;
  }
  buildRecord(level, message, data) {
    return {
      level,
      message,
      service: this.options.serviceName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...getOtelContext(),
      data
    };
  }
  writeToConsole(level, record) {
    const out = JSON.stringify(record);
    switch (level) {
      case "info":
        console.info(out);
        break;
      case "debug":
        console.debug(out);
        break;
      case "warn":
        console.warn(out);
        break;
      case "error":
        console.error(out);
        break;
      default:
        console.log(out);
    }
  }
  info(message, data) {
    const record = this.buildRecord("info", message, data);
    this.writeToConsole("info", record);
  }
  error(message, data) {
    const record = this.buildRecord("error", message, data);
    this.writeToConsole("error", record);
  }
  debug(message, data) {
    const record = this.buildRecord("debug", message, data);
    this.writeToConsole("debug", record);
  }
  warn(message, data) {
    const record = this.buildRecord("warn", message, data);
    this.writeToConsole("warn", record);
  }
};
var PinoLogger = class {
  constructor() {
    this.logger = pino();
  }
  info(msg, data) {
    this.logger.info({ ...getOtelContext(), data }, msg);
  }
  error(msg, data) {
    this.logger.error({ ...getOtelContext(), data }, msg);
  }
  warn(msg, data) {
    this.logger.warn({ ...getOtelContext(), data }, msg);
  }
  debug(msg, data) {
    this.logger.debug({ ...getOtelContext(), data }, msg);
  }
};
function createLogger(type) {
  if (type === "pino") return new PinoLogger();
  return new ConsoleLogger({ serviceName: "my-service" });
}
export {
  ConsoleLogger,
  PinoLogger,
  createLogger,
  getOtelContext
};
