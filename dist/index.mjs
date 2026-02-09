// src/logger.ts
import { context, trace } from "@opentelemetry/api";
var Logger = class {
  constructor(options = {}) {
    this.options = options;
  }
  getOtelContext() {
    const span = trace.getSpan(context.active());
    if (!span) return {};
    const sc = span.spanContext();
    return {
      traceId: sc.traceId,
      spanId: sc.spanId
    };
  }
  log(level, message, data) {
    const record = {
      level,
      message,
      service: this.options.serviceName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...this.getOtelContext(),
      data
    };
    console.log(JSON.stringify(record));
  }
  info(msg, data) {
    this.log("info", msg, data);
  }
  error(msg, data) {
    this.log("error", msg, data);
  }
  debug(msg, data) {
    this.log("debug", msg, data);
  }
  warn(msg, data) {
    this.log("warn", msg, data);
  }
};
export {
  Logger
};
