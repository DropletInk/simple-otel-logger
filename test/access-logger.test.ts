import test from "node:test"
import assert from "node:assert"
import { EventEmitter } from "node:events"

import type { Request, Response, NextFunction } from "express"

import { createHttpLoggerMiddleware } from "../src/access-logger.js"
import type { Logger } from "../src/logger.js"

type LogCall = {
  message: string
  meta?: Record<string, unknown>
}

function createMockLogger(): Logger & {
  infoCalls: LogCall[]
  errorCalls: LogCall[]
} {
  return {
    infoCalls: [],
    errorCalls: [],

    log() {},

    buildRecord(level, message, data) {
      return {
        level,
        message,
        data,
      }
    },

    info(message, data) {
      this.infoCalls.push({ message, meta: data as Record<string, unknown> })
    },

    error(message, data) {
      this.errorCalls.push({ message, meta: data as Record<string, unknown> })
    },

    debug() {},
    warn() {},
  }
}

type MockRequest = Pick<Request, "headers">



class MockResponse extends EventEmitter {
  statusCode: number

  constructor(statusCode = 200) {
    super()
    this.statusCode = statusCode
  }
}

test("logs request and calls next", () => {
  const logger = createMockLogger()
  const middleware = createHttpLoggerMiddleware(logger, {})

  const req: MockRequest = { headers: {} }
  const res = new MockResponse()

  let nextCalled = false
  const next: NextFunction = () => {
    nextCalled = true
  }

  middleware(req as Request, res as Response, next)

  assert.strictEqual(nextCalled, true)
  assert.strictEqual(logger.infoCalls.length, 1)

  const log = logger.infoCalls[0]

  assert.strictEqual(log.message, "HTTP request received")
  assert.ok(typeof log.meta?.requestId === "string")
})

test("uses x-request-id header if present", () => {
  const logger = createMockLogger()
  const middleware = createHttpLoggerMiddleware(logger, {})

  const req: MockRequest = {
    headers: { "x-request-id": "custom-id" },
  }

  const res = new MockResponse()

  middleware(req as Request, res as Response, () => {})

  const log = logger.infoCalls[0]

  assert.strictEqual(log.meta?.requestId, "custom-id")
})


test("logs response on finish", () => {
  const logger = createMockLogger()
  const middleware = createHttpLoggerMiddleware(logger, {})

  const req: MockRequest = { headers: {} }
  const res = new MockResponse()

  middleware(req as Request, res as Response, () => {})

  res.emit("finish")

  assert.strictEqual(logger.infoCalls.length, 2)

  const log = logger.infoCalls[1]

  assert.strictEqual(log.message, "HTTP response sent")
  assert.ok(typeof log.meta?.requestId === "string")
})


test("logs error for 5xx responses", () => {
  const logger = createMockLogger()
  const middleware = createHttpLoggerMiddleware(logger, {})

  const req: MockRequest = { headers: {} }
  const res = new MockResponse(500)

  middleware(req as Request, res as Response, () => {})

  res.emit("finish")

  assert.strictEqual(logger.errorCalls.length, 1)

  const log = logger.errorCalls[0]

  assert.strictEqual(log.message, "HTTP error response")
  assert.strictEqual(log.meta?.statusCode, 500)
})


test("includes requestData", () => {
  const logger = createMockLogger()

  const middleware = createHttpLoggerMiddleware(logger, {
    requestData: () => ({ user: "test-user" }),
  })

  const req: MockRequest = { headers: {} }
  const res = new MockResponse()

  middleware(req as Request, res as Response, () => {})

  const log = logger.infoCalls[0]

  assert.strictEqual(log.meta?.user, "test-user")
})


test("includes responseData", () => {
  const logger = createMockLogger()

  const middleware = createHttpLoggerMiddleware(logger, {
    responseData: () => ({ result: "ok" }),
  })

  const req: MockRequest = { headers: {} }
  const res = new MockResponse()

  middleware(req as Request, res as Response, () => {})

  res.emit("finish")

  const log = logger.infoCalls[1]

  assert.strictEqual(log.meta?.result, "ok")
})