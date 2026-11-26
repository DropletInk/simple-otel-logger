import type { Request, Response, NextFunction } from "express"
import { runWithBaggage } from "./baggage.js"

export interface BaggageMiddlewareOptions {

  entries: (req: Request) => Record<string, string | null | undefined>

  edge?: boolean

  strip?: readonly string[]

  responseHeaders?: (entries: Record<string, string>) => Record<string, string>
}

export function createBaggageMiddleware(options: BaggageMiddlewareOptions) {
  const edge = options.edge ?? true

  return function baggageMiddleware(req: Request, res: Response, next: NextFunction) {
    const raw = options.entries(req)
    const resolved: Record<string, string | null | undefined> = {}

    for (const key of options.strip ?? []) resolved[key] = null

    for (const [key, value] of Object.entries(raw)) {
      resolved[key] = value === undefined && edge ? null : value
    }

    if (options.responseHeaders) {
      const present = Object.fromEntries(
        Object.entries(resolved).filter(
          (e): e is [string, string] => typeof e[1] === "string"
        )
      )
      for (const [name, value] of Object.entries(options.responseHeaders(present))) {
        res.setHeader(name, value)
      }
    }

    runWithBaggage(resolved, next)
  }
}