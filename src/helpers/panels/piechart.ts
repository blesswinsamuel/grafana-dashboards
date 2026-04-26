import * as common from '@grafana/grafana-foundation-sdk/common'
import * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import type { Target } from '../promql'
import { type CommonPanelOpts, inferPanelDefaults, withCommonOpts } from './commons'

export type PieChartPanelOpts = CommonPanelOpts & Partial<Pick<piechart.Options, 'orientation'>>

export function NewPieChartPanel(opts: PieChartPanelOpts, ...extraTargets: Target[]): piechart.PanelBuilder {
  if (extraTargets.length > 0) opts = { ...opts, targets: [...(opts.targets ?? []), ...extraTargets] }
  const defaults = inferPanelDefaults(opts.targets ?? [])
  opts.unit = opts.unit ?? defaults.unit
  const b = new piechart.PanelBuilder()
  withCommonOpts(b, opts)
  b.orientation(opts.orientation ?? common.VizOrientation.Auto)

  const lb = new piechart.PieChartLegendOptionsBuilder()
  lb.showLegend(true)
  lb.displayMode(common.LegendDisplayMode.Table)
  lb.placement(common.LegendPlacement.Right)
  lb.values([piechart.PieChartLegendValues.Percent, piechart.PieChartLegendValues.Value])
  lb.calcs([])
  b.legend(lb)
  b.reduceOptions(new common.ReduceDataOptionsBuilder().values(true))
  b.tooltip(new common.VizTooltipOptionsBuilder().mode(common.TooltipDisplayMode.Multi).sort(common.SortOrder.Descending))
  b.pieType(piechart.PieChartType.Pie)
  b.displayLabels([])
  return b
}
