import {
  context,
  propagation,
  type Context,
} from "@opentelemetry/api"
import type { AnyValueMap } from "@opentelemetry/api-logs"

export const DEFAULT_BAGGAGE_KEYS: readonly string[] = []

let baggageKeys: readonly string[] = []

export function setBaggageKeys(keys: readonly string[]): void {
  baggageKeys = keys.map((k) => k.trim()).filter(Boolean)
}

export function getBaggageKeys(): readonly string[] {
  return baggageKeys ?? DEFAULT_BAGGAGE_KEYS
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
