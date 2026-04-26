import * as common from '@grafana/grafana-foundation-sdk/common'
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries'
import type { Target } from '../promql'
import { type CommonPanelOpts, inferPanelDefaults, withCommonOpts } from './commons'

export type TimeseriesChartType = 'line' | 'bar' | 'scatter' | 'area'

export type TimeSeriesPanelOpts = CommonPanelOpts & {
  type?: TimeseriesChartType
  legendCalcs?: string[]
  legendPlacement?: common.LegendPlacement | 'right' | 'bottom'
  stackingMode?: common.StackingMode
}

export function NewTimeSeriesPanel(opts: TimeSeriesPanelOpts, ...extraTargets: Target[]): timeseries.PanelBuilder {
  if (extraTargets.length > 0) opts = { ...opts, targets: [...(opts.targets ?? []), ...extraTargets] }
  const defaults = inferPanelDefaults(opts.targets ?? [])
  opts.unit = opts.unit ?? defaults.unit
  // chartType: 'bar' hint from counter increase/delta, 'line' otherwise
  const chartType: TimeseriesChartType = opts.type ?? (defaults.chartType === 'bar' ? 'bar' : 'line')
  const legendCalcs =
    opts.legendCalcs ?? { bar: ['sum'], line: ['min', 'max', 'mean', 'lastNotNull'], scatter: ['mean', 'median', 'min', 'max'], area: ['min', 'max', 'mean', 'lastNotNull'] }[chartType]!

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

  switch (chartType) {
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
    case 'scatter':
      b.drawStyle(common.GraphDrawStyle.Points)
      b.fillOpacity(0)
      b.lineInterpolation(common.LineInterpolation.Linear)
      b.showPoints(common.VisibilityMode.Auto)
      b.pointSize(2)
      b.stacking(new common.StackingConfigBuilder().mode(opts.stackingMode ?? common.StackingMode.Normal))
      break
    case 'area':
      b.drawStyle(common.GraphDrawStyle.Line)
      b.fillOpacity(100)
      b.lineInterpolation(common.LineInterpolation.StepAfter)
      b.showPoints(common.VisibilityMode.Never)
      b.stacking(new common.StackingConfigBuilder().mode(opts.stackingMode ?? common.StackingMode.Normal))
      b.maxDataPoints(opts.maxDataPoints ?? 100)
      break
  }

  const lb = new common.VizLegendOptionsBuilder().showLegend(true).calcs(legendCalcs).displayMode(common.LegendDisplayMode.Table)
  if (opts.legendPlacement) {
    if (opts.legendPlacement === 'right') lb.placement(common.LegendPlacement.Right)
    else if (opts.legendPlacement === 'bottom') lb.placement(common.LegendPlacement.Bottom)
    else lb.placement(opts.legendPlacement as common.LegendPlacement)
  }
  if (legendCalcs.length === 0) lb.displayMode(common.LegendDisplayMode.List)
  const legendSortBy = legendCalcs[legendCalcs.length - 1]
  const legendSortByName = legendSortBy ? { mean: 'Mean', min: 'Min', max: 'Max', last: 'Last', lastNotNull: 'Last *', sum: 'Total', '': 'None' }[legendSortBy] : undefined
  if (legendSortByName) {
    lb.sortBy(legendSortByName)
    lb.sortDesc(true)
  }
  b.legend(lb)
  b.tooltip(new common.VizTooltipOptionsBuilder().mode(common.TooltipDisplayMode.Multi).sort(common.SortOrder.Descending))
  return b
}
