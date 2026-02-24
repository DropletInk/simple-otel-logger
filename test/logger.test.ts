import test from "node:test"
import assert from "node:assert"
import { ConsoleLogger, PinoLogger } from "../src/logger"

test("ConsoleLogger info calls console.info", (t) => {
  let called = false

  const original = console.info
  console.info = () => {
    called = true
  }

  const logger = new ConsoleLogger({ serviceName: "test-service" })
  logger.info("hello", { user: "abc" })

  assert.equal(called, true)

  console.info = original
})

test("ConsoleLogger error calls console.error", () => {
  let called = false

  const original = console.error
  console.error = () => {
    called = true
  }

  const logger = new ConsoleLogger()
  logger.error("fail")

  assert.equal(called, true)

  console.error = original
})

test("ConsoleLogger record contains expected fields", () => {
  let output = ""

  const original = console.info
  console.info = (msg) => {
    output = msg
  }

  const logger = new ConsoleLogger({ serviceName: "svc" })
  logger.info("login", { userId: "u1" })

  const parsed = JSON.parse(output)

  assert.equal(parsed.message, "login")
  assert.equal(parsed.level, "info")
  assert.equal(parsed.service, "svc")
  assert.ok(parsed.timestamp)
  assert.equal(parsed.data.userId, "u1")

  console.info = original
})

test("PinoLogger does not throw on info", () => {
  const logger = new PinoLogger()

  assert.doesNotThrow(() => {
    logger.info("hello", { id: 1 })
  })
})
