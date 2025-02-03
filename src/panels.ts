import {
  AxisColorMode,
  AxisPlacement,
  BarGaugeDisplayMode,
  BarGaugeNamePlacement,
  BarGaugeSizing,
  BarGaugeValueMode,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueJustifyMode,
  BigValueTextMode,
  DataSourceRef,
  FieldColorModeId,
  FieldConfigSource,
  GraphDrawStyle,
  GraphFieldConfig,
  GraphGradientMode,
  GraphThresholdsStyleMode,
  LegendDisplayMode,
  LegendPlacement,
  LineInterpolation,
  MappingType,
  Panel,
  PercentChangeColorMode,
  ReduceDataOptions,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  TableCellHeight,
  ThresholdsConfig,
  ThresholdsMode,
  TooltipDisplayMode,
  ValueMapping,
  VisibilityMode,
  VizOrientation,
  defaultPanel,
  defaultVizLegendOptions,
} from '@grafana/schema'
import { PanelQuerySpec } from '@grafana/schema/dist/esm/schema/dashboard/v2alpha0/dashboard.gen'
import { Options as BarGaugePanelOptions } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen'
import { PieChartLegendValues, Options as PieChartPanelOptions, PieChartType } from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen'
import { Options as SingleStatPanelOptions } from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen'
import { Options as TablePanelOptions } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen'
import { Options as TimeSeriesPanelOptions } from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen'
import { Unit } from './units'
import { overridesMatchByName, tableExcludeByName, tableIndexByName } from './utils'

// https://stackoverflow.com/a/51365037/1421222
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object | undefined ? RecursivePartial<T[P]> : T[P]
}

export type PrometheusTarget = { datasource?: DataSourceRef } & {
  expr: string
  // interval?: string
  legendFormat?: string
  refId?: string
  type?: 'range' | 'instant' | 'both'
  format?: 'table' | 'time_series' | 'heatmap'
}

export type SQLTarget = { datasource?: DataSourceRef } & {
  rawSql: string
  refId?: string
  format?: 'table' | 'time_series' | 'heatmap'
}

export type Target = { datasource?: DataSourceRef } & (PrometheusTarget | SQLTarget)

const deepMerge = <T = { [key: string]: any }>(obj1: T, obj2?: Partial<T>): T => {
  const clone1 = structuredClone(obj1)
  if (!obj2) {
    return clone1
  }

  for (let key in obj2) {
    if (obj2[key] instanceof Object && clone1[key] instanceof Object) {
      if (obj2[key] instanceof Array && clone1[key] instanceof Array) {
        // don't merge array of strings
        clone1[key] = obj2[key]
      } else {
        clone1[key] = deepMerge(clone1[key], obj2[key])
      }
    } else {
      clone1[key] = obj2[key]
    }
  }

  return clone1
}

function fromTargets(targets: Target[], datasource: DataSourceRef): (PanelQuerySpec & Record<string, unknown>)[] {
  return targets.map((target, i) => {
    if ('rawSql' in target) {
      return {
        datasource: target.datasource ?? datasource,
        // editorMode: QueryEditorMode.Code,
        rawQuery: true,
        rawSql: target.rawSql,
        format: 'table',
        // format: 1,
        refId: target.refId ?? String.fromCharCode('A'.charCodeAt(0) + i),
        queryType: 'table',
        // editorType: 'sql',
        // meta: {},
        // sql: {
        //   columns: [{ parameters: [], type: 'function' }],
        //   groupBy: [{ property: { type: 'string' }, type: 'groupBy' }],
        //   limit: 50,
        // },
      } as any
    }
    target.type = target.type ?? 'range'

    return {
      datasource: target.datasource ?? datasource,
      // editorMode: QueryEditorMode.Code,
      expr: target.expr,
      // //@ts-ignore
      // interval: target.interval,
      legendFormat: target.legendFormat,
      range: target.type === 'range' || target.type === 'both',
      instant: target.type === 'instant' || target.type === 'both',
      format: target.format ?? 'time_series',
      refId: target.refId ?? String.fromCharCode('A'.charCodeAt(0) + i),
    } as any
  })
}

