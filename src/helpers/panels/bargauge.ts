import * as bargauge from '@grafana/grafana-foundation-sdk/bargauge'
import * as common from '@grafana/grafana-foundation-sdk/common'
import { CommonPanelOpts, withCommonOpts } from './commons'
import { PrometheusTarget, Target } from './target'
import { dashboard } from '../../grafana-helpers'

export type BarGaugePanelOpts = CommonPanelOpts<PrometheusTarget> & Partial<Pick<bargauge.Options, 'orientation'>> & {}

export function NewBarGaugePanel(opts: BarGaugePanelOpts, ...targets: PrometheusTarget[]): bargauge.PanelBuilder {
  const b = new bargauge.PanelBuilder()
  for (const t of targets) {
    t.type = t.type ?? 'instant'
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
