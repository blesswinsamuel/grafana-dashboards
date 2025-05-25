import * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as common from '@grafana/grafana-foundation-sdk/common'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as logs from '@grafana/grafana-foundation-sdk/logs'
import * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import * as stat from '@grafana/grafana-foundation-sdk/stat'
import * as table from '@grafana/grafana-foundation-sdk/table'
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import * as units from '@grafana/grafana-foundation-sdk/units'
import { fromTargets, Target } from './target'

type UnitKeys = keyof typeof units
export type Unit = (typeof units)[UnitKeys]

export function inferUnit(targets: Target[], type?: 'line' | 'bar', fallback?: Unit): [Unit | undefined, 'line' | 'bar'] {
  const expr = targets.length > 0 && targets[0] && 'expr' in targets[0] ? targets[0].expr : ''
  if (!type) {
    if (expr.includes('$__interval')) {
      // interval (bar chart)
      type = 'bar'
      if (!fallback) {
        if (expr.includes('_bytes_total')) {
          fallback = units.BytesSI
        } else {
          fallback = units.Short
        }
      }
    } else if (expr.includes('$__rate_interval')) {
      // rate (line chart)
      type = 'line'
      if (!fallback) {
        if (expr.includes('histogram_quantile')) {
          // histogram quantile
          if (expr.includes('_seconds_bucket')) {
            fallback = units.Seconds
          }
          if (expr.includes('_milliseconds_bucket') || expr.includes('_ms_bucket')) {
            fallback = units.Milliseconds
          }
        } else if (expr.includes('histogram_share')) {
          // histogram share
          fallback = units.PercentUnit
        } else {
          if (expr.includes('_seconds_sum') && expr.includes('_seconds_count') && expr.includes('rate') && expr.includes('/')) {
            fallback = units.Seconds
          } else if (expr.includes('_request_') || expr.includes('_requests_') || expr.includes('_response_')) {
            fallback = units.RequestsPerSecond
          } else if (expr.includes('_bytes_total')) {
            fallback = units.BytesPerSecondSI
          } else if (expr.includes('_reads_total')) {
            fallback = units.ReadsPerSecond
          } else if (expr.includes('_writes_total')) {
            fallback = units.WritesPerSecond
          } else if (expr.includes('_packets_total')) {
            fallback = units.PacketsPerSecond
          }
        }
      }
    } else {
      // gauge
      type = 'line'
      if (!fallback) {
        if (expr.includes('_seconds')) {
          fallback = units.Seconds
        } else if (expr.includes('_milliseconds') || expr.includes('_ms')) {
          fallback = units.Milliseconds
        } else if (expr.includes('_bytes')) {
          fallback = units.BytesSI
        } else if (expr.includes('_percent')) {
          fallback = units.PercentUnit
        }
      }
    }
  }
  return [fallback, type ?? 'line']
}

// https://stackoverflow.com/a/51365037/1421222
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object | undefined ? RecursivePartial<T[P]> : T[P]
}

export type CommonPanelOpts<T extends Target> = {
  datasource?: dashboard.DataSourceRef
  title: string
  description?: string
  targets?: T[]
  unit?: Unit
  min?: number
  max?: number
  decimals?: number

  transformations?: dashboard.DataTransformerConfig[]

  legendCalcs?: string[]

  width?: number
  height?: number
  maxDataPoints?: number
  interval?: string
  timeFrom?: string

  thresholdsStyleMode?: common.GraphThresholdsStyleMode
  mappings?: dashboard.ValueMapping[]
  thresholds?: cog.Builder<dashboard.ThresholdsConfig>

  overrides?: dashboard.FieldConfigSource['overrides']
  //   fieldConfigDefaults?: dashboard.FieldConfig
}

type GenericPanelBuilder = timeseries.PanelBuilder | stat.PanelBuilder | logs.PanelBuilder | barchart.PanelBuilder | piechart.PanelBuilder | table.PanelBuilder

export function withCommonOpts<PT extends GenericPanelBuilder, T extends Target>(b: PT, opts: CommonPanelOpts<T>, ...extraTargets: T[]): PT {
  const targets = [...(opts.targets || []), ...(extraTargets || [])]
  opts.targets = targets
  opts.unit = opts.unit ?? (targets.length > 0 ? inferUnit(targets)[0] : undefined)
  if (targets) b.targets(fromTargets(targets, opts.datasource))

  if (opts.datasource !== undefined) b.datasource(opts.datasource)
  if (opts.title !== undefined) b.title(opts.title)
  if (opts.description !== undefined) b.description(opts.description)
  if (opts.interval !== undefined) b.interval(opts.interval)
  if (opts.maxDataPoints !== undefined) b.maxDataPoints(opts.maxDataPoints)
  if (opts.width !== undefined) b.span(opts.width)
  if (opts.height !== undefined) b.height(opts.height)
  if (opts.unit !== undefined) b.unit(opts.unit)
  if (opts.min !== undefined) b.min(opts.min)
  if (opts.max !== undefined) b.max(opts.max)
  if (opts.decimals !== undefined) b.decimals(opts.decimals)
  if (opts.transformations != undefined) b.transformations(opts.transformations)

  if (opts.mappings !== undefined) b.mappings(opts.mappings)
  if (opts.thresholds !== undefined) b.thresholds(opts.thresholds)
  if (opts.overrides !== undefined) b.overrides(opts.overrides)

  b.transparent(false)

  return b
}
