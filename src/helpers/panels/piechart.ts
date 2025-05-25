import * as common from '@grafana/grafana-foundation-sdk/common'
import * as piechart from '@grafana/grafana-foundation-sdk/piechart'
import { CommonPanelOpts, withCommonOpts } from './commons'
import { PrometheusTarget, Target } from './target'

export type PieChartPanelOpts = CommonPanelOpts<PrometheusTarget> & Partial<Pick<piechart.Options, 'orientation'>> & {}

export function NewPieChartPanel(opts: PieChartPanelOpts, ...targets: Target[]): piechart.PanelBuilder {
  const b = new piechart.PanelBuilder()
  withCommonOpts(b, opts, ...targets)

  b.orientation(opts.orientation ?? common.VizOrientation.Auto)

  const lb = new piechart.PieChartLegendOptionsBuilder()
  lb.showLegend(true)
  lb.displayMode(common.LegendDisplayMode.Table)
  lb.placement(common.LegendPlacement.Right)
  lb.values([piechart.PieChartLegendValues.Percent, piechart.PieChartLegendValues.Value])
  lb.calcs([])
  b.legend(lb)

  b.reduceOptions(new common.ReduceDataOptionsBuilder().values(false).calcs(['lastNotNull']).fields(''))

  b.tooltip(new common.VizTooltipOptionsBuilder().mode(common.TooltipDisplayMode.Multi).sort(common.SortOrder.Descending))

  b.pieType(piechart.PieChartType.Pie)
  b.displayLabels([])

  return b
}
