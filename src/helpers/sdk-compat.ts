import type * as cog from '@grafana/grafana-foundation-sdk/cog'

/**
 * Mutates the underlying built object to set fields the SDK builders don't yet expose.
 * Keep this internal — never re-export.
 */
export function dangerouslyAddCustomValues<T extends object>(b: cog.Builder<T>, customValues: Partial<T>): cog.Builder<T> {
  const o = b.build()
  for (const [key, value] of Object.entries(customValues)) {
    // @ts-expect-error
    o[key] = value
  }
  return b
}
