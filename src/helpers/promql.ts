// ============================================================
// promql.ts - Metric definitions, fluent query chain, smart inference
// ============================================================
import type * as cog from '@grafana/grafana-foundation-sdk/cog'
import type { DataSourceRef } from '@grafana/grafana-foundation-sdk/dashboard'
import * as units from '@grafana/grafana-foundation-sdk/units'
import * as promql from '@grafana/promql-builder'

// ============================================================
// Unit type (re-exported for use in panels)
// ============================================================
type UnitKeys = keyof typeof units
export type Unit = (typeof units)[UnitKeys]

// ============================================================
// Selector helpers
// ============================================================

/** Create a properly-quoted label selector string.
 * @example sel('state', '=', 'active') -> state="active" */
export function sel(label: string, op: '=' | '!=' | '=~' | '!~', value: string): string {
  return `${label}${op}"${value}"`
}

/** Template variable selector shorthand.
 * @example tv('namespace') -> namespace=~"$namespace" */
export function tv(label: string, op: '=~' | '=' = '=~'): string {
  return sel(label, op, `$${label}`)
}

// ============================================================
// Internal PromQL builder helpers (not exported)
// ============================================================

type LabelMatcher = { name: string; operator: '=' | '!=' | '=~' | '!~'; value: string }

function parseSelectors(input: string): LabelMatcher[] {
  const regex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(=~|!~|=|!=)\s*("(?:\\.|[^"\\])*")/g
  const matchers: LabelMatcher[] = []
  let match = regex.exec(input)
  while (match !== null) {
    const [, name, op, rawValue] = match
    if (!name || !op || rawValue === undefined) continue
    matchers.push({ name, operator: op as LabelMatcher['operator'], value: rawValue.slice(1, -1) })
    match = regex.exec(input)
  }
  return matchers
}

function joinSelectors(selectors: string | string[] | undefined): string {
  if (!selectors) return ''
  const arr = Array.isArray(selectors) ? selectors : [selectors]
  return arr.filter(Boolean).join(', ')
}

function applySelectorsToExpr(expr: promql.VectorExprBuilder, selectors: string | string[] | undefined): promql.VectorExprBuilder {
  const joined = joinSelectors(selectors)
  if (!joined) return expr
  for (const { name, operator, value } of parseSelectors(joined)) {
    if (operator === '=') expr.label(name, value)
    else if (operator === '!=') expr.labelNeq(name, value)
    else if (operator === '=~') expr.labelMatchRegexp(name, value)
    else if (operator === '!~') expr.labelNotMatchRegexp(name, value)
  }
  return expr
}

function applyAggr(op: promql.AggregationOp, vector: promql.Builder<promql.Expr>): promql.AggregationExprBuilder {
  const b = new promql.AggregationExprBuilder()
  b.op(op)
  b.expr(vector)
  return b
}

function applyFunc(functionVal: string, ...args: promql.Builder<promql.Expr>[]): promql.FuncCallExprBuilder {
  const b = new promql.FuncCallExprBuilder()
  b.functionVal(functionVal)
  b.args(args)
  return b
}

function autoLegend(by: string[] | undefined): string | undefined {
  if (!by || by.length === 0) return 'value'
  return by.map((k) => `{{${k}}}`).join(' - ')
}

// ============================================================
// Query hints (inferred defaults flowing to panels)
// ============================================================

export type QueryHints = {
  unit?: Unit
  chartType?: 'line' | 'bar'
}

function inferCounterRateUnit(name: string): Unit | undefined {
  if (name.includes('_bytes')) return units.BytesPerSecondSI
  if (name.includes('_reads')) return units.ReadsPerSecond
  if (name.includes('_writes')) return units.WritesPerSecond
  if (name.includes('_packets')) return units.PacketsPerSecond
  return undefined
}

function inferGaugeUnit(name: string): Unit | undefined {
  if (name.includes('_bytes')) return units.BytesSI
  if (name.endsWith('_milliseconds') || name.endsWith('_ms') || name.includes('_milliseconds_')) return units.Milliseconds
  if (name.endsWith('_percent') || name.endsWith('_percentage')) return units.Percent
  if (name.endsWith('_ratio')) return units.PercentUnit
  return undefined
}

