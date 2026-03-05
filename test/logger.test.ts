import test from "node:test"
import assert from "node:assert"

import { ConsoleLogger, getOtelContext, PinoLogger } from "../src/logger.js"

test("getOtelContext returns empty object when no span", () => {
  const ctx = getOtelContext()
  assert.deepStrictEqual(ctx, {})
})

test("ConsoleLogger.info logs message", () => {
  const logger = new ConsoleLogger({ serviceName: "test-service" })

  let output = ""
  const original = console.info

  console.info = (msg: any) => {
    output = msg
  }

  logger.info("test message", { id: 1 })

  console.info = original

  assert.ok(output.includes("test message"))
})

test("ConsoleLogger.error logs error", () => {
  const logger = new ConsoleLogger()

  let called = false
  const original = console.error

  console.error = () => {
    called = true
  }

  logger.error("error happened")

  console.error = original

  assert.equal(called, true)
})

test("PinoLogger.info does not throw", () => {
  const logger = new PinoLogger()

  assert.doesNotThrow(() => {
    logger.info("pino test", { x: 1 })
  })
})