"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Logger: () => Logger
});
module.exports = __toCommonJS(index_exports);

// src/logger.ts
var import_api = require("@opentelemetry/api");
var Logger = class {
  constructor(options = {}) {
    this.options = options;
  }
  getOtelContext() {
    const span = import_api.trace.getSpan(import_api.context.active());
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger
});