// ============================================================
// Binary operation helpers (public)
// ============================================================

export type WrapFn<TT extends promql.Expr = promql.Expr, BT extends promql.Builder<TT> = promql.Builder<TT>> = (expr: cog.Builder<promql.Expr>) => BT

export function applyBinaryOp(left: cog.Builder<promql.Expr>, op: promql.BinaryOp | 'default' | '*', right: cog.Builder<promql.Expr>): promql.BinaryExprBuilder {
  const b = new promql.BinaryExprBuilder()
  b.op(op as promql.BinaryOp)
  b.left(left)
  b.right(right)
  return b
}

export function wrapMultiply(n: number): WrapFn<promql.BinaryExpr> {
  return (expr) => applyBinaryOp(expr, '*', promql.n(n))
}

export function wrapConditional(op: '>' | '<' | '==' | '!=' | '>=' | '<=' | 'default' | '*', value: number): WrapFn<promql.BinaryExpr> {
  return (expr) => applyBinaryOp(expr, op, promql.n(value))
}

// ============================================================
// Target options (for .target() call)
// ============================================================

export type TargetOpts = {
  legend?: string
  refId?: string
  format?: 'table' | 'time_series' | 'heatmap'
}

// ============================================================
// Target types (canonical definitions)
// ============================================================

export type PrometheusTarget = {
  kind: 'prometheus'
  expr: string | promql.Builder<promql.Expr>
  type: 'range' | 'instant' | 'both'
  format: 'table' | 'time_series' | 'heatmap'
  legendFormat?: string
  refId?: string
  datasource?: DataSourceRef
  hints?: QueryHints
}

export type SqlTarget = {
  kind: 'sql'
  rawSql: string
  refId?: string
  format?: 'table' | 'time_series' | 'heatmap'
  datasource?: DataSourceRef
}

export type Target = PrometheusTarget | SqlTarget

/** Helper to create a SQL target directly. */
export function sqlTarget(rawSql: string, opts: Omit<SqlTarget, 'kind' | 'rawSql'> = {}): SqlTarget {
  return { kind: 'sql', rawSql, ...opts }
}

/** Helper to create a raw Prometheus target (for complex expressions not from the query chain). */
export function rawTarget(expr: string | promql.Builder<promql.Expr>, opts: TargetOpts & { type?: PrometheusTarget['type'] } = {}): PrometheusTarget {
  const type = opts.type ?? 'range'
  return {
    kind: 'prometheus',
    expr,
    type,
    format: opts.format ?? (type === 'instant' ? 'table' : 'time_series'),
    legendFormat: opts.legend,
    refId: opts.refId,
  }
}

// ============================================================
// PrometheusQuery - result of a metric operation
// ============================================================

type QueryMeta = {
  hints: QueryHints
  type: 'range' | 'instant' | 'both'
  by?: string[]
}

export class PrometheusQuery {
  constructor(
    private readonly exprBuilder: promql.Builder<promql.Expr>,
    private readonly meta: QueryMeta,
  ) {}

  get hints(): QueryHints {
    return this.meta.hints
  }

  target(opts?: TargetOpts): PrometheusTarget {
    return {
      kind: 'prometheus' as const,
      expr: this.exprBuilder,
      type: this.meta.type,
      format: opts?.format ?? (this.meta.type === 'instant' ? 'table' : 'time_series'),
      legendFormat: opts?.legend ?? autoLegend(this.meta.by),
      refId: opts?.refId,
      hints: this.meta.hints,
    }
  }

  wrap<TT extends promql.Expr, BT extends promql.Builder<TT>>(fn: WrapFn<TT, BT> | undefined): PrometheusQuery {
    if (!fn) return this
    return new PrometheusQuery(fn(this.exprBuilder), this.meta)
  }

  gt(n: number): PrometheusQuery {
    return this.wrap(wrapConditional('>', n))
  }
  multiply(n: number): PrometheusQuery {
    return this.wrap(wrapMultiply(n))
  }

  agg(op: promql.AggregationOp, by: string[] = []): PrometheusQuery {
    return new PrometheusQuery(applyAggr(op, this.exprBuilder).by(by), { ...this.meta, by })
  }

