import * as common from '@grafana/grafana-foundation-sdk/common'
import * as logs from '@grafana/grafana-foundation-sdk/logs'
import type { Target } from '../promql'
import { type CommonPanelOpts, withCommonOpts } from './commons'

export type LokiLogsPanelOpts = CommonPanelOpts

export function NewLokiLogsPanel(opts: LokiLogsPanelOpts, ...extraTargets: Target[]): logs.PanelBuilder {
  if (extraTargets.length > 0) opts = { ...opts, targets: [...(opts.targets ?? []), ...extraTargets] }
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