export type CommonPanelOpts = {
  datasource?: DataSourceRef
  title: string
  description?: string
  targets?: Target[]
  // https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/valueFormats/categories.ts (use id field)
  defaultUnit?: Unit
  min?: number
  max?: number
  decimals?: number

  mappings?: ValueMapping[]
  thresholds?: ThresholdsConfig
  overrides?: FieldConfigSource['overrides']
  fieldConfigDefaults?: FieldConfigSource['defaults']
  transformations?: Panel['transformations']

  legendCalcs?: string[]

  width?: number
  height?: number
  maxDataPoints?: number
  interval?: string
  timeFrom?: string
}

function inferUnit(targets: Target[], type?: 'line' | 'bar', defaultUnit?: Unit): [Unit | undefined, 'line' | 'bar'] {
  const expr = targets.length > 0 ? ((targets[0] as any).expr as string) : ''
  if (!type) {
    if (expr.includes('$__interval')) {
      // interval (bar chart)
      type = 'bar'
      if (!defaultUnit) {
        if (expr.includes('_bytes_total')) {
          defaultUnit = Unit.BYTES_SI
        } else {
          defaultUnit = Unit.SHORT
        }
      }
    } else if (expr.includes('$__rate_interval')) {
      // rate (line chart)
      type = 'line'
      if (!defaultUnit) {
        if (expr.includes('histogram_quantile')) {
          // histogram quantile
          if (expr.includes('_seconds_bucket')) {
            defaultUnit = Unit.SECONDS
          }
          if (expr.includes('_milliseconds_bucket') || expr.includes('_ms_bucket')) {
            defaultUnit = Unit.MILLISECONDS
          }
        } else if (expr.includes('histogram_share')) {
          // histogram share
          defaultUnit = Unit.PERCENTUNIT
        } else {
          if (expr.includes('_request_') || expr.includes('_response_')) {
            defaultUnit = Unit.RPS
          } else if (expr.includes('_bytes_total')) {
            defaultUnit = Unit.BYTES_PER_SEC_SI
          } else if (expr.includes('_reads_total')) {
            defaultUnit = Unit.RPS
          } else if (expr.includes('_writes_total')) {
            defaultUnit = Unit.WPS
          } else if (expr.includes('_packets_total')) {
            defaultUnit = Unit.PPS
          } else if (expr.includes('_seconds_sum') && expr.includes('_seconds_count') && expr.includes('rate') && expr.includes('/')) {
            defaultUnit = Unit.SECONDS
          }
        }
      }
    } else {
      // gauge
      type = 'line'
      if (!defaultUnit) {
        if (expr.includes('_seconds')) {
          defaultUnit = Unit.SECONDS
        } else if (expr.includes('_milliseconds') || expr.includes('_ms')) {
          defaultUnit = Unit.MILLISECONDS
        } else if (expr.includes('_bytes')) {
          defaultUnit = Unit.BYTES_SI
        } else if (expr.includes('_percent')) {
          defaultUnit = Unit.PERCENTUNIT
        }
      }
    }
  }
  return [defaultUnit, type ?? 'line']
}

