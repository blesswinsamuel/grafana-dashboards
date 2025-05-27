import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
import * as promql from '@grafana/promql-builder'
import { PrometheusTarget } from './panels/target'

export function formatLegendFormat(legendFormat: string | undefined, groupBy: string[] | undefined) {
  if (!legendFormat) {
    legendFormat = groupBy ? groupBy.map((k) => `{{${k}}}`).join(' - ') : 'value'
  }
  return legendFormat
}

export const mergeSelectors = (...selectors: (string | string[] | undefined)[]) => {
  return selectors
    .flat()
    .filter((s) => s)
    .join(', ')
}

export type CommonMetricOpts = {
  description?: string
  labels?: string[]
  selectors?: string | string[]
  // wrap?: string
  // append?: string
  // prepend?: string
}

export type CommonQueryOpts = Omit<CommonMetricOpts, 'description' | 'labels'> & {
  // selectors?: string | string[]
  // wrap?: WrapFn<promql.Expr>

  // refId?: string
  groupBy?: string[]
  // legendFormat?: string
  type?: 'range' | 'instant' | 'both'
}

export type TargetOptions = {
  refId?: string
  legendFormat?: string
  groupBy?: string[]
  type?: 'range' | 'instant' | 'both'
  format?: 'table' | 'time_series' | 'heatmap'
}

type PrometheusQueryRawOpts = { type?: 'range' | 'instant' | 'both'; groupBy?: string[] }

class PrometheusQueryRaw<T extends promql.Expr> implements cog.Builder<T> {
  constructor(
    private readonly expr: cog.Builder<T>,
    readonly opts?: PrometheusQueryRawOpts,
  ) {}

  public target(opts?: TargetOptions): PrometheusTarget {
    // const { legendFormat, groupBy = this.opts?.groupBy, type = this.opts?.type, refId } = opts ?? {}
    // const b = new prometheus.DataqueryBuilder()
    // b.expr(this.expr)
    // if (refId) {
    //   b.refId(refId)
    // }
    // const format: prometheus.PromQueryFormat | undefined = opts?.format
    //   ? {
    //       time_series: prometheus.PromQueryFormat.TimeSeries,
    //       table: prometheus.PromQueryFormat.Table,
    //       heatmap: prometheus.PromQueryFormat.Heatmap,
    //     }[opts.format]
    //   : type === 'instant'
    //     ? prometheus.PromQueryFormat.Table
    //     : undefined
    // if (format) {
    //   b.format(format)
    // }
    // b.legendFormat(formatLegendFormat(legendFormat, groupBy))
    // if (type === 'instant') {
    //   b.instant()
    // } else if (type === 'range') {
    //   b.range()
    // }
    // return b.build()
    const { legendFormat, groupBy = this.opts?.groupBy, type = this.opts?.type, refId } = opts ?? {}
    return {
      expr: this.expr,
      refId: refId,
      format: type === 'instant' ? 'table' : 'time_series',
      legendFormat: formatLegendFormat(legendFormat, groupBy),
      type: type ?? 'range',
    }
  }

  public toString() {
    return this.expr.toString()
  }

  public calc(aggrOp: promql.AggregationOp, opts: { groupBy?: string[] } = {}): PrometheusQueryRaw<promql.AggregationExpr> {
    const qb = applyAggr(aggrOp, this.expr).by(opts.groupBy ?? [])
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }

  public wrap<TT extends promql.Expr, WrapT extends WrapFn<TT> | undefined>(wrap?: WrapT): WrapT extends undefined ? PrometheusQueryRaw<T> : PrometheusQueryRaw<TT> {
    type ResultT = WrapT extends undefined ? PrometheusQueryRaw<T> : PrometheusQueryRaw<TT>
    if (!wrap) {
      return newPrometheusQueryRaw(this.expr, this.opts) as ResultT
    }
    return newPrometheusQueryRaw(wrap(this.expr), this.opts) as ResultT
  }

  public build(): T {
    return this.expr.build()
  }
}

export type WrapFn<TT extends promql.Expr = promql.Expr> = (expr: cog.Builder<promql.Expr>) => cog.Builder<TT>

