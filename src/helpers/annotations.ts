import * as cog from '@grafana/grafana-foundation-sdk/cog'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import { dangerouslyAddCustomValues } from './panels/commons'

export type LogAnnotationOpts = {
  datasource: dashboard.DataSourceRef
  iconColor?: string
  name?: string
  logQuery: string
  tagsField?: string
  textField?: string
}

export function NewElasticsearchAnnotation(opts: LogAnnotationOpts): dashboard.AnnotationQueryBuilder {
  const b = new dashboard.AnnotationQueryBuilder()
  b.datasource(opts.datasource)
  b.enable(true)
  if (opts.iconColor) {
    b.iconColor(opts.iconColor)
  }
  if (opts.name) {
    b.name(opts.name)
  }
  b.target(dangerouslyAddCustomValues(new dashboard.AnnotationTargetBuilder().limit(100).matchAny(false).tags([]).type('dashboard'), {
    query: opts.logQuery,
  } as any))
  dangerouslyAddCustomValues(b, {
    tagsField: opts.tagsField,
    textField: opts.textField,
  } as any)
  return b
}

export type GrafanaAnnotationOpts = {
  iconColor?: string
  name?: string
  tags: string[]
}

export function NewGrafanaAnnotation(opts: GrafanaAnnotationOpts): dashboard.AnnotationQueryBuilder {
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
  return b
}
