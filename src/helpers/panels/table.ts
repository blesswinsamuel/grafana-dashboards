import * as common from '@grafana/grafana-foundation-sdk/common'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import * as table from '@grafana/grafana-foundation-sdk/table'
import { CommonPanelOpts, Unit, withCommonOpts } from './commons'
import { PrometheusTarget } from './target'

export type TablePanelOpts = CommonPanelOpts<PrometheusTarget> &
  Partial<Pick<table.Options, 'footer' | 'cellHeight'>> & {
    queries?: Record<
      string,
      {
        target?: PrometheusTarget
        name?: string
        width?: number
        unit?: Unit
        exclude?: boolean
        overrides?: Record<string, unknown>
      }
    >
    excludeColumns?: string[]
    sortBy?: { col: string; desc?: boolean }[]
  }

export function NewTablePanel(opts: TablePanelOpts): table.PanelBuilder {
  const tableOverrides: Record<string, Record<string, any>> = {}
  const tableIndexOrder: string[] = []
  const colRenames: Record<string, string> = {}
  const targets: PrometheusTarget[] = []

  if (opts.queries) {
    opts.transformations = opts.transformations ?? []

    const { queries, excludeColumns = [] } = opts
    // console.log(queries)
    for (const [refId, { target, unit, width, overrides, name, exclude }] of Object.entries(queries)) {
      const curOverrides = { ...overrides }
      if (unit) {
        curOverrides['unit'] = unit
      }
      if (width) {
        curOverrides['custom.width'] = width
      }
      if (target) {
        if (name) {
          colRenames[`Value #${refId}`] = name
        } else {
          colRenames[`Value #${refId}`] = refId
        }
        tableIndexOrder.push(`Value #${refId}`)
        tableOverrides[`Value #${refId}`] = curOverrides
        // targets.push({ ...target, refId: refId, type: (target as any).type || 'instant', format: target.format || 'table' })
        targets.push({ ...target, refId: refId })
      } else {
        if (name) {
          colRenames[refId] = name
        }
        tableIndexOrder.push(refId)
        tableOverrides[refId] = curOverrides
      }
      if (exclude) {
        excludeColumns.push(refId)
      }
    }
    opts.transformations.push({ id: 'merge', options: {} })
    opts.transformations.push({
      id: 'organize',
      options: {
        indexByName: tableIndexByName(tableIndexOrder),
        excludeByName: tableExcludeByName(excludeColumns),
        renameByName: colRenames,
      },
    })
    opts.overridesByName = tableOverrides
  }

  const b = new table.PanelBuilder()
  withCommonOpts(b, opts, ...targets)

  b.cellHeight(common.TableCellHeight.Md)
  b.showHeader(true)

  const sortByBuilders: common.TableSortByFieldStateBuilder[] = []
  for (const sort of opts.sortBy || []) {
    const sb = new common.TableSortByFieldStateBuilder().displayName(sort.col).desc(sort.desc ?? false)
    sortByBuilders.push(sb)
  }
  b.sortBy(sortByBuilders)

  //   const panel: Panel<Record<string, unknown>, GraphFieldConfig> = {
  //     ...defaultPanel,
  //     datasource: opts.datasource,
  //     options: {
  //       cellHeight: TableCellHeight.Md,
  //       frameIndex: -1,
  //       showHeader: true,
  //       ...opts.options,
  //     } satisfies TablePanelOptions,
  //     timeFrom: opts.timeFrom ?? defaultPanel.timeFrom,
  //   }

  return b
}

export const tableIndexByName = (columns: string[]): { [key: string]: number } => {
  const indexByName: { [key: string]: number } = {}
  for (let i = 0; i < columns.length; i++) {
    indexByName[columns[i]!] = i
  }
  return indexByName
}

export const tableExcludeByName = (columns: string[]): { [key: string]: boolean } => {
  const excludeByName: { [key: string]: boolean } = {}
  for (let i = 0; i < columns.length; i++) {
    excludeByName[columns[i]!] = true
  }
  return excludeByName
}