// export function newPrometheusQueryRaw<T extends promql.Expr, TT extends promql.Expr>(expr: cog.Builder<T>, opts?: PrometheusQueryRawOpts, wrap?: undefined): PrometheusQueryRaw<T>
// export function newPrometheusQueryRaw<T extends promql.Expr, TT extends promql.Expr>(expr: cog.Builder<T>, opts?: PrometheusQueryRawOpts, wrap?: WrapFn<TT>): PrometheusQueryRaw<TT>
// export function newPrometheusQueryRaw<T extends promql.Expr, TT extends promql.Expr>(
//   //
//   expr: cog.Builder<T>,
//   opts?: PrometheusQueryRawOpts,
//   wrap?: WrapFn<TT>
// ): PrometheusQueryRaw<T> | PrometheusQueryRaw<TT> {
//   if (wrap) {
//     return new PrometheusQueryRaw(wrap(expr), opts)
//   }
//   return new PrometheusQueryRaw(expr, opts)
// }

export function newPrometheusQueryRaw<T extends promql.Expr>(expr: cog.Builder<T>, opts?: PrometheusQueryRawOpts): PrometheusQueryRaw<T> {
  return new PrometheusQueryRaw(expr, opts)
}

class PrometheusMetricBase {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {},
  ) {}
  public labels() {
    return this.opts.labels
  }
  public description() {
    return this.opts.description
  }
}

type FunctionVal = 'rate' | 'irate' | 'increase' | 'resets' | 'delta' | 'idelta' | 'changes' | 'deriv' | 'predict_linear' | 'histogram_quantile' | 'histogram_share'

function applyFunc(functionVal: FunctionVal, ...args: promql.Builder<promql.Expr>[]): promql.FuncCallExprBuilder {
  const builder = new promql.FuncCallExprBuilder()
  builder.functionVal(functionVal)
  builder.args(args)
  return builder
}

function applyAggr(op: promql.AggregationOp, vector: promql.Builder<promql.Expr>): promql.AggregationExprBuilder {
  const builder = new promql.AggregationExprBuilder()
  builder.op(op)
  builder.expr(vector)
  return builder
}

type BinaryOp = promql.BinaryOp | 'default'

export function applyBinaryOp(left: cog.Builder<promql.Expr>, op: BinaryOp, right: cog.Builder<promql.Expr>): promql.BinaryExprBuilder {
  const builder = new promql.BinaryExprBuilder()
  builder.op(op as any)
  builder.left(left)
  builder.right(right)
  return builder
}

function parsePromQLSelectors(input: string): promql.LabelSelector[] {
  const regex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(=~|!~|=|!=)\s*("(?:\\.|[^"\\])*")/g

  const selectors: promql.LabelSelector[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    const [, key, operator, rawValue] = match
    if (!key) {
      throw new Error(`Invalid selector "${input}" - missing key`)
    }
    if (!operator) {
      throw new Error(`Invalid selector "${input}" - missing operator`)
    }
    if (rawValue === undefined || !rawValue.startsWith('"') || !rawValue.endsWith('"')) {
      throw new Error(`Invalid selector "${input}" - value must be a quoted string`)
    }
    const value = rawValue.slice(1, -1)
    if (operator !== '=' && operator !== '!=' && operator !== '=~' && operator !== '!~') {
      throw new Error(`Invalid operator "${operator}" in selector '${key}${operator}${value}' (input: '${input}')`)
    }
    selectors.push({ name: key, operator, value })
  }

  return selectors
}

function applyLabels<T extends promql.VectorExprBuilder>(expr: T, selectors: string): T {
  const labels: promql.LabelSelector[] = parsePromQLSelectors(selectors || '')
  const bs = []
  for (const label of labels) {
    const b = new promql.LabelSelectorBuilder()
    b.name(label.name)
    b.operator(label.operator)
    b.value(label.value)
    bs.push(b)
  }
  return expr.labels(bs)
}

function getRangeString(opts: CommonQueryOpts & { interval?: string }, functionVal?: FunctionVal): string {
  if (opts.interval) {
    return opts.interval
  }
  if (opts.type === 'instant') {
    return '$__range'
  }
  if (functionVal === 'rate' || functionVal === 'irate' || functionVal === 'histogram_quantile' || functionVal === 'histogram_share') {
    return '$__rate_interval'
  }
  if (functionVal === 'increase') {
    return '$__interval'
  }
  // default to $__interval
  return '$__interval'
}

