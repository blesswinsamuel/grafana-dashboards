import * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as common from '@grafana/grafana-foundation-sdk/common'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as logs from '@grafana/grafana-foundation-sdk/logs'
import * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import * as stat from '@grafana/grafana-foundation-sdk/stat'
import * as table from '@grafana/grafana-foundation-sdk/table'
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import * as bargauge from '@grafana/grafana-foundation-sdk/bargauge'
import * as units from '@grafana/grafana-foundation-sdk/units'
import { fromTargets, Target } from './target'

type UnitKeys = keyof typeof units
export type Unit = (typeof units)[UnitKeys]

export function inferUnit(targets: Target[], type?: 'line' | 'bar', fallback?: Unit): [Unit | undefined, 'line' | 'bar'] {
  const expr = targets.length > 0 && targets[0] && 'expr' in targets[0] ? targets[0].expr.toString() : ''
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

export function overridesMatchByName(overrides: Record<string, Record<string, any>>): dashboard.FieldConfigSource['overrides'] {
  const result: dashboard.FieldConfigSource['overrides'] = []
  for (const matcher of Object.keys(overrides)) {
    result.push({
      matcher: { id: 'byName', options: matcher },
      properties: Object.entries(overrides[matcher]!).map(([key, value]) => {
        return { id: key, value }
      }),
    })
  }
  return result
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

  width?: number
  height?: number
  maxDataPoints?: number
  interval?: string
  timeFrom?: string

  thresholdsStyleMode?: common.GraphThresholdsStyleMode
  mappings?: dashboard.ValueMapping[]
  thresholds?: dashboard.ThresholdsConfig

  overrides?: dashboard.FieldConfigSource['overrides']
  overridesByName?: Record<string, Record<string, any>>

  links?: (Partial<dashboard.DashboardLink> & Pick<dashboard.DashboardLink, 'title'>)[]
  //   fieldConfigDefaults?: dashboard.FieldConfig
}

type GenericPanelBuilder = timeseries.PanelBuilder | stat.PanelBuilder | logs.PanelBuilder | barchart.PanelBuilder | piechart.PanelBuilder | table.PanelBuilder | bargauge.PanelBuilder

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
  if (opts.thresholds !== undefined) {
    const tb = new dashboard.ThresholdsConfigBuilder()
    tb.mode(opts.thresholds.mode)
    tb.steps(opts.thresholds.steps)
    b.thresholds(tb)
  }
  if (opts.overrides !== undefined) b.overrides(opts.overrides)
  if (opts.overridesByName !== undefined) {
    for (const [name, properties] of Object.entries(opts.overridesByName)) {
      b.overrideByName(
        name,
        Object.entries(properties).map(([key, value]) => ({ id: key, value }))
      )
    }
  }

  b.transparent(false)

  if (opts.links !== undefined) {
    const bls: dashboard.DashboardLinkBuilder[] = []
    for (const link of opts.links) {
      const bl = new dashboard.DashboardLinkBuilder(link.title)
      bl.title(link.title)
      if (link.url !== undefined) bl.url(link.url)
      if (link.tags !== undefined) bl.tags(link.tags)
      if (link.icon !== undefined) bl.icon(link.icon)
      if (link.keepTime !== undefined) bl.keepTime(link.keepTime)
      if (link.asDropdown !== undefined) bl.asDropdown(link.asDropdown)
      bls.push(bl)
    }
    b.links(bls)
  }

  return b
}
