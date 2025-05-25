// https://github.com/grafana/grafana/tree/main/packages/grafana-schema
import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as text from '@grafana/grafana-foundation-sdk/text'

// Exports
export { goRuntimeMetricsPanels } from './common-panels/go-runtime'
export { NewPrometheusDatasourceVariable, NewLokiDatasourceVariable, NewTextboxVariable, NewQueryVariable } from './helpers/variables'

export type { CommonMetricOpts, CommonQueryOpts } from './helpers/promql'
export { CounterMetric, GaugeMetric, HistogramMetric, SummaryMetric, formatLegendFormat, mergeSelectors } from './helpers/promql'
export { NewLokiLogsPanel, type LokiLogsPanelOpts } from './helpers/panels/loki'
export { NewStatPanel, type StatPanelOpts } from './helpers/panels/stat'
export { NewTimeSeriesPanel, type TimeSeriesPanelOpts } from './helpers/panels/timeseries'
export { NewBarGaugePanel, type BarGaugePanelOpts } from './helpers/panels/bargauge'
export { NewBarChartPanel, type BarChartPanelOpts } from './helpers/panels/barchart'
export { NewPieChartPanel, type PieChartPanelOpts } from './helpers/panels/piechart'
export { NewTablePanel, type TablePanelOpts } from './helpers/panels/table'
export { tableExcludeByName, tableIndexByName } from './helpers/panels/table'
export { overridesMatchByName } from './helpers/panels/commons'
export { writeDashboardAndPostToGrafana } from './helpers/grafana'
export { writePrometheusRules } from './helpers/alerting-rules'

// Units
export * as units from '@grafana/grafana-foundation-sdk/units'

// Panels
export * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
export * as table from '@grafana/grafana-foundation-sdk/table'
export * as piechart from '@grafana/grafana-foundation-sdk/piechart'
export * as barchart from '@grafana/grafana-foundation-sdk/barchart'
export * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
export * as stat from '@grafana/grafana-foundation-sdk/stat'
export * as logs from '@grafana/grafana-foundation-sdk/logs'
export * as common from '@grafana/grafana-foundation-sdk/common'

export type PanelRow = {
  type: 'panel-row'
  panels: Array<dashboard.Panel>
}

export type PanelGroup = {
  type: 'panel-group'
  panelRows: Array<PanelRow>
  title: string
  collapsed: boolean
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
    if (opts.height) {
      panel.gridPos.h = panel.gridPos.h || opts.height
    }
    if (opts.width) {
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

type PanelGroupOpts = { title: string; collapsed?: boolean }

export function NewPanelGroup(opts: PanelGroupOpts, panelRows: Array<PanelRow | undefined | false>): PanelGroup {
  return {
    type: 'panel-group',
    title: opts.title,
    panelRows: filterNonUndefined(panelRows),
    collapsed: opts.collapsed || false,
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
  if (includeGeneratedDashboardNote) {
    db.withPanel(new text.PanelBuilder().transparent(true).span(24).content('This is a generated dashboard. Any changes made here will be lost on the next generation.').height(3))
  }
  withPanels(db, opts.panels)
  return db
}

export function withPanels(db: dashboard.DashboardBuilder, panelRows: PanelRowAndGroups): dashboard.DashboardBuilder {
  function autoLayoutInner(b: dashboard.DashboardBuilder | dashboard.RowBuilder, panelRowsAndGroups: PanelRowAndGroups) {
    for (const panelRowOrGroup of panelRowsAndGroups) {
      if (panelRowOrGroup.type === 'panel-group') {
        let b = new dashboard.RowBuilder(panelRowOrGroup.title).collapsed(panelRowOrGroup.collapsed)

        if (panelRowOrGroup.collapsed) {
          autoLayoutInner(b, panelRowOrGroup.panelRows)
          db.withRow(b)
        } else {
          db.withRow(b)
          autoLayoutInner(db, panelRowOrGroup.panelRows)
        }
        continue
      }
      const rowPanels = panelRowOrGroup.panels
      const panelCountInThisRowWithoutW = rowPanels.filter((panel) => !panel.gridPos?.w).length
      const availableRemainingWidth = 24 - rowPanels.map((panel) => panel.gridPos?.w || 0).reduce((a, b) => a + b, 0)
      // console.log(`Row with ${rowPanels.length} panels, available width: ${availableRemainingWidth}, panels without width: ${panelCountInThisRowWithoutW}`)
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
      if (totalWidth < 24) {
        b.withPanel(
          new text.PanelBuilder()
            .transparent(true)
            .span(24 - totalWidth)
            .content('')
            .height(maxHeight)
        )
      }
    }
  }
  autoLayoutInner(db, panelRows)
  return db
}
