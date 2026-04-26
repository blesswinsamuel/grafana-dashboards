// https://github.com/grafana/grafana/tree/main/packages/grafana-schema
import type * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as text from '@grafana/grafana-foundation-sdk/text'

// SDK namespaces
export * as barchart from '@grafana/grafana-foundation-sdk/barchart'
export * as common from '@grafana/grafana-foundation-sdk/common'
export * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
export * as logs from '@grafana/grafana-foundation-sdk/logs'
export * as piechart from '@grafana/grafana-foundation-sdk/piechart'
export * as stat from '@grafana/grafana-foundation-sdk/stat'
export * as table from '@grafana/grafana-foundation-sdk/table'
export * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
// Units
export * as units from '@grafana/grafana-foundation-sdk/units'
// PromQL
export * as promql from '@grafana/promql-builder'
// ============================================================
// Core helpers re-exports
// ============================================================
export { goRuntimeMetricsPanels } from './common-panels/go-runtime'
export { writePrometheusRules } from './helpers/alerting-rules'
export { type GrafanaAnnotationOpts, type LogAnnotationOpts, NewElasticsearchAnnotation as NewLogAnnotation, NewGrafanaAnnotation } from './helpers/annotations'
export { writeDashboardAndPostToGrafana } from './helpers/grafana'
// Panel builders
export { type BarChartPanelOpts, NewBarChartPanel } from './helpers/panels/barchart'
export { type BarGaugePanelOpts, NewBarGaugePanel } from './helpers/panels/bargauge'
export { overridesMatchByName } from './helpers/panels/commons'
export { type LokiLogsPanelOpts, NewLokiLogsPanel } from './helpers/panels/loki'
export { NewPieChartPanel, type PieChartPanelOpts } from './helpers/panels/piechart'
export { NewStatPanel, type StatPanelOpts } from './helpers/panels/stat'
export { NewTablePanel, type TableColumn, type TablePanelOpts, tableExcludeByName, tableIndexByName } from './helpers/panels/table'
export { NewTextPanel, type TextPanelOpts } from './helpers/panels/text'
export { NewTimeSeriesPanel, type TimeSeriesPanelOpts, type TimeseriesChartType } from './helpers/panels/timeseries'
// Query chain
export {
  applyBinaryOp,
  CounterMetric,
  type CounterQueryOpts,
  GaugeMetric,
  type GaugeQueryOpts,
  HistogramMetric,
  type MetricOpts,
  type PrometheusQuery,
  type PrometheusTarget,
  type QueryHints,
  rawTarget,
  type SqlTarget,
  SummaryMetric,
  sel,
  sqlTarget,
  type Target,
  type TargetOpts,
  tv,
  type Unit,
  wrapConditional,
  wrapMultiply,
} from './helpers/promql'
export { NewDatasourceVariable, NewLokiDatasourceVariable, NewPrometheusDatasourceVariable, NewQueryVariable, NewTextboxVariable } from './helpers/variables'

import type * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import type * as bargauge from '@grafana/grafana-foundation-sdk/bargauge'
import type { PanelBuilder as LogsPanelBuilder } from '@grafana/grafana-foundation-sdk/logs'
import type * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import type * as stat from '@grafana/grafana-foundation-sdk/stat'
import type * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import type { BarChartPanelOpts } from './helpers/panels/barchart'
import { NewBarChartPanel } from './helpers/panels/barchart'
import type { BarGaugePanelOpts } from './helpers/panels/bargauge'
import { NewBarGaugePanel } from './helpers/panels/bargauge'
import type { LokiLogsPanelOpts } from './helpers/panels/loki'
import { NewLokiLogsPanel } from './helpers/panels/loki'
import type { PieChartPanelOpts } from './helpers/panels/piechart'
import { NewPieChartPanel } from './helpers/panels/piechart'
import type { StatPanelOpts } from './helpers/panels/stat'
import { NewStatPanel } from './helpers/panels/stat'
import type { TablePanelOpts } from './helpers/panels/table'
import type { TimeSeriesPanelOpts } from './helpers/panels/timeseries'
import { NewTimeSeriesPanel } from './helpers/panels/timeseries'
// ============================================================
// Compact panel alias helpers
// ============================================================
import type { Target } from './helpers/promql'

/** Compact time series panel: `ts('Title', target1, target2)` or `ts({ title: 'Title', ...opts }, target1)` */
export function ts(titleOrOpts: string | Omit<TimeSeriesPanelOpts, 'targets'>, ...targets: Target[]): timeseries.PanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewTimeSeriesPanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

/** Compact stat panel: `statPanel('Title', target)` or `statPanel({ title: 'Title', ...opts }, target)` */
export function statPanel(titleOrOpts: string | Omit<StatPanelOpts, 'targets'>, ...targets: Target[]): stat.PanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewStatPanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

/** Compact pie chart panel */
export function pie(titleOrOpts: string | Omit<PieChartPanelOpts, 'targets'>, ...targets: Target[]): piechart.PanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewPieChartPanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

/** Compact bar chart panel */
export function barChart(titleOrOpts: string | Omit<BarChartPanelOpts, 'targets'>, ...targets: Target[]): barchart.PanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewBarChartPanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

/** Compact bar gauge panel */
export function barGauge(titleOrOpts: string | Omit<BarGaugePanelOpts, 'targets'>, ...targets: Target[]): bargauge.PanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewBarGaugePanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

/** Compact Loki logs panel */
export function lokiLogs(titleOrOpts: string | Omit<LokiLogsPanelOpts, 'targets'>, ...targets: Target[]): LogsPanelBuilder {
  const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts
  return NewLokiLogsPanel({ ...opts, targets: [...((opts as any).targets ?? []), ...targets] })
}

