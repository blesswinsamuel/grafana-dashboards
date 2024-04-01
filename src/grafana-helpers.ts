// https://github.com/grafana/grafana/tree/main/packages/grafana-schema
import { Dashboard, DataSourceRef, Panel, RowPanel, VariableModel, VariableRefresh, defaultVariableModel } from '@grafana/schema'
import * as fs from 'fs/promises'
export { NewGoRuntimeMetrics } from './go-runtime'
export { NewBarGaugePanel, NewPieChartPanel, NewStatPanel, NewTablePanel, NewTimeSeriesPanel } from './panels'
export type { BarGaugePanelOpts, PieChartPanelOpts, StatPanelOpts, TablePanelOpts, Target, TimeSeriesPanelOpts } from './panels'
export { Unit } from './units'
export { averageDurationQuery, overridesMatchByName, tableExcludeByName, tableIndexByName } from './utils'

export type DataSourceVariableOpts = {
  name: string
  label: string
}

export type PanelRow = {
  type: 'panel-row'
  panels: Array<Panel>
}

export type PanelGroup = {
  type: 'panel-group'
  panelRows: Array<PanelRow>
  title: string
  collapsed: boolean
}

export type PanelRowAndGroups = Array<PanelRow | PanelGroup>

type PanelArrayOpts = {
  datasource?: DataSourceRef
  height?: number
  width?: number
}

export function NewPanelRow(opts: PanelArrayOpts, panels: Array<Panel>): PanelRow {
  for (const panel of panels) {
    if (opts.datasource && !panel.datasource) {
      panel.datasource = opts.datasource
    }
    if (opts.height && !panel.gridPos.h) {
      panel.gridPos.h = opts.height
    }
    if (opts.width && !panel.gridPos.w) {
      panel.gridPos.w = opts.width
    }
  }

  return {
    type: 'panel-row',
    panels: panels,
  }
}

export function NewPanelGroup(opts: { title: string; collapsed?: boolean }, panelRows: Array<PanelRow>): PanelGroup {
  return {
    type: 'panel-group',
    title: opts.title,
    panelRows,
    collapsed: opts.collapsed || false,
  }
}

export function NewPrometheusDatasource(opts: DataSourceVariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    datasource: null,
    hide: 0,
    type: 'datasource',
    label: opts.label,
    name: opts.name,
    query: 'prometheus',
  }
}

export type VariableOpts = {
  label: string
  name: string
  datasource: DataSourceRef
  query?: string
  refresh?: VariableRefresh
  multi?: boolean
  includeAll?: boolean
}

export function NewQueryVariable(opts: VariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    datasource: opts.datasource,
    hide: 0,
    type: 'query',
    label: opts.label,
    name: opts.name,
    query: opts.query,
    // regex: '',
    multi: opts.multi,
    // @ts-ignore
    includeAll: opts.includeAll,
    // @ts-ignore
    sort: 1, // SORT_ALPHA_DESC
    refresh: opts.refresh || VariableRefresh.onTimeRangeChanged,
    options: [],
  }
}

export function autoLayout(panelRows: PanelRowAndGroups): Array<Panel | RowPanel> {
  function autoLayoutInner(panelRowsAndGroups: PanelRowAndGroups, y: number = 0): [Array<Panel | RowPanel>, number] {
    const panels: Array<Panel | RowPanel> = []
    for (const panelRowOrGroup of panelRowsAndGroups) {
      const isPanelGroup = panelRowOrGroup.type === 'panel-group'
      let groupHeader: RowPanel | undefined = isPanelGroup
        ? {
            id: undefined,
            type: 'row',
            title: panelRowOrGroup.title,
            panels: [],
            collapsed: panelRowOrGroup.collapsed,
            gridPos: { x: 0, y: 0, w: 24, h: 1 },
          }
        : undefined
      let rowPanels: [RowPanel] | Panel[] = isPanelGroup ? [groupHeader] : panelRowOrGroup.panels

      let maxh = 0
      let x = 0
      const panelCountInThisRowWithoutW = rowPanels.filter((panel) => panel.gridPos.w === 0).length
      const availableRemainingWidth = 24 - rowPanels.map((panel: RowPanel | Panel) => panel.gridPos.w || 0).reduce((a, b) => a + b, 0)
      for (const panel of rowPanels) {
        if (panel.gridPos.w === 0) {
          panel.gridPos.w = Math.floor(availableRemainingWidth / panelCountInThisRowWithoutW)
        }
      }
      // let moreAvailableRemainingWidth = 24 - rowPanels.map((panel: RowPanel | Panel) => panel.gridPos.w || 0).reduce((a, b) => a + b, 0)
      // for (let i = 0; i < rowPanels.length; i++) {
      //   if (moreAvailableRemainingWidth === 0) {
      //     break
      //   }
      //   rowPanels[i].gridPos.w += 1
      //   moreAvailableRemainingWidth -= 1
      //   if (moreAvailableRemainingWidth !== 0) {
      //     rowPanels[rowPanels.length - i - 1].gridPos.w += 1
      //     moreAvailableRemainingWidth -= 1
      //   }
      // }
      for (const panel of rowPanels) {
        if (x + 1 > 24) {
          x = 0
          y += maxh
          maxh = 0
        }

        panel.gridPos.x = x
        panel.gridPos.y = y

        if (panel.gridPos.h > maxh) {
          maxh = panel.gridPos.h
        }

        x += panel.gridPos.w

        panels.push(panel)
      }

      y += maxh
      if (isPanelGroup) {
        let rowPanelsInGroup: Array<Panel> = []
        ;[rowPanelsInGroup, y] = autoLayoutInner(panelRowOrGroup.panelRows, y) as [Array<Panel>, number]
        groupHeader.panels = rowPanelsInGroup
        if (!panelRowOrGroup.collapsed) {
          panels.push(...rowPanelsInGroup)
          groupHeader.panels = []
        }
      }
    }
    // console.log(panels.map((panel) => panel.title));
    return [panels, y]
  }
  return autoLayoutInner(panelRows)[0]
}

export async function writeDashboardAndPostToGrafana(opts: { grafanaURL?: string; grafanaUsername?: string; grafanaPassword?: string; dashboard: Dashboard; filename: string }) {
  const { grafanaURL = process.env.GRAFANA_URL, dashboard } = opts
  await fs.writeFile(opts.filename, JSON.stringify(dashboard, null, 2))
  if (grafanaURL) {
    dashboard['uid'] = `${dashboard['uid']}-debug`
    dashboard['title'] = `[Debug] ${dashboard['title']}`
    const headers = {
      'Content-Type': 'application/json',
    }
    if (opts.grafanaUsername && opts.grafanaPassword) {
      headers['Authorization'] = 'Basic ' + btoa(opts.grafanaUsername + ':' + opts.grafanaPassword)
    }
    const response = await fetch(`${grafanaURL}/api/dashboards/db`, {
      method: 'POST',
      body: JSON.stringify({
        dashboard: dashboard,
        overwrite: true,
        message: 'Updated by script',
      }),
      headers,
    })

    console.log(response.status, response.statusText)
    const body = await response.json()
    console.log(body)
  }
}