  toString(): string {
    return this.exprBuilder.toString()
  }
  builder(): promql.Builder<promql.Expr> {
    return this.exprBuilder
  }
}

// ============================================================
// Metric options and query options
// ============================================================

export type MetricOpts = {
  description?: string
  labels?: string[]
  unit?: Unit
}

export type GaugeQueryOpts = {
  selectors?: string | string[]
  by?: string[]
  instant?: boolean
}

export type CounterQueryOpts = {
  selectors?: string | string[]
  by?: string[]
  agg?: promql.AggregationOp
  interval?: string
}

// ============================================================
// Metric base class
// ============================================================

abstract class MetricBase {
  constructor(
    public readonly metric: string,
    protected readonly opts: MetricOpts = {},
  ) {}

  labels(): string[] {
    return this.opts.labels ?? []
  }
  description(): string | undefined {
    return this.opts.description
  }

  baseExpr(selectors?: string | string[]): promql.VectorExprBuilder {
    return applySelectorsToExpr(promql.vector(this.metric), selectors)
  }
}

// ============================================================
// GaugeMetric
// ============================================================

export class GaugeMetric extends MetricBase {
  constructor(metric: string, opts: MetricOpts = {}) {
    super(metric, opts)
  }

  agg(op: promql.AggregationOp, opts: GaugeQueryOpts = {}): PrometheusQuery {
    const { selectors, by = [], instant = false } = opts
    const qb = applyAggr(op, this.baseExpr(selectors)).by(by)
    const unit = this.opts.unit ?? inferGaugeUnit(this.metric)
    return new PrometheusQuery(qb, { hints: { unit, chartType: 'line' }, type: instant ? 'instant' : 'range', by })
  }

  sum(opts: GaugeQueryOpts = {}): PrometheusQuery {
    return this.agg('sum', opts)
  }
  avg(opts: GaugeQueryOpts = {}): PrometheusQuery {
    return this.agg('avg', opts)
  }
  max(opts: GaugeQueryOpts = {}): PrometheusQuery {
    return this.agg('max', opts)
  }
  min(opts: GaugeQueryOpts = {}): PrometheusQuery {
    return this.agg('min', opts)
  }
  count(opts: GaugeQueryOpts = {}): PrometheusQuery {
    return this.agg('count', opts)
  }

  raw(opts: Omit<GaugeQueryOpts, 'by'> = {}): PrometheusQuery {
    const { selectors, instant = false } = opts
    const unit = this.opts.unit ?? inferGaugeUnit(this.metric)
    return new PrometheusQuery(this.baseExpr(selectors), { hints: { unit, chartType: 'line' }, type: instant ? 'instant' : 'range' })
  }
}

// ============================================================
// CounterMetric
// ============================================================

export class CounterMetric extends MetricBase {
  constructor(metric: string, opts: MetricOpts = {}) {
    super(metric, opts)
  }

  private rangeQuery(fn: 'rate' | 'irate' | 'increase' | 'delta' | 'idelta' | 'resets' | 'changes', opts: CounterQueryOpts = {}): PrometheusQuery {
    const { selectors, by = [], agg = 'sum', interval } = opts
    const isRate = fn === 'rate' || fn === 'irate'
    const rangeStr = interval ?? (isRate ? '$__rate_interval' : '$__interval')
    const rangedExpr = applyFunc(fn, applySelectorsToExpr(this.baseExpr(), selectors).range(rangeStr))
    const qb = applyAggr(agg, rangedExpr).by(by)
    const unit = this.opts.unit ?? (isRate ? inferCounterRateUnit(this.metric) : inferGaugeUnit(this.metric))
    const chartType = fn === 'increase' || fn === 'delta' || fn === 'idelta' ? 'bar' : 'line'
    return new PrometheusQuery(qb, { hints: { unit, chartType }, type: 'range', by })
  }

  rate(opts: CounterQueryOpts = {}): PrometheusQuery {
    return this.rangeQuery('rate', opts)
  }
  irate(opts: CounterQueryOpts = {}): PrometheusQuery {
    return this.rangeQuery('irate', opts)
  }
  increase(opts: CounterQueryOpts = {}): PrometheusQuery {
    return this.rangeQuery('increase', opts)
  }
  delta(opts: CounterQueryOpts = {}): PrometheusQuery {
    return this.rangeQuery('delta', opts)
  }