export type TimeSeriesPanelOpts = CommonPanelOpts & {
  type?: 'bar' | 'line'
  maxDataPoints?: number
  options?: RecursivePartial<TimeSeriesPanelOptions>
  legendPlacement?: LegendPlacement
  stackingMode?: StackingMode
  thresholdsStyleMode?: GraphThresholdsStyleMode
}
export function NewTimeSeriesPanel(opts: TimeSeriesPanelOpts, ...targets: Target[]): Panel {
  targets = [...(opts.targets || []), ...(targets || [])]
  const [defaultUnit, type] = inferUnit(targets, opts.type, opts.defaultUnit)
  opts.defaultUnit = defaultUnit
  opts.type = type
  const legendCalcs = opts.legendCalcs ?? { bar: ['sum'], line: ['min', 'max', 'mean', 'lastNotNull'] }[opts.type]
  const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
    ...defaultPanel,
    datasource: opts.datasource,
    type: 'timeseries',
    title: opts.title,
    description: opts.description,
    interval: opts.interval,
    maxDataPoints: opts.maxDataPoints,
    gridPos: { x: 0, y: 0, w: opts.width ?? 0, h: opts.height ?? 0 },
    targets: fromTargets(targets, opts.datasource),
    fieldConfig: {
      defaults: {
        color: {
          mode: FieldColorModeId.PaletteClassic,
        },
        custom: {
          axisCenteredZero: false,
          axisColorMode: AxisColorMode.Text,
          axisGridShow: true,
          axisLabel: '',
          axisPlacement: AxisPlacement.Auto,
          barAlignment: 0,
          drawStyle: GraphDrawStyle.Line,
          fillOpacity: 0,
          gradientMode: GraphGradientMode.None,
          hideFrom: {
            legend: false,
            tooltip: false,
            viz: false,
          },
          lineInterpolation: LineInterpolation.Linear,
          lineWidth: 1,
          pointSize: 5,
          scaleDistribution: {
            type: ScaleDistribution.Linear,
          },
          showPoints: VisibilityMode.Auto,
          spanNulls: false,
          stacking: {
            group: 'A',
            mode: StackingMode.None,
          },
          thresholdsStyle: {
            mode: opts.thresholdsStyleMode ?? GraphThresholdsStyleMode.Off,
          },
        },
        mappings: opts.mappings,
        thresholds: opts.thresholds,
        unit: opts.defaultUnit,
        min: opts.min,
        max: opts.max,
      },
      overrides: opts.overrides ?? [],
    },
    options: deepMerge<TimeSeriesPanelOptions>(
      {
        legend: {
          calcs: legendCalcs,
          displayMode: LegendDisplayMode.Table,
          placement: opts.legendPlacement ?? 'bottom',
          showLegend: true,
          sortBy: {
            mean: 'Mean',
            min: 'Min',
            max: 'Max',
            last: 'Last',
            lastNotNull: 'Last *',
            sum: 'Total',
          }[legendCalcs[legendCalcs.length - 1]],
          sortDesc: true,
        },
        tooltip: {
          mode: TooltipDisplayMode.Multi,
          sort: SortOrder.Descending,
        },
      },
      opts.options as Partial<TimeSeriesPanelOptions>
    ) as unknown as Record<string, unknown>,
    transformations: opts.transformations ?? [],
    transparent: false,
  }
  switch (opts.type) {
    case 'bar':
      panel.fieldConfig.defaults.custom!.drawStyle = GraphDrawStyle.Bars
      panel.fieldConfig.defaults.custom!.fillOpacity = 100
      panel.fieldConfig.defaults.custom!.lineInterpolation = LineInterpolation.StepAfter
      panel.fieldConfig.defaults.custom!.showPoints = VisibilityMode.Never
      panel.fieldConfig.defaults.custom!.stacking!.mode = StackingMode.Normal
      panel.maxDataPoints = opts.maxDataPoints ?? 100
      break
    case 'line':
      panel.fieldConfig.defaults.custom!.drawStyle = GraphDrawStyle.Line
      panel.fieldConfig.defaults.custom!.fillOpacity = 0
      panel.fieldConfig.defaults.custom!.lineInterpolation = LineInterpolation.Linear
      panel.fieldConfig.defaults.custom!.showPoints = VisibilityMode.Auto
      panel.fieldConfig.defaults.custom!.stacking!.mode = opts.stackingMode ?? StackingMode.None
      panel.maxDataPoints = opts.maxDataPoints ?? 100
      break
  }
  return panel as Panel
}

export type StatPanelOpts = CommonPanelOpts & {
  reduceCalc?: 'lastNotNull' | 'last' | 'first' | 'mean' | 'min' | 'max' | 'sum' | 'count' | 'median' | 'diff' | 'range'
  graphMode?: BigValueGraphMode
  options?: RecursivePartial<SingleStatPanelOptions>
}

