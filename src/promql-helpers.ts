import { Target } from './panels'

export function formatLegendFormat(legendFormat: string | undefined, groupBy: string[]) {
  if (!legendFormat) {
    legendFormat = groupBy ? groupBy.map((k) => `{{${k}}}`).join(' - ') : undefined
  }
  return legendFormat
}

export const mergeSelectors = (...selectors: (string | string[])[]) => {
  return selectors
    .flat()
    .filter((s) => s)
    .join(', ')
}

export type CommonMetricOpts = {
  selectors?: string | string[]
  wrap?: string
  append?: string
  prepend?: string
}

export type CommonQueryOpts = CommonMetricOpts & {
  refId?: string
  groupBy?: string[]
  legendFormat?: string
  type?: 'range' | 'instant' | 'both'
}

function formatMetric(expr: string, opts: Omit<CommonMetricOpts, 'selectors'>) {
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

export class CounterMetric {
  constructor(
    public metric: string,
    private opts: CommonMetricOpts = {}
  ) {}
  public calc(func1: string, func2: string, opts: CommonQueryOpts & { interval?: string }): Target {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    const interval = opts.interval ?? (opts.type === 'instant' ? '$__range' : func2 === 'rate' ? '$__rate_interval' : '$__interval')
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    return {
      expr: formatMetric(`${func1}(${func2}(${metric}{${selectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
  public rate(opts: CommonQueryOpts): Target {
    return this.calc('sum', 'rate', opts)
  }
  public increase(opts: CommonQueryOpts): Target {
    return this.calc('sum', 'increase', opts)
  }
  public percentage(opts: CommonQueryOpts & { numeratorSelectors?: string | string[]; denominatorSelectors?: string | string[]; func?: 'rate' | 'increase' }): Target {
    const metric = this.metric
    const { func = 'rate' } = opts
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    const numeratorSelectors = mergeSelectors(selectors, opts.numeratorSelectors || '')
    const denominatorSelectors = mergeSelectors(selectors, opts.denominatorSelectors || '')
    const interval = func === 'rate' ? '$__rate_interval' : '$__interval'
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    return {
      expr: formatMetric(`sum(${func}(${metric}{${numeratorSelectors}}[${interval}]))${groupByStr} / sum(${func}(${metric}{${denominatorSelectors}}[${interval}]))${groupByStr}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
}

export class GaugeMetric {
  constructor(
    public metric: string,
    public opts: CommonMetricOpts = {}
  ) {}
  public calc(func: string, opts: CommonQueryOpts): Target {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    return {
      expr: formatMetric(`${func}(${metric}{${selectors}})${groupByStr}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
  public raw(opts: CommonQueryOpts): Target {
    const metric = this.metric
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    return {
      expr: formatMetric(`${metric}{${selectors}}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
}

export class HistogramMetric {
  constructor(
    public metric: string,
    public opts: CommonMetricOpts = {}
  ) {}
  public count() {
    return new CounterMetric(this.metric + '_count', this.opts)
  }
  public sum() {
    return new CounterMetric(this.metric + '_sum', this.opts)
  }
  public histogramQuery(func: 'histogram_quantile' | 'histogram_share', value: string, opts: CommonQueryOpts): Target {
    const metric = this.metric + '_bucket'
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    const groupByStr = opts.groupBy ? ` by (le, ${opts.groupBy.join(', ')})` : ' by (le)'
    return {
      expr: formatMetric(`${func}(${value}, sum(rate(${metric}{${selectors}}[$__rate_interval]))${groupByStr})`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
  public histogramQuantile(value: string, opts: CommonQueryOpts): Target {
    return this.histogramQuery('histogram_quantile', value, opts)
  }
  public histogramShare(value: string, opts: CommonQueryOpts): Target {
    return this.histogramQuery('histogram_share', value, opts)
  }
  public histAvg(opts: CommonQueryOpts & { func?: 'rate' | 'increase' }): Target {
    const metric = this.metric
    const { func = 'rate' } = opts
    const groupByStr = opts.groupBy ? ` by (${opts.groupBy.join(', ')})` : ''
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    return {
      expr: formatMetric(`sum(${func}(${metric}_sum{${selectors}}[$__rate_interval]))${groupByStr} / sum(${func}(${metric}_count{${selectors}}[$__rate_interval]))${groupByStr}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
}

export class SummaryMetric {
  constructor(
    public metric: string,
    public opts: CommonMetricOpts = {}
  ) {}
  public count() {
    return new CounterMetric(this.metric + '_count', this.opts)
  }
  public sum() {
    return new CounterMetric(this.metric + '_sum', this.opts)
  }
  public avg(opts: CommonQueryOpts & { func?: 'rate' | 'increase' }): Target {
    const metric = this.metric
    const { func = 'rate', groupBy } = opts
    const selectors = mergeSelectors(this.opts.selectors || '', opts.selectors || '')
    const groupByStr = groupBy ? ` by (${groupBy.join(', ')})` : ''
    return {
      expr: formatMetric(`sum(${func}(${metric}_sum{${selectors}}[$__rate_interval]))${groupByStr} / sum(${func}(${metric}_count{${selectors}}[$__rate_interval]))${groupByStr}`, { ...this.opts, ...opts }),
      ...getTargetOpts(opts),
    }
  }
}

function getTargetOpts(opts: CommonQueryOpts): Partial<Target> {
  const { legendFormat, groupBy, type, refId } = opts
  return { refId, type, format: type === 'instant' ? 'table' : undefined, legendFormat: formatLegendFormat(legendFormat, groupBy) }
}
