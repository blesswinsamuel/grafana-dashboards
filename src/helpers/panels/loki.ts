import * as common from '@grafana/grafana-foundation-sdk/common'
import * as logs from '@grafana/grafana-foundation-sdk/logs'
import { CommonPanelOpts, withCommonOpts } from './commons'
import { PrometheusTarget } from './target'

export type LokiLogsPanelOpts = CommonPanelOpts<PrometheusTarget> & {
  reduceCalc?: 'lastNotNull' | 'last' | 'first' | 'mean' | 'min' | 'max' | 'sum' | 'count' | 'median' | 'diff' | 'range'
  graphMode?: common.BigValueGraphMode
}

export function NewLokiLogsPanel(opts: LokiLogsPanelOpts, ...targets: PrometheusTarget[]): logs.PanelBuilder {
  opts.targets = [...(opts.targets || []), ...(targets || [])]
  const b = new logs.PanelBuilder()
  withCommonOpts(b, opts)
  b.showTime(true)
  b.showLabels(false)
  b.showCommonLabels(false)
  b.wrapLogMessage(false)
  b.prettifyLogMessage(false)
  b.enableLogDetails(true)
  b.showLogContextToggle(false)
  b.dedupStrategy(common.LogsDedupStrategy.None)
  b.sortOrder(common.LogsSortOrder.Descending)

  return b
}