export class CounterMetric extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {},
  ) {
    super(metric, opts)
  }
  public calc(aggrOp: promql.AggregationOp, functionVal: FunctionVal, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw<promql.AggregationExpr> {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const range = getRangeString(opts, functionVal)
    let qb = applyAggr(aggrOp, applyFunc(functionVal, applyLabels(promql.vector(metric), selectors).range(range))).by(opts.groupBy ?? [])
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }
  public percentage(opts: CommonQueryOpts & { numeratorSelectors?: string | string[]; denominatorSelectors?: string | string[]; func?: 'rate' | 'increase' }): PrometheusQueryRaw<promql.BinaryExpr> {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const numeratorSelectors = mergeSelectors(selectors, opts.numeratorSelectors || '')
    const denominatorSelectors = mergeSelectors(selectors, opts.denominatorSelectors || '')
    const range = getRangeString(opts, func)
    let qb = promql.div(
      //
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric), numeratorSelectors).range(range))).by(opts.groupBy ?? []),
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric), denominatorSelectors).range(range))).by(opts.groupBy ?? []),
    )
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }
}

export class GaugeMetric extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {},
  ) {
    super(metric, opts)
  }
  public calc(aggrOp: promql.AggregationOp | undefined, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw<promql.VectorExpr | promql.AggregationExpr> {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const mb = applyLabels(promql.vector(metric), selectors)
    if (opts.interval) mb.range(opts.interval)
    if (aggrOp) {
      const qb = applyAggr(aggrOp, mb).by(opts.groupBy ?? [])
      return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
    }
    return newPrometheusQueryRaw(mb, { ...this.opts, ...opts })
  }
  public raw(opts: CommonQueryOpts): PrometheusQueryRaw<promql.VectorExpr> {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const qb = applyLabels(promql.vector(metric), selectors)
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }
}

class HistogramSummaryCommon extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {},
  ) {
    super(metric, opts)
  }
  public count() {
    return new CounterMetric(this.metric + '_count', this.opts)
  }
  public sum() {
    return new CounterMetric(this.metric + '_sum', this.opts)
  }
  public avg(opts: CommonQueryOpts & { func?: 'rate' | 'increase' }): PrometheusQueryRaw<promql.BinaryExpr> {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const range = getRangeString(opts, func)
    const qb = promql.div(
      //
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric + '_sum'), selectors).range(range))).by(opts.groupBy ?? []),
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric + '_count'), selectors).range(range))).by(opts.groupBy ?? []),
    )
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }
}

export class HistogramMetric extends HistogramSummaryCommon {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {},
  ) {
    super(metric, opts)
  }
  public calc(func: 'histogram_quantile' | 'histogram_share', value: string, opts: CommonQueryOpts): PrometheusQueryRaw<promql.FuncCallExpr> {
    const metric = this.metric + '_bucket'
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const groupBy = ['le', ...(opts.groupBy || [])]
    const iqb = promql.sum(promql.rate(applyLabels(promql.vector(metric), selectors).range(getRangeString(opts, func)))).by(groupBy)
    const qb = applyFunc(func, promql.n(parseFloat(value)), iqb)
    return newPrometheusQueryRaw(qb, { ...this.opts, ...opts })
  }
  public quantile(value: string, opts: CommonQueryOpts): PrometheusQueryRaw<promql.FuncCallExpr> {
    return this.calc('histogram_quantile', value, opts)
  }
  public share(value: string, opts: CommonQueryOpts): PrometheusQueryRaw<promql.FuncCallExpr> {
    return this.calc('histogram_share', value, opts)
  }
}

export class SummaryMetric extends HistogramSummaryCommon {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {},
  ) {
    super(metric, opts)
  }
  public quantile(value: string): GaugeMetric {
    const selectors = mergeSelectors(this.opts.selectors, `quantile="${value}"`)
    return new GaugeMetric(this.metric, { ...this.opts, selectors })
  }
}

// wrap helpers
export function wrapMultiply(n: number): WrapFn<promql.BinaryExpr> {
  return (expr: cog.Builder<promql.Expr>) => {
    return applyBinaryOp(expr, '*', promql.n(n))
  }
}

export function wrapConditional(op: '>' | '<' | '==' | '!=' | '>=' | '<=' | 'default' | '*', value: number): WrapFn<promql.BinaryExpr> {
  return (expr: cog.Builder<promql.Expr>) => {
    return applyBinaryOp(expr, op, promql.n(value))
  }
}