export function NewStatPanel(opts: StatPanelOpts, ...targets: Target[]): Panel {
  targets = [...(opts.targets || []), ...(targets || [])]
  const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
    ...defaultPanel,
    datasource: opts.datasource,
    type: 'stat',
    title: opts.title,
    description: opts.description,
    interval: opts.interval,
    maxDataPoints: opts.maxDataPoints,
    gridPos: { x: 0, y: 0, w: opts.width ?? 0, h: opts.height ?? 0 },
    targets: fromTargets(targets, opts.datasource),
    fieldConfig: {
      defaults: {
        mappings: opts.mappings ?? (opts.defaultUnit === Unit.DATE_TIME_FROM_NOW ? [{ type: MappingType.ValueToText, options: { '0': { text: '-', index: 0 } } }] : []),
        // thresholds: opts.thresholds ?? { mode: ThresholdsMode.Absolute, steps: [{ color: 'green', value: null }] },
        thresholds: opts.thresholds ?? { mode: ThresholdsMode.Absolute, steps: [{ color: 'transparent', value: null }] },
        unit: opts.defaultUnit,
        decimals: opts.decimals,
        ...opts.fieldConfigDefaults,
      },
      overrides: opts.overrides ?? [],
    },
    options: deepMerge<SingleStatPanelOptions>(
      {
        reduceOptions: {
          values: false,
          fields: '',
          calcs: [opts.reduceCalc ?? 'lastNotNull'],
        },
        orientation: VizOrientation.Auto,
        textMode: BigValueTextMode.Auto,
        colorMode: BigValueColorMode.Background,
        graphMode: opts.graphMode ?? BigValueGraphMode.Area,
        justifyMode: BigValueJustifyMode.Auto,
        showPercentChange: false,
        wideLayout: true,
        percentChangeColorMode: PercentChangeColorMode.Standard,
        text: {},
      },
      opts.options as Partial<SingleStatPanelOptions>
    ) as unknown as Record<string, unknown>,
    transformations: opts.transformations ?? [],
    transparent: false,
  }
  return panel as Panel
}

export type BarGaugePanelOpts = CommonPanelOpts & {
  options?: Partial<BarGaugePanelOptions>
}

export function NewBarGaugePanel(opts: BarGaugePanelOpts): Panel {
  const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
    ...defaultPanel,
    datasource: opts.datasource,
    type: 'bargauge',
    title: opts.title,
    description: opts.description,
    interval: opts.interval,
    maxDataPoints: opts.maxDataPoints,
    gridPos: { x: 0, y: 0, w: opts.width ?? 0, h: opts.height ?? 0 },
    targets: fromTargets(opts.targets, opts.datasource),
    fieldConfig: {
      defaults: {
        mappings: opts.mappings,
        thresholds: opts.thresholds,
        unit: opts.defaultUnit,
      },
      overrides: opts.overrides ?? [],
    },
    options: {
      reduceOptions: {
        values: false,
        calcs: ['lastNotNull'],
        fields: '',
      },
      orientation: VizOrientation.Auto,
      displayMode: BarGaugeDisplayMode.Basic,
      valueMode: BarGaugeValueMode.Color,
      showUnfilled: true,
      namePlacement: BarGaugeNamePlacement.Left,
      sizing: BarGaugeSizing.Manual,
      minVizWidth: 0,
      minVizHeight: 15,
      maxVizHeight: 300,
      text: {},
      legend: {
        ...defaultVizLegendOptions,
        calcs: [],
        displayMode: LegendDisplayMode.Table,
        placement: 'right',
        showLegend: false,
      },
      ...opts.options,
    } satisfies BarGaugePanelOptions,
    transformations: opts.transformations ?? [],
    transparent: false,
  }
  return panel as Panel
}

export type TablePanelOpts = CommonPanelOpts & {
  options?: Partial<TablePanelOptions>
  tableConfig?: {
    queries: Record<
      string,
      {
        target?: Target
        name?: string
        width?: number
        unit?: Unit
        overrides?: Record<string, unknown>
      }
    >
    excludeColumns?: string[]
    extraTransformations?: Panel['transformations']
  }
}

