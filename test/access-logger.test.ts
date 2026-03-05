import test from "node:test"
import assert from "node:assert"

import { createHttpLoggerMiddleware } from "../src/access-logger.js"

test("httpLogger logs request and response", async () => {
  const logs: any[] = []

  const logger = {
    info: (msg: string, data: any) => {
      logs.push({ msg, data })
    }
  }

  const middleware = createHttpLoggerMiddleware(logger as any)

  const req: any = {
    method: "GET",
    originalUrl: "/users",
    headers: {},
    ip: "127.0.0.1",
    route: { path: "/users" }
  }

  let finishCallback: any

  const res: any = {
    statusCode: 200,
    on: (event: string, cb: any) => {
      if (event === "finish") finishCallback = cb
    }
  }

  let nextCalled = false

  const next = () => {
    nextCalled = true
  }
 
  middleware(req, res, next)

  assert.equal(nextCalled, true)

  finishCallback()

  assert.equal(logs.length, 2)
  assert.equal(logs[0].msg, "HTTP request received")
  assert.equal(logs[1].msg, "HTTP response sent")
}) 