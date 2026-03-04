import test from "node:test"
import assert from "node:assert"
import { createHttpLoggerMiddleware } from "../src/access-logger"
import type { Request, Response, NextFunction } from "express"

test("middleware logs request and response", () => {
  const calls: any[] = []

 
  const fakeLogger = {
    info: (_msg: string, data: any) => {
      calls.push(data)
    },
  }

  const middleware = createHttpLoggerMiddleware(fakeLogger as any, {
    environment: "test",
    logBody: true,
    getUserId: (req: any) => req.user?.id,
  })

  const req = {
    method: "POST",
    originalUrl: "/login",
    headers: { "user-agent": "jest" },
    ip: "127.0.0.1",
    body: { email: "a@b.com" },
    user: { id: "u1" },
    route: { path: "/login" },
  } as unknown as Request

  let finishHandler: Function = () => {}

  const res = {
    statusCode: 200,
    on: (event: string, cb: Function) => {
      if (event === "finish") finishHandler = cb
    },
  } as unknown as Response

  const next: NextFunction = () => {}

  middleware(req, res, next)

  finishHandler()

  // assertions
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, "POST")
  assert.equal(calls[0].userId, "u1")
  assert.equal(calls[1].statusCode, 200)
})