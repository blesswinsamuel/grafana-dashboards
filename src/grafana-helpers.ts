// https://github.com/grafana/grafana/tree/main/packages/grafana-schema
import { Dashboard, DataSourceRef, Panel, RowPanel, VariableModel, VariableRefresh, defaultVariableModel } from '@grafana/schema'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as yaml from 'yaml'
import { RuleFile } from './alerts'
export { goRuntimeMetricsPanels } from './go-runtime'
export { NewBarGaugePanel, NewPieChartPanel, NewStatPanel, NewTablePanel, NewTimeSeriesPanel } from './panels'
export type { BarGaugePanelOpts, PieChartPanelOpts, StatPanelOpts, TablePanelOpts, Target, TimeSeriesPanelOpts } from './panels'
export { Unit } from './units'
export { averageDurationQuery, overridesMatchByName, tableExcludeByName, tableIndexByName } from './utils'
export type { CommonMetricOpts, CommonQueryOpts } from './promql-helpers'
export { CounterMetric, GaugeMetric, HistogramMetric, SummaryMetric, formatLegendFormat, mergeSelectors } from './promql-helpers'

export type DataSourceVariableOpts = {
  name: string
  label: string
  regex?: string
  query?: string
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

export function NewPanelRow(opts: PanelArrayOpts, panels: Array<Panel | undefined | false>): PanelRow {
  const panelsFiltered = filterNonUndefined(panels)
  for (const panel of panelsFiltered) {
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
    panels: panelsFiltered,
  }
}

function filterNonUndefined<T>(array: Array<T | undefined | false>): Array<T> {
  return array.filter((item): item is T => item !== undefined && item !== false)
}

export function NewPanelGroup(opts: { title: string; collapsed?: boolean }, panelRows: Array<PanelRow | undefined | false>): PanelGroup {
  return {
    type: 'panel-group',
    title: opts.title,
    panelRows: filterNonUndefined(panelRows),
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
    regex: opts.regex,
    query: 'prometheus',
  }
}

export function NewLokiDatasource(opts: DataSourceVariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    datasource: null,
    hide: 0,
    type: 'datasource',
    label: opts.label,
    name: opts.name,
    regex: opts.regex,
    query: 'loki',
  }
}

export function NewDatasourceVariable(opts: DataSourceVariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    datasource: null,
    hide: 0,
    type: 'datasource',
    label: opts.label,
    name: opts.name,
    regex: opts.regex,
    query: opts.query || 'prometheus',
  }
}

export type QueryVariableOpts = {
  label: string
  name: string
  datasource: DataSourceRef
  query?: string | any
  refresh?: VariableRefresh
  multi?: boolean
  includeAll?: boolean
  regex?: string
  hide?: boolean
}

export function NewQueryVariable(opts: QueryVariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    datasource: opts.datasource,
    hide: opts.hide ? 2 : 0,
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
    regex: opts.regex,
  }
}

export type TextboxVariableOpts = {
  label: string
  name: string
  hide?: boolean
  default?: string
}

export function NewTextboxVariable(opts: TextboxVariableOpts): VariableModel {
  return {
    ...defaultVariableModel,
    hide: opts.hide ? 2 : 0,
    type: 'textbox',
    label: opts.label,
    name: opts.name,
    query: opts.default,
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
        ;[rowPanelsInGroup, y] = autoLayoutInner(panelRowOrGroup.panelRows, y)
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

export async function writeDashboardAndPostToGrafana(opts: { grafanaURL?: string; grafanaUsername?: string; grafanaPassword?: string; grafanaSession?: string; grafanaApiToken?: string; dashboard: Dashboard; folderUid?: string; addDebugNamePrefix?: boolean; filename: string }) {
  const { grafanaURL = process.env.GRAFANA_URL, grafanaSession = process.env.GRAFANA_SESSION, grafanaApiToken = process.env.GRAFANA_API_TOKEN, grafanaUsername = process.env.GRAFANA_USERNAME, grafanaPassword = process.env.GRAFANA_PASSWORD, dashboard, addDebugNamePrefix = true } = opts
  // create parent folder if it doesn't exist
  if (opts.filename.includes('/')) {
    const folder = opts.filename.split('/').slice(0, -1).join('/')
    if (folder !== '' && !fsSync.existsSync(folder)) {
      console.log('Creating parent folder', folder)
      await fs.mkdir(folder, { recursive: true })
    }
  }
  if (fsSync.existsSync(opts.filename)) {
    const existingDashboard = JSON.parse(await fs.readFile(opts.filename, 'utf-8'))
    if (JSON.stringify(existingDashboard) === JSON.stringify(dashboard)) {
      // console.info(`Dashboard ${opts.filename} is already up to date`)
      return
    }
  }
  await fs.writeFile(opts.filename, JSON.stringify(dashboard, null, 2))
  if (grafanaURL) {
    console.info(`${new Date().toISOString()}: Writing dashboard ${opts.filename} to Grafana at ${grafanaURL}`)
    dashboard['uid'] = `${addDebugNamePrefix ? 'debug-' : ''}${dashboard['uid']}`
    dashboard['uid'] = dashboard['uid'].substring(0, 40)
    dashboard['title'] = `${addDebugNamePrefix ? '[Debug] ' : ''}${dashboard['title']}`
    // dashboard['version'] = Math.floor(Math.random() * 1000)
    const headers = {
      'Content-Type': 'application/json',
    }
    if (grafanaUsername && grafanaPassword) {
      headers['Authorization'] = 'Basic ' + btoa(grafanaUsername + ':' + grafanaPassword)
    }
    if (grafanaApiToken) {
      headers['Authorization'] = `Bearer ${grafanaApiToken}`
    }
    if (grafanaSession) {
      headers['Cookie'] = `grafana_session=${grafanaSession}`
    }
    const fetchOpts: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        dashboard: dashboard,
        folderUid: opts.folderUid,
        overwrite: true,
        message: 'Updated by script',
      }),
      headers,
    }
    const response = await fetch(`${grafanaURL}/api/dashboards/db`, fetchOpts)

    console.log(response.status, response.statusText)
    const body = await response.json()
    console.log(body)
  }
}

export async function writePrometheusRules(opts: { checkRules?: boolean; ruleFile: RuleFile; filename: string }) {
  await fs.writeFile(opts.filename, yaml.stringify(opts.ruleFile))
  if (opts.checkRules) {
    // TODO: Check the rules using promtool
  }
}
