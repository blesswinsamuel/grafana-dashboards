import * as units from '@grafana/grafana-foundation-sdk/units'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as expr from '@grafana/grafana-foundation-sdk/expr'
import * as common from '@grafana/grafana-foundation-sdk/common'
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import * as cog from '@grafana/grafana-foundation-sdk/cog'
import { CommonPanelOpts, inferUnit, withCommonOpts } from './commons'
import { PrometheusTarget, Target } from './target'

export type TimeSeriesPanelOpts = CommonPanelOpts<PrometheusTarget> & {
  type?: 'bar' | 'line'
  legendPlacement?: common.LegendPlacement
  stackingMode?: common.StackingMode
}
export function NewTimeSeriesPanel(opts: TimeSeriesPanelOpts, ...targets: PrometheusTarget[]): cog.Builder<dashboard.Panel> {
  ;[opts.unit, opts.type] = inferUnit(targets, opts.type, opts.unit)
  opts.targets = [...(opts.targets || []), ...(targets || [])]
  const legendCalcs = opts.legendCalcs ?? { bar: ['sum'], line: ['min', 'max', 'mean', 'lastNotNull'] }[opts.type]
  const b = new timeseries.PanelBuilder()
  withCommonOpts(b, opts)
  b.axisCenteredZero(false)
  b.axisColorMode(common.AxisColorMode.Text)
  b.axisGridShow(true)
  b.axisLabel('')
  b.axisPlacement(common.AxisPlacement.Auto)
  b.barAlignment(0)
  b.drawStyle(common.GraphDrawStyle.Line)
  b.fillOpacity(0)
  b.gradientMode(common.GraphGradientMode.None)
  b.lineInterpolation(common.LineInterpolation.Linear)
  b.lineWidth(1)
  b.pointSize(5)
  b.showPoints(common.VisibilityMode.Auto)
  b.spanNulls(false)
  b.thresholdsStyle(new common.GraphThresholdsStyleConfigBuilder().mode(opts.thresholdsStyleMode ?? common.GraphThresholdsStyleMode.Off))

  switch (opts.type) {
    case 'bar':
      b.drawStyle(common.GraphDrawStyle.Bars)
      b.fillOpacity(100)
      b.lineInterpolation(common.LineInterpolation.StepAfter)
      b.showPoints(common.VisibilityMode.Never)
      b.stacking(new common.StackingConfigBuilder().mode(opts.stackingMode ?? common.StackingMode.Normal))
      b.maxDataPoints(opts.maxDataPoints ?? 100)
      break
    case 'line':
      b.drawStyle(common.GraphDrawStyle.Line)
      b.fillOpacity(0)
      b.lineInterpolation(common.LineInterpolation.Linear)
      b.showPoints(common.VisibilityMode.Auto)
      b.stacking(new common.StackingConfigBuilder().mode(opts.stackingMode ?? common.StackingMode.None))
      b.maxDataPoints(opts.maxDataPoints ?? 100)
      break
  }

  const lb = new common.VizLegendOptionsBuilder()
    .placement(opts.legendPlacement ?? common.LegendPlacement.Bottom)
    .showLegend(true)
    .calcs(legendCalcs)
    .displayMode(common.LegendDisplayMode.Table)
  const legendSortBy = legendCalcs[legendCalcs.length - 1]
  const legendSortByName = legendSortBy
    ? {
        mean: 'Mean',
        min: 'Min',
        max: 'Max',
        last: 'Last',
        lastNotNull: 'Last *',
        sum: 'Total',
        '': 'None',
      }[legendSortBy]
    : undefined
  if (legendSortByName) {
    lb.sortBy(legendSortByName)
    lb.sortDesc(true)
  }
  b.legend(lb)

  b.tooltip(new common.VizTooltipOptionsBuilder().mode(common.TooltipDisplayMode.Multi).sort(common.SortOrder.Descending))
  //   if (opts.timezone !== undefined) b.timezone(opts.timezone)
  //   if (opts.legend !== undefined) b.legend({ build: () => opts.legend! })
  //   if (opts.tooltip !== undefined) b.tooltip({ build: () => opts.tooltip! })
  //   if (opts.orientation !== undefined) b.orientation(opts.orientation)

  //   fieldConfig: {
  //   defaults: {
  //     color: {
  //       mode: FieldColorModeId.PaletteClassic,
  //     },
  //     custom: {
  //       axisCenteredZero: false,
  //       axisColorMode: AxisColorMode.Text,
  //       axisGridShow: true,
  //       axisLabel: '',
  //       axisPlacement: AxisPlacement.Auto,
  //       barAlignment: 0,
  //       drawStyle: GraphDrawStyle.Line,
  //       fillOpacity: 0,
  //       gradientMode: GraphGradientMode.None,
  //       hideFrom: {
  //         legend: false,
  //         tooltip: false,
  //         viz: false,
  //       },
  //       lineInterpolation: LineInterpolation.Linear,
  //       lineWidth: 1,
  //       pointSize: 5,
  //       scaleDistribution: {
  //         type: ScaleDistribution.Linear,
  //       },
  //       showPoints: VisibilityMode.Auto,
  //       spanNulls: false,
  //       stacking: {
  //         group: 'A',
  //         mode: StackingMode.None,
  //       },
  //       thresholdsStyle: {
  //         mode: opts.thresholdsStyleMode ?? GraphThresholdsStyleMode.Off,
  //       },
  //     },
  //     mappings: opts.mappings,
  //     thresholds: opts.thresholds,
  //     unit: opts.defaultUnit,
  //     min: opts.min,
  //     max: opts.max,
  //     ...opts.fieldConfigDefaults,
  //   },
  //   overrides: opts.overrides ?? [],
  // },

  return b
}
