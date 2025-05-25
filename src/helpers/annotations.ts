import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'

export type LogAnnotationOpts = {
  datasource: dashboard.DataSourceRef
  iconColor?: string
  name?: string
  logQuery: string
  tagsField?: string
  textField?: string
}

export function newLogAnnotation(opts: LogAnnotationOpts): dashboard.AnnotationQuery {
  const b = new dashboard.AnnotationQueryBuilder()
  b.datasource(opts.datasource)
  b.enable(true)
  if (opts.iconColor) {
    b.iconColor(opts.iconColor)
  }
  if (opts.name) {
    b.name(opts.name)
  }
  b.expr(opts.logQuery)
  b.target(new dashboard.AnnotationTargetBuilder().limit(100).matchAny(false).tags([]).type('dashboard'))
  const r = b.build()
  //@ts-ignore
  r.tagsField = opts.tagsField
  //@ts-ignore
  r.textField = opts.textField
  return r
}

export type GrafanaAnnotationOpts = {
  iconColor?: string
  name?: string
  tags: string[]
}

export function newGrafanaAnnotation(opts: GrafanaAnnotationOpts): dashboard.AnnotationQuery {
  const b = new dashboard.AnnotationQueryBuilder()
  b.datasource({ type: 'datasource', uid: 'grafana' })
  b.enable(true)
  if (opts.iconColor) {
    b.iconColor(opts.iconColor)
  }
  if (opts.name) {
    b.name(opts.name)
  }
  b.target(new dashboard.AnnotationTargetBuilder().limit(100).matchAny(true).tags(opts.tags).type('tags'))
  return b.build()
}
