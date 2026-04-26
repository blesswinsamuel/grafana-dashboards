import * as barchart from '@grafana/grafana-foundation-sdk/barchart'
import * as common from '@grafana/grafana-foundation-sdk/common'
import type { Target } from '../promql'
import { type CommonPanelOpts, inferPanelDefaults, withCommonOpts } from './commons'

export type BarChartPanelOpts = CommonPanelOpts & Partial<Pick<barchart.Options, 'barRadius' | 'orientation'>>

export function NewBarChartPanel(opts: BarChartPanelOpts, ...extraTargets: Target[]): barchart.PanelBuilder {
  if (extraTargets.length > 0) opts = { ...opts, targets: [...(opts.targets ?? []), ...extraTargets] }
  const defaults = inferPanelDefaults(opts.targets ?? [])
  opts.unit = opts.unit ?? defaults.unit
  // BarChart typically uses instant queries with table format
  const targets: Target[] = (opts.targets ?? []).map((t) => (t.kind === 'prometheus' ? { ...t, type: t.type ?? 'instant', format: t.format ?? 'table' } : t))
  const b = new barchart.PanelBuilder()
  withCommonOpts(b, { ...opts, targets })
  b.orientation(opts.orientation ?? common.VizOrientation.Auto)
  return b
}
