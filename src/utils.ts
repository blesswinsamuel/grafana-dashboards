import { FieldConfigSource } from '@grafana/schema'

export function overridesMatchByName(overrides: { [key: string]: { [key: string]: any } }): FieldConfigSource['overrides'] {
  const result: FieldConfigSource['overrides'] = []
  for (const matcher of Object.keys(overrides)) {
    result.push({
      matcher: { id: 'byName', options: matcher },
      properties: Object.entries(overrides[matcher]).map(([key, value]) => {
        return { id: key, value }
      }),
    })
  }
  return result
}

export const tableIndexByName = (columns: string[]): { [key: string]: number } => {
  const indexByName: { [key: string]: number } = {}
  for (let i = 0; i < columns.length; i++) {
    indexByName[columns[i]] = i
  }
  return indexByName
}

export const tableExcludeByName = (columns: string[]): { [key: string]: boolean } => {
  const excludeByName: { [key: string]: boolean } = {}
  for (let i = 0; i < columns.length; i++) {
    excludeByName[columns[i]] = true
  }
  return excludeByName
}

export function averageDurationQuery(histogram_metric: string, selector: string, grouping: string): string {
  return `sum(rate(${histogram_metric}_sum${selector}[$__rate_interval])) by (${grouping}) / sum(rate(${histogram_metric}_count${selector}[$__rate_interval])) by (${grouping})`
}
