import test from "node:test"
import assert from "node:assert"

import type { Request, Response, NextFunction } from "express"

import { createHttpLoggerMiddleware } from "../src/access-logger.js"

type LogEntry = {
  msg: string
  data: Record<string, string | number | undefined>
}

test("httpLogger logs request and response with custom options", async () => {
  const logs: LogEntry[] = []

  const logger = {
    info: (msg: string, data: Record<string, string | number | undefined>) => {
      logs.push({ msg, data })
    }
  }

  const middleware = createHttpLoggerMiddleware(logger as any, {
    environment: "test",

    getUserId: (req: Request) => req.headers["x-user-id"] as string | undefined,

    requestData: (req: Request) => ({
      method: req.method,
      url: req.originalUrl
    }),

    responseData: (req: Request, res: Response, durationMs: number) => ({
      statusCode: res.statusCode,
      durationMs
    })
  })

  const req = {
    method: "GET",
    originalUrl: "/users",
    headers: {
      "x-user-id": "123"
    },
    ip: "127.0.0.1",
    route: { path: "/users" }
  } as unknown as Request

  let finishCallback: (() => void) | undefined

  const res = {
    statusCode: 200,
    on: (event: string, cb: () => void) => {
      if (event === "finish") finishCallback = cb
    }
  } as unknown as Response

  let nextCalled = false

  const next: NextFunction = () => {
    nextCalled = true
  }

  middleware(req, res, next)

  assert.equal(nextCalled, true)

  finishCallback?.()

  assert.equal(logs.length, 2)

  assert.equal(logs[0].msg, "HTTP request received")
  assert.equal(logs[0].data.method, "GET")
  assert.equal(logs[0].data.url, "/users")
  assert.equal(logs[0].data.userId, "123")
  assert.equal(logs[0].data.environment, "test")

  assert.equal(logs[1].msg, "HTTP response sent")
  assert.equal(logs[1].data.statusCode, 200)
  assert.ok(typeof logs[1].data.durationMs === "number")
})