export function NewTablePanel(opts: TablePanelOpts): Panel {
  const tableOverrides = {}
  const tableIndexOrder = []
  const transformations = opts.transformations ?? []
  const colRenames = {}
  const targets = opts.targets ?? []
  if (opts.tableConfig) {
    const { queries, excludeColumns, extraTransformations } = opts.tableConfig
    for (const [refId, { target, unit, width, overrides, name }] of Object.entries(queries)) {
      const curOverrides = { ...overrides }
      if (unit) {
        curOverrides['unit'] = unit
      }
      if (width) {
        curOverrides['custom.width'] = width
      }
      if (target) {
        if (name) {
          colRenames[`Value #${refId}`] = name
        } else {
          colRenames[`Value #${refId}`] = refId
        }
        tableIndexOrder.push(`Value #${refId}`)
        tableOverrides[`Value #${refId}`] = curOverrides
        // targets.push({ ...target, refId: refId, type: (target as any).type || 'instant', format: target.format || 'table' })
        targets.push({ ...target, refId: refId })
      } else {
        if (name) {
          colRenames[refId] = name
        }
        tableIndexOrder.push(refId)
        tableOverrides[refId] = curOverrides
      }
    }
    transformations.push({ id: 'merge', options: {} })
    transformations.push({
      id: 'organize',
      options: {
        indexByName: tableIndexByName(tableIndexOrder),
        excludeByName: tableExcludeByName(excludeColumns ?? []),
        renameByName: colRenames,
      },
    })
    if (extraTransformations) {
      transformations.push(...extraTransformations)
    }
  }

  const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
    ...defaultPanel,
    datasource: opts.datasource,
    type: 'table',
    title: opts.title,
    description: opts.description,
    interval: opts.interval,
    maxDataPoints: opts.maxDataPoints,
    gridPos: { x: 0, y: 0, w: opts.width ?? 0, h: opts.height ?? 0 },
    targets: fromTargets(targets, opts.datasource),
    fieldConfig: {
      defaults: {
        mappings: opts.mappings,
        thresholds: opts.thresholds,
        unit: opts.defaultUnit,
      },
      overrides: opts.overrides ?? overridesMatchByName(tableOverrides),
    },
    options: {
      cellHeight: TableCellHeight.Md,
      frameIndex: -1,
      showHeader: true,
      ...opts.options,
    } satisfies TablePanelOptions,
    transformations: transformations,
    transparent: false,
    timeFrom: opts.timeFrom ?? defaultPanel.timeFrom,
  }
  return panel as Panel
}

export type PieChartPanelOpts = CommonPanelOpts & {
  options?: Partial<PieChartPanelOptions>
}

export function NewPieChartPanel(opts: PieChartPanelOpts, ...targets: Target[]): Panel {
  targets = [...(opts.targets || []), ...(targets || [])]
  const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
    ...defaultPanel,
    datasource: opts.datasource,
    type: 'piechart',
    title: opts.title,
    description: opts.description,
    interval: opts.interval,
    maxDataPoints: opts.maxDataPoints,
    gridPos: { x: 0, y: 0, w: opts.width ?? 0, h: opts.height ?? 0 },
    targets: fromTargets(targets, opts.datasource),
    fieldConfig: {
      defaults: {
        mappings: opts.mappings,
        thresholds: opts.thresholds,
        unit: opts.defaultUnit,
      },
      overrides: opts.overrides ?? [],
    },
    options: deepMerge<PieChartPanelOptions>(
      {
        displayLabels: [],
        legend: {
          showLegend: true,
          displayMode: LegendDisplayMode.Table,
          placement: 'right',
          values: [PieChartLegendValues.Percent, PieChartLegendValues.Value],
          calcs: [],
        },
        orientation: VizOrientation.Auto,
        pieType: PieChartType.Pie,
        reduceOptions: {
          values: false,
          calcs: ['lastNotNull'],
          fields: '',
        },
        tooltip: {
          mode: TooltipDisplayMode.Multi,
          sort: SortOrder.Descending,
        },
      },
      opts.options
    ) as unknown as Record<string, unknown>,
    transformations: opts.transformations ?? [],
    transparent: false,
  }
  return panel as Panel
}
