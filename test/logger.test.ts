import test from "node:test"
import assert from "node:assert"
import { ConsoleLogger, PinoLogger } from "../src/logger"

function mockConsole(method: "info" | "error", fn: (...args: any[]) => void) {
  const original = console[method]
  console[method] = fn
  return () => {
    console[method] = original
  }
}

test("ConsoleLogger info calls console.info", (t) => {
  let called = false

  const restore = mockConsole("info", () => {
    called = true
  })

  t.after(restore)

  const logger = new ConsoleLogger({ serviceName: "test-service" })
  logger.info("hello", { user: "abc" })

  assert.equal(called, true)
})

test("ConsoleLogger error calls console.error", (t) => {
  let called = false

  const restore = mockConsole("error", () => {
    called = true
  })

  t.after(restore)

  const logger = new ConsoleLogger()
  logger.error("fail")

  assert.equal(called, true)
})

test("ConsoleLogger record contains expected fields", (t) => {
  let output = ""

  const restore = mockConsole("info", (msg: string) => {
    output = msg
  })

  t.after(restore)

  const logger = new ConsoleLogger({ serviceName: "svc" })
  logger.info("login", { userId: "u1" })

  const parsed = JSON.parse(output)

  assert.equal(parsed.message, "login")
  assert.equal(parsed.level, "info")
  assert.equal(parsed.service, "svc")
  assert.ok(parsed.timestamp)
  assert.equal(parsed.data.userId, "u1")
})

test("PinoLogger does not throw on info", () => {
  const logger = new PinoLogger()

  assert.doesNotThrow(() => {
    logger.info("hello", { id: 1 })
  })
})