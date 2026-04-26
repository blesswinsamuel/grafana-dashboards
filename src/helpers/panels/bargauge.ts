import * as bargauge from '@grafana/grafana-foundation-sdk/bargauge'
import * as common from '@grafana/grafana-foundation-sdk/common'
import type { Target } from '../promql'
import { type CommonPanelOpts, inferPanelDefaults, withCommonOpts } from './commons'

export type BarGaugePanelOpts = CommonPanelOpts & Partial<Pick<bargauge.Options, 'orientation'>>

export function NewBarGaugePanel(opts: BarGaugePanelOpts, ...extraTargets: Target[]): bargauge.PanelBuilder {
  if (extraTargets.length > 0) opts = { ...opts, targets: [...(opts.targets ?? []), ...extraTargets] }
  const defaults = inferPanelDefaults(opts.targets ?? [])
  opts.unit = opts.unit ?? defaults.unit
  // BarGauge typically uses instant queries
  const targets: Target[] = (opts.targets ?? []).map((t) => (t.kind === 'prometheus' ? { ...t, type: t.type ?? 'instant' } : t))
  const b = new bargauge.PanelBuilder()
  withCommonOpts(b, { ...opts, targets })
  b.orientation(opts.orientation ?? common.VizOrientation.Auto)
  return b
}
