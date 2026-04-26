import type * as cog from '@grafana/grafana-foundation-sdk/cog'
import type * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as expr from '@grafana/grafana-foundation-sdk/expr'
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
import type { PrometheusTarget, SqlTarget, Target } from '../promql'
import { dangerouslyAddCustomValues } from '../sdk-compat'

export type { PrometheusTarget, SqlTarget, Target } from '../promql'

function generateRefId(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i)
  return `Q${i}`
}

export function buildTargets(targets: Target[], datasource?: dashboard.DataSourceRef): cog.Builder<any>[] {
  return targets.map((target, i) => {
    const ds = target.datasource ?? datasource
    const refId = target.refId ?? generateRefId(i)

    if (target.kind === 'sql') {
      const b = new expr.TypeSqlBuilder()
        .format(target.format || 'table')
        .queryType('table')
        .refId(refId)
      if (ds) b.datasource(ds)
      dangerouslyAddCustomValues(b, { rawSql: target.rawSql, rawQuery: true } as any)
      return b
    }

    const b = new prometheus.DataqueryBuilder()
      .expr(target.expr.toString())
      .format(
        {
          heatmap: prometheus.PromQueryFormat.Heatmap,
          table: prometheus.PromQueryFormat.Table,
          time_series: prometheus.PromQueryFormat.TimeSeries,
        }[target.format],
      )
      .refId(refId)
    if (ds) b.datasource(ds)
    if (target.legendFormat) b.legendFormat(target.legendFormat)
    if (target.type === 'both') b.rangeAndInstant()
    else if (target.type === 'instant') b.instant()
    else b.range()

    return b
  })
}
