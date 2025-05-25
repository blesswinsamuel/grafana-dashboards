import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
import { PrometheusTarget } from './panels/target'
import * as promql from '@grafana/promql-builder'

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
  wrap?: string
  append?: string
  prepend?: string

  // refId?: string
  groupBy?: string[]
  // legendFormat?: string
  type?: 'range' | 'instant' | 'both'
}

function formatMetric(
  expr: string,
  opts: {
    wrap?: string
    append?: string
    prepend?: string
  }
) {
  const { wrap, append, prepend } = opts
  if (wrap) {
    expr = wrap.replace('$__expr', expr)
  }
  if (append) {
    expr = `${expr}${append}`
  }
  if (prepend) {
    expr = `${prepend}${expr}`
  }
  return expr
}

export type TargetOptions = {
  refId?: string
  legendFormat?: string
  groupBy?: string[]
  type?: 'range' | 'instant' | 'both'
  format?: 'table' | 'time_series' | 'heatmap'
}

class PrometheusQueryRaw {
  constructor(
    private readonly expr: string,
    readonly opts?: {
      type?: 'range' | 'instant' | 'both'
      groupBy?: string[]
    }
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
    return this.expr
  }

  public calc(func: string, opts: { groupBy?: string[] } = {}): PrometheusQueryRaw {
    const groupByStr = opts.groupBy && opts.groupBy.length > 0 ? ` by (${opts.groupBy.join(', ')})` : ''
    return new PrometheusQueryRaw(`${func}(${this.expr})${groupByStr}`, {
      ...this.opts,
      groupBy: opts.groupBy,
    })
  }

  public wrap(wrap: string): PrometheusQueryRaw {
    return new PrometheusQueryRaw(wrap.replace('$__expr', this.expr), this.opts)
  }

  public append(append: string): PrometheusQueryRaw {
    return new PrometheusQueryRaw(`${this.expr}${append}`, this.opts)
  }

  public prepend(prepend: string): PrometheusQueryRaw {
    return new PrometheusQueryRaw(`${prepend}${this.expr}`, this.opts)
  }
}

class PrometheusMetricBase {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
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
  if (functionVal === 'rate' || functionVal === 'irate') {
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
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(aggrOp: promql.AggregationOp, functionVal: FunctionVal, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const range = getRangeString(opts, functionVal)
    let qb = applyAggr(aggrOp, applyFunc(functionVal, applyLabels(promql.vector(metric), selectors).range(range))).by(opts.groupBy ?? [])
    return new PrometheusQueryRaw(formatMetric(qb.toString(), { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
  public percentage(opts: CommonQueryOpts & { numeratorSelectors?: string | string[]; denominatorSelectors?: string | string[]; func?: 'rate' | 'increase' }): PrometheusQueryRaw {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const numeratorSelectors = mergeSelectors(selectors, opts.numeratorSelectors || '')
    const denominatorSelectors = mergeSelectors(selectors, opts.denominatorSelectors || '')
    const range = getRangeString(opts, func)
    let qb = promql.div(
      //
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric), numeratorSelectors).range(range))).by(opts.groupBy ?? []),
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric), denominatorSelectors).range(range))).by(opts.groupBy ?? [])
    )
    return new PrometheusQueryRaw(formatMetric(qb.toString(), { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
}

export class GaugeMetric extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(aggrOp: promql.AggregationOp | undefined, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const mb = applyLabels(promql.vector(metric), selectors)
    let qb: promql.VectorExprBuilder | promql.AggregationExprBuilder = mb
    if (opts.interval) mb.range(opts.interval)
    if (aggrOp) {
      qb = applyAggr(aggrOp, mb).by(opts.groupBy ?? [])
    }
    return new PrometheusQueryRaw(formatMetric(qb.toString(), { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
  public raw(opts: CommonQueryOpts): PrometheusQueryRaw {
    return this.calc(undefined, { ...this.opts, ...opts })
  }
}

class HistogramSummaryCommon extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public count() {
    return new CounterMetric(this.metric + '_count', this.opts)
  }
  public sum() {
    return new CounterMetric(this.metric + '_sum', this.opts)
  }
  public avg(opts: CommonQueryOpts & { func?: 'rate' | 'increase' }): PrometheusQueryRaw {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const range = getRangeString(opts, func)
    const qb = promql.div(
      //
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric + '_sum'), selectors).range(range))).by(opts.groupBy ?? []),
      applyAggr('sum', applyFunc(func, applyLabels(promql.vector(metric + '_count'), selectors).range(range))).by(opts.groupBy ?? [])
    )
    return new PrometheusQueryRaw(formatMetric(qb.toString(), { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
}

export class HistogramMetric extends HistogramSummaryCommon {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(func: 'histogram_quantile' | 'histogram_share', value: string, opts: CommonQueryOpts): PrometheusQueryRaw {
    const metric = this.metric + '_bucket'
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const groupBy = ['le', ...(opts.groupBy || [])]
    const iqb = promql.sum(promql.rate(applyLabels(promql.vector(metric), selectors).range(getRangeString(opts)))).by(groupBy)
    const qb = applyFunc(func, promql.n(parseFloat(value)), iqb)
    return new PrometheusQueryRaw(formatMetric(qb.toString(), { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
  public quantile(value: string, opts: CommonQueryOpts): PrometheusQueryRaw {
    return this.calc('histogram_quantile', value, opts)
  }
  public share(value: string, opts: CommonQueryOpts): PrometheusQueryRaw {
    return this.calc('histogram_share', value, opts)
  }
}

export class SummaryMetric extends HistogramSummaryCommon {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public quantile(value: string): GaugeMetric {
    const selectors = mergeSelectors(this.opts.selectors, `quantile="${value}"`)
    return new GaugeMetric(this.metric, { ...this.opts, selectors })
  }
}
