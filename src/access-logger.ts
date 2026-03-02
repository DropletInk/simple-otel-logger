import { Logger, getOtelContext } from "./logger.js"
import { randomUUID } from "crypto"
import type { Request, Response, NextFunction } from "express"

export interface HttpLogOptions {
  getUserId?: (req: Request) => string | undefined
  logBody?: boolean
  environment?: string
}

export function createHttpLoggerMiddleware(
  logger: Logger,
  options: HttpLogOptions = {}
) {
  return function httpLogger(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const start = Date.now()

    const requestId =(req.headers["x-request-id"] as string | undefined) ?? randomUUID()

    const userId = options.getUserId?.(req)

    logger.info("HTTP request received", {
      requestId,
      method: req.method,
      url: req.originalUrl,
      route: req.route?.path,
      userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      environment: options.environment,
      ...(options.logBody ? { body: req.body } : {}),
      ...getOtelContext()
    })

    res.on("finish", () => {
      const durationMs = Date.now() - start

      logger.info("HTTP response sent", {
        requestId,
        method: req.method,
        url: req.originalUrl,
        route: req.route?.path,
        statusCode: res.statusCode,
        durationMs,
        userId,
        environment: options.environment,
        ...getOtelContext()
      })
    })

    next()
  }
}