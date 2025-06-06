import * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import * as common from '@grafana/grafana-foundation-sdk/common'
import { CommonPanelOpts, withCommonOpts } from './commons'
import { PrometheusTarget, Target } from './target'

export type BarChartPanelOpts = CommonPanelOpts<PrometheusTarget> & Partial<Pick<barchart.Options, 'barRadius' | 'orientation'>> & {}

export function NewBarChartPanel(opts: BarChartPanelOpts, ...targets: PrometheusTarget[]): barchart.PanelBuilder {
  const b = new barchart.PanelBuilder()
  for (const t of targets) {
    t.type = t.type ?? 'instant'
    t.format = t.format ?? 'table'
  }
  withCommonOpts(b, opts, ...targets)

  b.orientation(opts.orientation ?? common.VizOrientation.Auto)

  // const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
  //   options: {
  //     reduceOptions: {
  //       values: false,
  //       calcs: ['lastNotNull'],
  //       fields: '',
  //     },
  //     orientation: VizOrientation.Auto,
  //     displayMode: BarGaugeDisplayMode.Basic,
  //     valueMode: BarGaugeValueMode.Color,
  //     showUnfilled: true,
  //     namePlacement: BarGaugeNamePlacement.Left,
  //     sizing: BarGaugeSizing.Manual,
  //     minVizWidth: 0,
  //     minVizHeight: 15,
  //     maxVizHeight: 300,
  //     text: {},
  //     legend: {
  //       ...defaultVizLegendOptions,
  //       calcs: [],
  //       displayMode: LegendDisplayMode.Table,
  //       placement: 'right',
  //       showLegend: false,
  //     },
  //     ...opts.options,
  //   } satisfies BarGaugePanelOptions,
  // }
  return b
}
