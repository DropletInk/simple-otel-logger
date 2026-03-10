import { Logger, getOtelContext } from "./logger.js"
import { randomUUID } from "crypto"
import type { Request, Response, NextFunction } from "express"

export interface HttpLogOptions {
  getUserId?: (req: Request) => string | undefined
  logBody?: boolean
  environment?: string

  requestData?: (req: Request) => Record<string, unknown>
  responseData?: (req: Request, res: Response, durationMs: number) => Record<string, unknown>  
}

export function createHttpLoggerMiddleware(
  logger: Logger,
  options: HttpLogOptions 
) {
  return function httpLogger(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const start = Date.now()

    const requestId =
      (req.headers["x-request-id"] as string | undefined) ?? randomUUID()

    const userId = options.getUserId?.(req)

    const requestData = options.requestData
      ? options.requestData(req)
      : {}

    logger.info("HTTP request received", {
      requestId,
      userId,
      environment: options.environment,
      ...requestData
    })

    res.on("finish", () => {
      const durationMs = Date.now() - start

      const responseData = options.responseData
        ? options.responseData(req, res, durationMs)
        : {}

      logger.info("HTTP response sent", {
        requestId,
        userId,
        environment: options.environment,
        ...responseData
      })
    })

    next()
  }
}