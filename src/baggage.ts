import {
  context,
  propagation,
  ROOT_CONTEXT,
  type Context,
} from "@opentelemetry/api"
import type { AnyValueMap } from "@opentelemetry/api-logs"

export const DEFAULT_BAGGAGE_KEYS: readonly string[] = []


const STATE_KEY = "__yourorg_otel_common_baggage_keys__"
const store = globalThis as unknown as Record<string, string[] | undefined>

export function setBaggageKeys(keys: readonly string[]): void {
  store[STATE_KEY] = [...keys]
}

export function getBaggageKeys(): readonly string[] {
  return store[STATE_KEY] ?? DEFAULT_BAGGAGE_KEYS
}

export function assertBaggageKeysConfigured(keys: readonly string[]): void {
  const configured = new Set(getBaggageKeys())
  const missing = keys.filter((k) => !configured.has(k))
  if (missing.length) {
    throw new Error(
      `Baggage keys not configured for logging: ${missing.join(", ")}`
    )
  }
}

export function runWithBaggage<T>(
  entries: Record<string, string | null | undefined>,
  fn: () => T
): T {
  const active = context.active()
  let bag = propagation.getBaggage(active) ?? propagation.createBaggage()

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue
    bag = value === null ? bag.removeEntry(key) : bag.setEntry(key, { value })
  }

  return context.with(propagation.setBaggage(active, bag), fn)
}

export function getBaggageValue(
  key: string,
  ctx: Context = context.active()
): string | undefined {
  return propagation.getBaggage(ctx)?.getEntry(key)?.value
}

export function getBaggageAttributes(
  keys: readonly string[] = getBaggageKeys()
): AnyValueMap {
  const out: AnyValueMap = {}
  const bag = propagation.getBaggage(context.active())
  if (!bag) return out

  for (const key of keys) {
    const value = bag.getEntry(key)?.value
    if (value !== undefined) out[key] = value
  }
  return out
}


export function bindToContext<F extends (...args: any[]) => any>(fn: F): F {
  return context.bind(context.active(), fn)
}

export function injectContextHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  propagation.inject(context.active(), headers)
  return headers
}

export function runFromCarrier<T>(
  carrier: Record<string, unknown>,
  fn: () => T
): T {
  return context.with(propagation.extract(ROOT_CONTEXT, carrier), fn)
}

export function toStringCarrier(
  headers: Record<string, unknown> | undefined
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (v == null) continue
    const first = Array.isArray(v) ? v[0] : v
    out[k] = Buffer.isBuffer(first) ? first.toString() : String(first)
  }
  return out
}