// ============================================================
// Layout helpers
// ============================================================

export type PanelRow = {
  type: 'panel-row'
  panels: Array<dashboard.Panel>
}

export type PanelGroup = {
  type: 'panel-group'
  panelRows: Array<PanelRow>
  title: string
  collapsed: boolean
  repeat?: string
}

export type PanelRowAndGroups = Array<PanelRow | PanelGroup>

type PanelArrayOpts = {
  datasource?: dashboard.DataSourceRef
  height?: number
  width?: number
}

export function NewPanelRow(opts: PanelArrayOpts, panels: Array<cog.Builder<dashboard.Panel> | undefined | false>): PanelRow {
  const panelsBuilt: Array<dashboard.Panel> = []
  for (const panelBuilder of panels) {
    if (!panelBuilder) continue
    const panel = panelBuilder.build()
    if (opts.datasource && !panel.datasource) {
      panel.datasource = opts.datasource
    }
    if (!panel.gridPos) {
      panel.gridPos = { x: 0, y: 0, w: 0, h: 0 }
    }
    if (opts.height !== undefined) {
      panel.gridPos.h = panel.gridPos.h || opts.height
    }
    if (opts.width !== undefined) {
      panel.gridPos.w = panel.gridPos.w || opts.width
    }
    panelsBuilt.push(panel)
  }
  return {
    type: 'panel-row',
    panels: panelsBuilt,
  }
}

function filterNonUndefined<T>(array: Array<T | undefined | false>): Array<T> {
  return array.filter((item): item is T => item !== undefined && item !== false)
}

type PanelGroupOpts = { title: string; collapsed?: boolean; repeat?: string }

export function NewPanelGroup(opts: PanelGroupOpts, panelRows: Array<PanelRow | undefined | false>): PanelGroup {
  return {
    type: 'panel-group',
    title: opts.title,
    panelRows: filterNonUndefined(panelRows),
    collapsed: opts.collapsed || false,
    repeat: opts.repeat,
  }
}

type DashboardOpts = {
  title?: string
  description?: string
  uid?: string
  tags?: string[]
  time?: dashboard.Dashboard['time']
  panels: PanelRowAndGroups
  variables?: cog.Builder<dashboard.VariableModel>[]
  annotations?: cog.Builder<dashboard.AnnotationQuery>[]
  links?: cog.Builder<dashboard.DashboardLink>[]
  includeGeneratedDashboardNote?: boolean
}

export function newDashboard(opts: DashboardOpts): dashboard.DashboardBuilder {
  const { includeGeneratedDashboardNote = true } = opts
  const db = new dashboard.DashboardBuilder(opts.title || '')
  db.tooltip(dashboard.DashboardCursorSync.Crosshair)
  if (opts.description) db.description(opts.description)
  if (opts.uid) db.uid(opts.uid)
  if (opts.time) db.time(opts.time)
  if (opts.tags) db.tags(opts.tags)

  for (const variableBuilder of opts.variables || []) {
    db.withVariable(variableBuilder)
  }
  db.annotations(opts.annotations || [])
  db.links(opts.links || [])
  if (includeGeneratedDashboardNote) {
    db.withPanel(
      new text.PanelBuilder()
        .transparent(true)
        .span(24)
        .height(3)
        .mode(text.TextMode.HTML)
        .content(
          `<div style="background: oklch(44.3% 0.11 240.79); color: #fff; padding: 16px;">
<h4>This dashboard was generated from code</h4>
<p>Any edits will be lost when the dashboard is regenerated.</p>
</div>`,
        )
        .height(3),
    )
  }
  withPanels(db, opts.panels)
  return db
}

export function withPanels(db: dashboard.DashboardBuilder, panelRows: PanelRowAndGroups): dashboard.DashboardBuilder {
  function autoLayoutInner(b: dashboard.DashboardBuilder | dashboard.RowBuilder, panelRowsAndGroups: PanelRowAndGroups) {
    for (const panelRowOrGroup of panelRowsAndGroups) {
      if (panelRowOrGroup.type === 'panel-group') {
        const rb = new dashboard.RowBuilder(panelRowOrGroup.title).collapsed(panelRowOrGroup.collapsed)
        if (panelRowOrGroup.repeat) {
          rb.repeat(panelRowOrGroup.repeat)
        }
        if (panelRowOrGroup.collapsed) {
          autoLayoutInner(rb, panelRowOrGroup.panelRows)
          db.withRow(rb)
        } else {
          db.withRow(rb)
          autoLayoutInner(db, panelRowOrGroup.panelRows)
        }
        continue
      }
      const rowPanels = panelRowOrGroup.panels
      const panelCountInThisRowWithoutW = rowPanels.filter((panel) => !panel.gridPos?.w).length
      const availableRemainingWidth = 24 - rowPanels.map((panel) => panel.gridPos?.w || 0).reduce((a, b) => a + b, 0)

      let maxHeight = 0
      for (const panel of rowPanels) {
        if (!panel.gridPos?.w) {
          panel.gridPos!.w = Math.floor(availableRemainingWidth / panelCountInThisRowWithoutW)
        }
        if (panel.gridPos?.h && panel.gridPos.h > maxHeight) {
          maxHeight = panel.gridPos.h
        }
      }
      for (const panel of rowPanels) {
        b.withPanel({ build: () => panel })
      }
      const totalWidth = rowPanels.map((panel) => panel.gridPos?.w || 0).reduce((a, b) => a + b, 0)
      if (totalWidth > 0 && totalWidth < 24) {
        b.withPanel(
          new text.PanelBuilder()
            .transparent(true)
            .span(24 - totalWidth)
            .content('')
            .height(maxHeight),
        )
      }
    }
  }
  autoLayoutInner(db, panelRows)
  return db
}
