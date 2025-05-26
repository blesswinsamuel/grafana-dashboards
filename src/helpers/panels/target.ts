import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as expr from '@grafana/grafana-foundation-sdk/expr'
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
import { promql } from '../../grafana-helpers'

export type PrometheusTarget = { datasource?: dashboard.DataSourceRef } & {
  expr: string | cog.Builder<promql.Expr>
  // interval?: string
  legendFormat?: string
  refId?: string
  type?: 'range' | 'instant' | 'both'
  format?: 'table' | 'time_series' | 'heatmap'
}

export type SQLTarget = { datasource?: dashboard.DataSourceRef } & {
  rawSql: string
  refId?: string
  format?: 'table' | 'time_series' | 'heatmap'
}

export type Target = PrometheusTarget | SQLTarget

export const deepMerge = <T = { [key: string]: any }>(obj1: T, obj2?: Partial<T>): T => {
  const clone1 = structuredClone(obj1)
  if (!obj2) {
    return clone1
  }

  for (let key in obj2) {
    if (obj2[key] instanceof Object && clone1[key] instanceof Object) {
      if (obj2[key] instanceof Array && clone1[key] instanceof Array) {
        // don't merge array of strings
        // @ts-ignore
        clone1[key] = obj2[key]
      } else {
        // @ts-ignore
        clone1[key] = deepMerge(clone1[key], obj2[key])
      }
    } else {
      // @ts-ignore
      clone1[key] = obj2[key]
    }
  }

  return clone1
}

type fromTargetsReturnType<T> = T extends PrometheusTarget ? cog.Builder<prometheus.dataquery> : T extends SQLTarget ? cog.Builder<expr.TypeSql> : unknown

export function fromTargets<T extends Target>(targets: T[], datasource?: dashboard.DataSourceRef): fromTargetsReturnType<T>[] {
  return targets.map((target, i) => {
    const ds = target.datasource ?? datasource
    if ('rawSql' in target) {
      const b = new expr.TypeSqlBuilder()
        .format('table')
        .queryType('table')
        .refId(target.refId ?? String.fromCharCode('A'.charCodeAt(0) + i))
      b.expression(target.rawSql)
      if (ds) b.datasource(ds)
      return b
    }
    target.type = target.type ?? 'range'
    const b = new prometheus.DataqueryBuilder()
      .expr(target.expr.toString())
      .format(
        target.format
          ? {
              heatmap: prometheus.PromQueryFormat.Heatmap,
              table: prometheus.PromQueryFormat.Table,
              time_series: prometheus.PromQueryFormat.TimeSeries,
            }[target.format]
          : prometheus.PromQueryFormat.TimeSeries
      )
      .refId(target.refId ?? String.fromCharCode('A'.charCodeAt(0) + i))
    // .interval('$__interval')
    if (ds) b.datasource(ds)
    if (target.legendFormat) b.legendFormat(target.legendFormat)
    if (target.type === 'both') b.rangeAndInstant()
    if (target.type === 'instant') b.instant()
    if (target.type === 'range') b.range()

    return b
  }) as fromTargetsReturnType<T>[]
}
