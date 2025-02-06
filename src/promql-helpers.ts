import { PrometheusTarget, Target } from './panels'
import { Unit } from './units'

export function formatLegendFormat(legendFormat: string | undefined, groupBy: string[]) {
  if (!legendFormat) {
    legendFormat = groupBy ? groupBy.map((k) => `{{${k}}}`).join(' - ') : undefined
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
  wrap?: string
  append?: string
  prepend?: string
}

export type CommonQueryOpts = Omit<CommonMetricOpts, 'description' | 'labels'> & {
  // selectors?: string | string[]
  // wrap?: string
  // append?: string
  // prepend?: string

  refId?: string
  groupBy?: string[]
  legendFormat?: string
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

class PrometheusQueryRaw {
  constructor(public readonly expr: string) {}

  public target(opts: { refId?: string; legendFormat?: string; groupBy?: string[]; type?: 'range' | 'instant' | 'both' }): PrometheusTarget {
    const { legendFormat, groupBy, type, refId } = opts
    return {
      expr: this.expr,
      refId,
      type,
      format: type === 'instant' ? 'table' : undefined,
      legendFormat: formatLegendFormat(legendFormat, groupBy),
    }
  }

  // public wrap(wrap: string): PrometheusQueryRaw {
  //   if (wrap) {
  //     return new PrometheusQueryRaw(wrap.replace('$__expr', this.expr))
  //   }
  //   return this
  // }

  // public append(append: string): PrometheusQueryRaw {
  //   if (append) {
  //     return new PrometheusQueryRaw(`${this.expr}${append}`)
  //   }
  //   return this
  // }

  // public prepend(prepend: string): PrometheusQueryRaw {
  //   if (prepend) {
  //     return new PrometheusQueryRaw(`${prepend}${this.expr}`)
  //   }
  //   return this
  // }
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
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(func: string, aggrOp: string, opts: CommonQueryOpts & { interval?: string }): PrometheusTarget {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const interval = opts.interval ?? (opts.type === 'instant' ? '$__range' : aggrOp === 'rate' ? '$__rate_interval' : '$__interval')
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    return new PrometheusQueryRaw(formatMetric(`${func}(${aggrOp}(${metric}{${selectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts })).target(opts)
  }
  public rate(opts: CommonQueryOpts): PrometheusTarget {
    return this.calc('sum', 'rate', opts)
  }
  public increase(opts: CommonQueryOpts): PrometheusTarget {
    return this.calc('sum', 'increase', opts)
  }
  public percentage(opts: CommonQueryOpts & { numeratorSelectors?: string | string[]; denominatorSelectors?: string | string[]; func?: 'rate' | 'increase' }): PrometheusTarget {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const numeratorSelectors = mergeSelectors(selectors, opts.numeratorSelectors || '')
    const denominatorSelectors = mergeSelectors(selectors, opts.denominatorSelectors || '')
    const interval = func === 'rate' ? '$__rate_interval' : '$__interval'
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    return new PrometheusQueryRaw(formatMetric(`sum(${func}(${metric}{${numeratorSelectors}}[${interval}]))${groupByStr} / sum(${func}(${metric}{${denominatorSelectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts })).target(opts)
  }
}

export class GaugeMetric extends PrometheusMetricBase {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public calc(func: string, opts: CommonQueryOpts): PrometheusTarget {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    let expr = `${metric}{${selectors}}`
    if (func) {
      const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
      expr = `${func}(${expr})${groupByStr}`
    }
    return new PrometheusQueryRaw(formatMetric(expr, { ...this.opts, ...opts })).target(opts)
  }
  public raw(opts: CommonQueryOpts): PrometheusTarget {
    return this.calc('', { ...this.opts, ...opts })
  }
}

class HistogramSummaryCommon extends PrometheusMetricBase {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }

  public count() {
    return new CounterMetric(this.metric + '_count', this.opts)
  }
  public sum() {
    return new CounterMetric(this.metric + '_sum', this.opts)
  }
  public avg(opts: CommonQueryOpts & { func?: 'rate' | 'increase' }): PrometheusTarget {
    const metric = this.metric
    const { func = 'rate', groupBy } = opts
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const groupByStr = groupBy ? ` by (${groupBy.join(', ')})` : ''
    const interval = func === 'rate' ? '$__rate_interval' : '$__interval'
    return new PrometheusQueryRaw(formatMetric(`sum(${func}(${metric}_sum{${selectors}}[${interval}]))${groupByStr} / sum(${func}(${metric}_count{${selectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts })).target(opts)
  }
}

export class HistogramMetric extends HistogramSummaryCommon {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
  }
  public histogramQuery(func: 'histogram_quantile' | 'histogram_share', value: string, opts: CommonQueryOpts): PrometheusTarget {
    const metric = this.metric + '_bucket'
    const selectors = mergeSelectors(this.opts.selectors, opts.selectors)
    const groupByStr = opts.groupBy ? ` by (le, ${opts.groupBy.join(', ')})` : ' by (le)'
    return new PrometheusQueryRaw(formatMetric(`${func}(${value}, sum(rate(${metric}{${selectors}}[$__rate_interval]))${groupByStr})`, { ...this.opts, ...opts })).target(opts)
  }
  public histogramQuantile(value: string, opts: CommonQueryOpts): PrometheusTarget {
    return this.histogramQuery('histogram_quantile', value, opts)
  }
  public histogramShare(value: string, opts: CommonQueryOpts): PrometheusTarget {
    return this.histogramQuery('histogram_share', value, opts)
  }
}

export class SummaryMetric extends HistogramSummaryCommon {
  constructor(
    public readonly metric: string,
    protected opts: CommonMetricOpts = {}
  ) {
    super(metric, opts)
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
