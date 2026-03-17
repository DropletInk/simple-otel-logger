import { Logger, getOtelContext } from "./logger.js"
import { randomUUID } from "crypto"
import type { Request, Response, NextFunction } from "express"

export interface HttpLogOptions {
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
    const start = performance.now()

    const headerRequestId = req.headers["x-request-id"]
    
    const { traceId } = getOtelContext()
    
    const requestId =
      (Array.isArray(headerRequestId)
        ? headerRequestId[0]
        : headerRequestId) ??
      traceId ??
      randomUUID()


    const requestData = options.requestData
      ? options.requestData(req)
      : {}

    logger.info("HTTP request received", {
      requestId,
      environment: options.environment,
      ...requestData
    })

    res.on("finish", () => {
      if (res.statusCode >= 500) {
        logger.error("HTTP error response", {
          statusCode: res.statusCode,
          requestId,
        })
      } 

      const durationMs =  performance.now() - start

      const responseData = options.responseData
        ? options.responseData(req, res, durationMs)
        : {}

      logger.info("HTTP response sent", {
        requestId,
        environment: options.environment,
        ...responseData
      })
    })

    next()
  }
}