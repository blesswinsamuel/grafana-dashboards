import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'

export type DataSourceVariableOpts = {
  name: string
  label: string
  regex?: string
}

export function NewDatasourceVariable(opts: DataSourceVariableOpts & { type: 'mysql' | 'prometheus' | 'loki' }): dashboard.DatasourceVariableBuilder {
  const b = new dashboard.DatasourceVariableBuilder(opts.name).label(opts.label).type(opts.type).hide(dashboard.VariableHide.DontHide)
  if (opts.regex) {
    b.regex(opts.regex)
  }
  return b
}

export function NewPrometheusDatasourceVariable(opts: DataSourceVariableOpts): dashboard.DatasourceVariableBuilder {
  const b = new dashboard.DatasourceVariableBuilder(opts.name).label(opts.label).type('prometheus').hide(dashboard.VariableHide.DontHide)
  if (opts.regex) {
    b.regex(opts.regex)
  }
  return b
}

export function NewLokiDatasourceVariable(opts: DataSourceVariableOpts): dashboard.DatasourceVariableBuilder {
  const b = new dashboard.DatasourceVariableBuilder(opts.name).label(opts.label).type('loki').hide(dashboard.VariableHide.DontHide)
  if (opts.regex) {
    b.regex(opts.regex)
  }
  return b
}

export type TextboxVariableOpts = {
  label: string
  name: string
  hide?: boolean
  default?: string
}

export function NewTextboxVariable(opts: TextboxVariableOpts): dashboard.TextBoxVariableBuilder {
  const b = new dashboard.TextBoxVariableBuilder(opts.name).label(opts.label)
  b.hide(opts.hide ? dashboard.VariableHide.HideVariable : dashboard.VariableHide.DontHide)
  if (opts.default) {
    b.description(opts.default) // This is a workaround for the fact that the default value is not set in the builder
  }
  return b
}

export type QueryVariableOpts = {
  label: string
  name: string
  datasource: dashboard.DataSourceRef
  query?: string | any
  refresh?: dashboard.VariableRefresh
  multi?: boolean
  includeAll?: boolean
  regex?: string
  hide?: boolean
}

export function NewQueryVariable(opts: QueryVariableOpts): dashboard.QueryVariableBuilder {
  const b = new dashboard.QueryVariableBuilder(opts.name).label(opts.label)
  b.query(opts.query)
  b.hide(opts.hide ? dashboard.VariableHide.HideVariable : dashboard.VariableHide.DontHide)
  b.datasource(opts.datasource)
  b.multi(opts.multi || false)
  b.includeAll(opts.includeAll || false)
  b.refresh(opts.refresh || dashboard.VariableRefresh.OnTimeRangeChanged)
  b.regex(opts.regex || '')
  b.sort(dashboard.VariableSort.AlphabeticalAsc)
  return b
}
