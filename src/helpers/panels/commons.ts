import type * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import type * as bargauge from '@grafana/grafana-foundation-sdk/bargauge'
import type * as common from '@grafana/grafana-foundation-sdk/common'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import type * as logs from '@grafana/grafana-foundation-sdk/logs'
import type * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import type * as stat from '@grafana/grafana-foundation-sdk/stat'
import type * as table from '@grafana/grafana-foundation-sdk/table'
import type * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import type { Target } from '../promql'
import { buildTargets } from './target'

export type { Unit } from '../promql'

export type PanelDefaults = { unit?: string; chartType?: 'line' | 'bar' }

export function inferPanelDefaults(targets: Target[]): PanelDefaults {
  for (const t of targets) {
    if (t.kind === 'prometheus' && t.hints) {
      return { unit: t.hints.unit, chartType: t.hints.chartType }
    }
  }
  return {}
}

export type CommonPanelOpts = {
  datasource?: dashboard.DataSourceRef
  title: string
  description?: string
  targets?: Target[]
  unit?: string
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
  overridesByRefId?: Record<string, Record<string, any>>
  links?: (Partial<dashboard.DashboardLink> & Pick<dashboard.DashboardLink, 'title'>)[]
}

type GenericPanelBuilder = timeseries.PanelBuilder | stat.PanelBuilder | logs.PanelBuilder | barchart.PanelBuilder | piechart.PanelBuilder | table.PanelBuilder | bargauge.PanelBuilder

export function withCommonOpts<PT extends GenericPanelBuilder>(b: PT, opts: CommonPanelOpts): PT {
  const defaults = inferPanelDefaults(opts.targets ?? [])
  const unit = opts.unit ?? defaults.unit

  if (opts.targets) b.targets(buildTargets(opts.targets, opts.datasource))
  if (opts.datasource !== undefined) b.datasource(opts.datasource)
  if (opts.title !== undefined) b.title(opts.title)
  if (opts.description !== undefined) b.description(opts.description)
  if (opts.interval !== undefined) b.interval(opts.interval)
  if (opts.maxDataPoints !== undefined) b.maxDataPoints(opts.maxDataPoints)
  b.gridPos({ h: opts.height || 0, w: opts.width || 0, x: 0, y: 0 })
  if (unit !== undefined) b.unit(unit)
  if (opts.min !== undefined) b.min(opts.min)
  if (opts.max !== undefined) b.max(opts.max)
  if (opts.decimals !== undefined) b.decimals(opts.decimals)
  if (opts.transformations !== undefined) b.transformations(opts.transformations)
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
        Object.entries(properties).map(([key, value]) => ({ id: key, value })),
      )
    }
  }
  if (opts.overridesByRefId !== undefined) {
    for (const [name, properties] of Object.entries(opts.overridesByRefId)) {
      b.overrideByQuery(
        name,
        Object.entries(properties).map(([key, value]) => ({ id: key, value })),
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

export function overridesMatchByName(overrides: Record<string, Record<string, any>>): dashboard.FieldConfigSource['overrides'] {
  const result: dashboard.FieldConfigSource['overrides'] = []
  for (const matcher of Object.keys(overrides)) {
    result.push({
      matcher: { id: 'byName', options: matcher },
      properties: Object.entries(overrides[matcher]!).map(([key, value]) => ({ id: key, value })),
    })
  }
  return result
}
