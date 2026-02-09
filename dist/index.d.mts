type LogLevel = "info" | "error" | "debug" | "warn";
interface LoggerOptions {
    serviceName?: string;
}
declare class Logger {
    private options;
    constructor(options?: LoggerOptions);
    private getOtelContext;
    private log;
    info(msg: string, data?: any): void;
    error(msg: string, data?: any): void;
    debug(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
}

export { type LogLevel, Logger, type LoggerOptions };
