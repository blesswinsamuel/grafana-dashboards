import * as common from '@grafana/grafana-foundation-sdk/common'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as stat from '@grafana/grafana-foundation-sdk/stat'
import * as units from '@grafana/grafana-foundation-sdk/units'
import { CommonPanelOpts, withCommonOpts } from './commons'
import { PrometheusTarget, Target } from './target'

export type StatPanelOpts = CommonPanelOpts<Target> &
  Partial<stat.Options> & {
    reduceCalc?: 'lastNotNull' | 'last' | 'first' | 'mean' | 'min' | 'max' | 'sum' | 'count' | 'median' | 'diff' | 'range'
    reduceFields?: string
    orientation?: common.VizOrientation
    textTitleSize?: number
    textValueSize?: number
  }

export function NewStatPanel(opts: StatPanelOpts, ...targets: Target[]): stat.PanelBuilder {
  opts.targets = [...(opts.targets || []), ...(targets || [])]
  opts.mappings = opts.mappings ?? (opts.unit === units.DateTimeFromNow ? [{ type: dashboard.MappingType.ValueToText, options: { '0': { text: '-', index: 0 } } }] : [])
  opts.thresholds = { mode: dashboard.ThresholdsMode.Absolute, steps: [{ color: 'transparent', value: null }] }
  const b = new stat.PanelBuilder()
  withCommonOpts(b, opts)
  b.graphMode(opts.graphMode ?? common.BigValueGraphMode.Area)
  b.reduceOptions(
    new common.ReduceDataOptionsBuilder()
      .calcs([opts.reduceCalc ?? 'lastNotNull'])
      .fields(opts.reduceFields ?? '')
      .values(false)
  )
  const tb = new common.VizTextDisplayOptionsBuilder()
  if (opts.textTitleSize !== undefined) tb.titleSize(opts.textTitleSize)
  if (opts.textValueSize !== undefined) tb.valueSize(opts.textValueSize)
  if (opts.orientation !== undefined) b.orientation(opts.orientation)
  b.textMode(common.BigValueTextMode.Auto)
  b.justifyMode(common.BigValueJustifyMode.Auto)
  b.wideLayout(true)
  b.colorMode(common.BigValueColorMode.Background)
  b.showPercentChange(false)
  b.percentChangeColorMode(common.PercentChangeColorMode.Standard)
  return b
}
