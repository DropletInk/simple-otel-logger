import test from "node:test"
import assert from "node:assert"

import { initTelemetry } from "../src/telemetry.js"

test("initTelemetry runs without error", () => {
  assert.doesNotThrow(() => {
    initTelemetry()
  })
})

test("initTelemetry can be called multiple times safely", () => {
  assert.doesNotThrow(() => {
    initTelemetry()
    initTelemetry()
  })
})