  percentage(opts: CounterQueryOpts & { numeratorSelectors?: string | string[]; denominatorSelectors?: string | string[]; fn?: 'rate' | 'increase' } = {}): PrometheusQuery {
    const { selectors, by = [], fn = 'rate', interval, numeratorSelectors, denominatorSelectors } = opts
    const isRate = fn === 'rate'
    const rangeStr = interval ?? (isRate ? '$__rate_interval' : '$__interval')
    const numSels = [selectors, numeratorSelectors].flat().filter(Boolean) as string[]
    const denSels = [selectors, denominatorSelectors].flat().filter(Boolean) as string[]
    const numExpr = applyFunc(fn, applySelectorsToExpr(this.baseExpr(), numSels).range(rangeStr))
    const denExpr = applyFunc(fn, applySelectorsToExpr(this.baseExpr(), denSels).range(rangeStr))
    const qb = promql.div(applyAggr('sum', numExpr).by(by), applyAggr('sum', denExpr).by(by))
    return new PrometheusQuery(qb, { hints: { chartType: 'line' }, type: 'range', by })
  }
}

// ============================================================
// Shared base for Histogram + Summary
// ============================================================

abstract class HistogramSummaryBase extends MetricBase {
  count(): CounterMetric {
    return new CounterMetric(`${this.metric}_count`, this.opts)
  }
  sum(): CounterMetric {
    return new CounterMetric(`${this.metric}_sum`, this.opts)
  }

  avg(opts: CounterQueryOpts = {}): PrometheusQuery {
    const { selectors, by = [], agg = 'sum', interval } = opts
    const rangeStr = interval ?? '$__rate_interval'
    const sumExpr = applyFunc('rate', applySelectorsToExpr(this.sum().baseExpr(), selectors).range(rangeStr))
    const countExpr = applyFunc('rate', applySelectorsToExpr(this.count().baseExpr(), selectors).range(rangeStr))
    const qb = promql.div(applyAggr(agg, sumExpr).by(by), applyAggr(agg, countExpr).by(by))
    return new PrometheusQuery(qb, { hints: { chartType: 'line' }, type: 'range', by })
  }
}

// ============================================================
// HistogramMetric
// ============================================================

export class HistogramMetric extends HistogramSummaryBase {
  constructor(metric: string, opts: MetricOpts = {}) {
    super(metric, opts)
  }

  bucket(): CounterMetric {
    return new CounterMetric(`${this.metric}_bucket`, this.opts)
  }

  quantile(q: number, opts: Omit<CounterQueryOpts, 'agg'> = {}): PrometheusQuery {
    const { selectors, by = [], interval } = opts
    const rangeStr = interval ?? '$__rate_interval'
    const iqb = promql.sum(promql.rate(applySelectorsToExpr(this.bucket().baseExpr(), selectors).range(rangeStr))).by(['le', ...by])
    const qb = applyFunc('histogram_quantile', promql.n(q), iqb)
    const unit = this.opts.unit ?? inferGaugeUnit(this.metric)
    return new PrometheusQuery(qb, { hints: { unit, chartType: 'line' }, type: 'range', by })
  }
}

// ============================================================
// SummaryMetric
// ============================================================

export class SummaryMetric extends HistogramSummaryBase {
  constructor(metric: string, opts: MetricOpts = {}) {
    super(metric, opts)
  }

  /** Returns a GaugeMetric scoped to a specific quantile value. */
  quantile(value: string): GaugeMetric {
    const quantileSelector = `quantile="${value}"`
    // We need a subclass-style override; use a simple wrapper object instead
    const outerMetric = this.metric
    const outerOpts = this.opts
    return new (class extends GaugeMetric {
      override baseExpr(selectors?: string | string[]): promql.VectorExprBuilder {
        const all = [quantileSelector, ...(Array.isArray(selectors) ? selectors : selectors ? [selectors] : [])]
        return applySelectorsToExpr(promql.vector(outerMetric), all)
      }
    })(this.metric, outerOpts)
  }
}
