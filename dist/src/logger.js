"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoLogger = exports.ConsoleLogger = void 0;
exports.getOtelContext = getOtelContext;
const api_1 = require("@opentelemetry/api");
const pino_1 = __importDefault(require("pino"));
function getOtelContext() {
    const span = api_1.trace.getSpan(api_1.context.active());
    if (!span)
        return {};
    const sc = span.spanContext();
    return {
        traceId: sc.traceId,
        spanId: sc.spanId,
    };
}
class ConsoleLogger {
    constructor(options = {}) {
        this.options = options;
    }
    buildRecord(level, message, data) {
        return {
            level,
            message,
            service: this.options.serviceName,
            timestamp: new Date().toISOString(),
            ...getOtelContext(),
            data,
        };
    }
    log(level, record) {
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
        this.log("info", record);
    }
    error(message, data) {
        const record = this.buildRecord("error", message, data);
        this.log("error", record);
    }
    debug(message, data) {
        const record = this.buildRecord("debug", message, data);
        this.log("debug", record);
    }
    warn(message, data) {
        const record = this.buildRecord("warn", message, data);
        this.log("warn", record);
    }
}
exports.ConsoleLogger = ConsoleLogger;
class PinoLogger {
    constructor() {
        this.logger = (0, pino_1.default)();
    }
    log(level, record) {
        this.logger[level](record, record.message);
    }
    info(msg, data) {
        const record = {
            message: msg,
            ...getOtelContext(),
            data,
        };
        this.log("info", record);
    }
    error(msg, data) {
        const record = {
            message: msg,
            ...getOtelContext(),
            data,
        };
        this.log("error", record);
    }
    warn(msg, data) {
        const record = {
            message: msg,
            ...getOtelContext(),
            data,
        };
        this.log("warn", record);
    }
    debug(msg, data) {
        const record = {
            message: msg,
            ...getOtelContext(),
            data,
        };
        this.log("debug", record);
    }
}
exports.PinoLogger = PinoLogger;
