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
