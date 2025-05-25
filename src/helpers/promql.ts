import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus'
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

// class PrometheusQueryWithSelector extends PrometheusQueryRaw {
//   constructor(metric: PrometheusMetricBase, selector: string) {
//     super(`${metric.metric}{${selector}}`)
//   }
//   public range(range: string, resolution?: string): PrometheusQueryRaw {
//     if (resolution) {
//       return new PrometheusQueryRaw(`${this.expr}[${range}:${resolution}]`)
//     }
//     return new PrometheusQueryRaw(`${this.expr}[${range}]`)
//   }
// }

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
  // public select(...selectors: (string[] | string | undefined)[]): PrometheusQueryWithSelector {
  //   const selectorsStr = selectors
  //     .flat()
  //     .filter((s) => s)
  //     .join(', ')
  //   return new PrometheusQueryWithSelector(this, selectorsStr)
  // }
}

export class CounterMetric extends PrometheusMetricBase {
  constructor(
    public override readonly metric: string,
    protected override opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(func: string, aggrOp: string, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const interval = opts.interval ?? (opts.type === 'instant' ? '$__range' : aggrOp === 'rate' ? '$__rate_interval' : '$__interval')
    const groupByStr = opts.groupBy && opts.groupBy.length > 0 ? ` by (${opts.groupBy.join(', ')})` : ''
    return new PrometheusQueryRaw(formatMetric(`${func}(${aggrOp}(${metric}{${selectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts }), {
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
    const interval = func === 'rate' ? '$__rate_interval' : '$__interval'
    const groupByStr = opts.groupBy && opts.groupBy.length > 0 ? ` by (${opts.groupBy.join(', ')})` : ''
    return new PrometheusQueryRaw(formatMetric(`sum(${func}(${metric}{${numeratorSelectors}}[${interval}]))${groupByStr} / sum(${func}(${metric}{${denominatorSelectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts }), {
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
  public calc(func: string, opts: CommonQueryOpts & { interval?: string }): PrometheusQueryRaw {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const interval = opts.interval ? `[${opts.interval}]` : ''
    let expr = `${metric}{${selectors}}${interval}`
    if (func) {
      const groupByStr = opts.groupBy && opts.groupBy.length > 0 ? ` by (${opts.groupBy.join(', ')})` : ''
      expr = `${func}(${expr})${groupByStr}`
    }
    return new PrometheusQueryRaw(formatMetric(expr, { ...this.opts, ...opts }), {
      type: opts.type,
      groupBy: opts.groupBy,
    })
  }
  public raw(opts: CommonQueryOpts): PrometheusQueryRaw {
    return this.calc('', { ...this.opts, ...opts })
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
    const { func = 'rate', groupBy } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const groupByStr = groupBy ? ` by (${groupBy.join(', ')})` : ''
    const interval = func === 'rate' ? '$__rate_interval' : '$__interval'
    return new PrometheusQueryRaw(formatMetric(`sum(${func}(${metric}_sum{${selectors}}[${interval}]))${groupByStr} / sum(${func}(${metric}_count{${selectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts }), {
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
    const groupByStr = opts.groupBy && opts.groupBy.length > 0 ? ` by (le, ${opts.groupBy.join(', ')})` : ' by (le)'
    return new PrometheusQueryRaw(formatMetric(`${func}(${value}, sum(rate(${metric}{${selectors}}[$__rate_interval]))${groupByStr})`, { ...this.opts, ...opts }), {
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

// https://github.com/grafana/grafana/blob/main/packages/grafana-prometheus/src/querybuilder/types.ts
export interface PromVisualQuery {
  metric: string
  labels: QueryBuilderLabelFilter[]
  operations: QueryBuilderOperation[]
  binaryQueries?: PromVisualQueryBinary[]
}

export type PromVisualQueryBinary = VisualQueryBinary<PromVisualQuery>
export interface VisualQueryBinary<T> {
  operator: string
  vectorMatchesType?: 'on' | 'ignoring'
  vectorMatches?: string
  query: T
}

export interface QueryBuilderLabelFilter {
  label: string
  op: string
  value: string
}
export interface QueryBuilderOperation {
  id: PromOperationId
  params: QueryBuilderOperationParamValue[]
}
export type QueryBuilderOperationParamValue = string | number | boolean

export enum PromOperationId {
  Abs = 'abs',
  Absent = 'absent',
  AbsentOverTime = 'absent_over_time',
  Acos = 'acos',
  Acosh = 'acosh',
  Asin = 'asin',
  Asinh = 'asinh',
  Atan = 'atan',
  Atanh = 'atanh',
  Avg = 'avg',
  AvgOverTime = 'avg_over_time',
  BottomK = 'bottomk',
  Ceil = 'ceil',
  Changes = 'changes',
  Clamp = 'clamp',
  ClampMax = 'clamp_max',
  ClampMin = 'clamp_min',
  Cos = 'cos',
  Cosh = 'cosh',
  Count = 'count',
  CountOverTime = 'count_over_time',
  CountScalar = 'count_scalar',
  CountValues = 'count_values',
  DayOfMonth = 'day_of_month',
  DayOfWeek = 'day_of_week',
  DayOfYear = 'day_of_year',
  DaysInMonth = 'days_in_month',
  Deg = 'deg',
  Delta = 'delta',
  Deriv = 'deriv',
  DoubleExponentialSmoothing = 'double_exponential_smoothing',
  DropCommonLabels = 'drop_common_labels',
  Exp = 'exp',
  Floor = 'floor',
  Group = 'group',
  HistogramQuantile = 'histogram_quantile',
  HistogramAvg = 'histogram_avg',
  HistogramCount = 'histogram_count',
  HistogramSum = 'histogram_sum',
  HistogramFraction = 'histogram_fraction',
  HistogramStddev = 'histogram_stddev',
  HistogramStdvar = 'histogram_stdvar',
  // Renamed as DoubleExponentialSmoothing with Prometheus v3.x
  // https://github.com/prometheus/prometheus/pull/14930
  HoltWinters = 'holt_winters',
  Hour = 'hour',
  Idelta = 'idelta',
  Increase = 'increase',
  Irate = 'irate',
  LabelJoin = 'label_join',
  LabelReplace = 'label_replace',
  Last = 'last',
  LastOverTime = 'last_over_time',
  Ln = 'ln',
  Log10 = 'log10',
  Log2 = 'log2',
  Max = 'max',
  MaxOverTime = 'max_over_time',
  Min = 'min',
  MinOverTime = 'min_over_time',
  Minute = 'minute',
  Month = 'month',
  Pi = 'pi',
  PredictLinear = 'predict_linear',
  Present = 'present',
  PresentOverTime = 'present_over_time',
  Quantile = 'quantile',
  QuantileOverTime = 'quantile_over_time',
  Rad = 'rad',
  Rate = 'rate',
  Resets = 'resets',
  Round = 'round',
  Scalar = 'scalar',
  Sgn = 'sgn',
  Sin = 'sin',
  Sinh = 'sinh',
  Sort = 'sort',
  SortDesc = 'sort_desc',
  Sqrt = 'sqrt',
  Stddev = 'stddev',
  StddevOverTime = 'stddev_over_time',
  Sum = 'sum',
  SumOverTime = 'sum_over_time',
  Tan = 'tan',
  Tanh = 'tanh',
  Time = 'time',
  Timestamp = 'timestamp',
  TopK = 'topk',
  Vector = 'vector',
  Year = 'year',
  // Binary ops
  Addition = '__addition',
  Subtraction = '__subtraction',
  MultiplyBy = '__multiply_by',
  DivideBy = '__divide_by',
  Modulo = '__modulo',
  Exponent = '__exponent',
  NestedQuery = '__nested_query',
  EqualTo = '__equal_to',
  NotEqualTo = '__not_equal_to',
  GreaterThan = '__greater_than',
  LessThan = '__less_than',
  GreaterOrEqual = '__greater_or_equal',
  LessOrEqual = '__less_or_equal',
}

// export function averageDurationQuery(histogram_metric: string, selector: string, grouping: string): string {
//   return `sum(rate(${histogram_metric}_sum${selector}[$__rate_interval])) by (${grouping}) / sum(rate(${histogram_metric}_count${selector}[$__rate_interval])) by (${grouping})`
// }
