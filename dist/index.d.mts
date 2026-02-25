type LogLevel = "info" | "error" | "debug" | "warn";
interface LoggerOptions {
    serviceName?: string;
}
interface Logger {
    info(message: string, data?: any): void;
    error(message: string, data?: any): void;
    debug(message: string, data?: any): void;
    warn(message: string, data?: any): void;
}
declare function getOtelContext(): {
    traceId?: undefined;
    spanId?: undefined;
} | {
    traceId: string;
    spanId: string;
};
declare class ConsoleLogger implements Logger {
    private options;
    constructor(options?: LoggerOptions);
    buildRecord(level: LogLevel, message: string, data?: any): {
        data: any;
        traceId?: undefined;
        spanId?: undefined;
        level: LogLevel;
        message: string;
        service: string | undefined;
        timestamp: string;
    } | {
        data: any;
        traceId: string;
        spanId: string;
        level: LogLevel;
        message: string;
        service: string | undefined;
        timestamp: string;
    };
    private writeToConsole;
    info(message: string, data?: any): void;
    error(message: string, data?: any): void;
    debug(message: string, data?: any): void;
    warn(message: string, data?: any): void;
}
declare class PinoLogger implements Logger {
    private logger;
    info(msg: string, data?: any): void;
    error(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
    debug(msg: string, data?: any): void;
}
declare function createLogger(type: "console" | "pino"): Logger;

export { ConsoleLogger, type LogLevel, type Logger, type LoggerOptions, PinoLogger, createLogger, getOtelContext };
