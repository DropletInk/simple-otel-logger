export type LogLevel = "info" | "error" | "debug" | "warn";
export interface LoggerOptions {
    serviceName?: string;
}
export interface LogRecord<T = unknown> {
    message: string;
    data?: T;
    traceId?: string;
    spanId?: string;
    level?: LogLevel;
    service?: string;
    timestamp?: string;
}
export interface Logger {
    log(level: LogLevel, record: LogRecord): void;
    info<T = unknown>(message: string, data?: T): void;
    error<T = unknown>(message: string, data?: T): void;
    debug<T = unknown>(message: string, data?: T): void;
    warn<T = unknown>(message: string, data?: T): void;
}
export declare function getOtelContext(): {
    traceId?: undefined;
    spanId?: undefined;
} | {
    traceId: string;
    spanId: string;
};
export declare class ConsoleLogger implements Logger {
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
    log(level: LogLevel, record: any): void;
    info(message: string, data?: any): void;
    error(message: string, data?: any): void;
    debug(message: string, data?: any): void;
    warn(message: string, data?: any): void;
}
export declare class PinoLogger implements Logger {
    private logger;
    log(level: LogLevel, record: any): void;
    info(msg: string, data?: any): void;
    error(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
    debug(msg: string, data?: any): void;
}
//# sourceMappingURL=logger.d.ts.map