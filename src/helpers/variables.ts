import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import { dangerouslyAddCustomValues } from './sdk-compat'

export type DataSourceVariableOpts = {
  name: string
  label: string
  regex?: string
}

export function NewDatasourceVariable(opts: DataSourceVariableOpts & { type: 'mysql' | 'prometheus' | 'loki' }): dashboard.DatasourceVariableBuilder {
  const b = new dashboard.DatasourceVariableBuilder(opts.name).label(opts.label).type(opts.type).hide(dashboard.VariableHide.DontHide)
  if (opts.regex) b.regex(opts.regex)
  return b
}

export function NewPrometheusDatasourceVariable(opts: DataSourceVariableOpts): dashboard.DatasourceVariableBuilder {
  return NewDatasourceVariable({ ...opts, type: 'prometheus' })
}

export function NewLokiDatasourceVariable(opts: DataSourceVariableOpts): dashboard.DatasourceVariableBuilder {
  return NewDatasourceVariable({ ...opts, type: 'loki' })
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
    // SDK does not yet expose a `current` setter - write it directly
    dangerouslyAddCustomValues(b, { current: { selected: false, text: opts.default, value: opts.default } } as any)
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
