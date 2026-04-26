import * as common from '@grafana/grafana-foundation-sdk/common'
import * as table from '@grafana/grafana-foundation-sdk/table'
import type { Target, Unit } from '../promql'
import { type CommonPanelOpts, withCommonOpts } from './commons'

export type TableColumn = {
  /** refId used for the query and the Value column name. */
  id: string
  /** Display name for the column (replaces `Value #<id>`). */
  name?: string
  /** Query target for this column (omit for non-value columns like label fields). */
  target?: Target
  unit?: Unit
  width?: number
  overrides?: Record<string, unknown>
  exclude?: boolean
}

export type TablePanelOpts = CommonPanelOpts &
  Partial<Pick<table.Options, 'footer' | 'cellHeight'>> & {
    columns?: TableColumn[] | Record<string, Omit<TableColumn, 'id'>>
    excludeColumns?: string[]
    sortBy?: { col: string; desc?: boolean }[]
  }

export function NewTablePanel(opts: TablePanelOpts): table.PanelBuilder {
  const targets: Target[] = [...(opts.targets ?? [])]
  const tableOverrides: Record<string, Record<string, any>> = {}
  const tableIndexOrder: string[] = []
  const colRenames: Record<string, string> = {}
  const excludeColumns: string[] = [...(opts.excludeColumns ?? [])]

  // Normalize columns: accept both array and legacy object formats
  const columns: TableColumn[] = Array.isArray(opts.columns)
    ? opts.columns
    : opts.columns
      ? Object.entries(opts.columns as Record<string, Omit<TableColumn, 'id'>>).map(([id, col]) => ({ id, ...col }))
      : []

  if (columns.length > 0) {
    opts.transformations = opts.transformations ?? []

    for (const { id, target, unit, width, overrides, name, exclude } of columns) {
      const curOverrides: Record<string, any> = { ...overrides }
      if (unit) curOverrides['unit'] = unit
      if (width) curOverrides['custom.width'] = width

      if (target) {
        const colKey = `Value #${id}`
        colRenames[colKey] = name ?? id
        tableIndexOrder.push(colKey)
        if (Object.keys(curOverrides).length > 0) tableOverrides[colKey] = curOverrides
        targets.push({ ...target, refId: id })
      } else {
        if (name) colRenames[id] = name
        tableIndexOrder.push(id)
        if (Object.keys(curOverrides).length > 0) tableOverrides[id] = curOverrides
      }
      if (exclude) excludeColumns.push(id)
    }

    opts.transformations = [
      { id: 'merge', options: {} },
      {
        id: 'organize',
        options: {
          indexByName: tableIndexByName(tableIndexOrder),
          excludeByName: tableExcludeByName(excludeColumns),
          renameByName: colRenames,
        },
      },
      ...opts.transformations,
    ]
    opts.overridesByName = { ...tableOverrides, ...opts.overridesByName }
  }

  const b = new table.PanelBuilder()
  withCommonOpts(b, { ...opts, targets })

  b.cellHeight(common.TableCellHeight.Md)
  b.showHeader(true)

  const sortByBuilders: common.TableSortByFieldStateBuilder[] = []
  for (const sort of opts.sortBy || []) {
    sortByBuilders.push(new common.TableSortByFieldStateBuilder().displayName(sort.col).desc(sort.desc ?? false))
  }
  b.sortBy(sortByBuilders)

  if (opts.footer) {
    const fb = new common.TableFooterOptionsBuilder()
    if (opts.footer.countRows) fb.countRows(true)
    if (opts.footer.reducer) fb.reducer(opts.footer.reducer)
    if (opts.footer.show) fb.show(true)
    if (opts.footer.enablePagination) fb.enablePagination(opts.footer.enablePagination)
    b.footer(fb)
  }

  return b
}

export const tableIndexByName = (columns: string[]): Record<string, number> => Object.fromEntries(columns.map((col, i) => [col, i]))

export const tableExcludeByName = (columns: string[]): Record<string, boolean> => Object.fromEntries(columns.map((col) => [col, true]))
