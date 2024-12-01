import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewGoRuntimeMetrics, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, PanelRowAndGroups, Unit, autoLayout, tableExcludeByName, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

// https://github.com/matusnovak/prometheus-zfs
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const errorThresholds: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'green', value: null },
    { color: 'red', value: 1 },
  ],
}

function queryWithModelName(query: string, extraSelectors: string = '', func: string = ''): string {
  let r = `${query}{instance=~"$instance"${extraSelectors ? ',' + extraSelectors : ''}} * on(device) group_left(model_name) zfs_device{instance=~"$instance"}`
  if (func) {
    r = `${func}(${r})`
  }
  return `sum by (model_name) (${r})`
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({
        title: 'Pools',
        targets: [{ expr: 'count(zfs_pool_allocated_bytes{instance=~"$instance"})' }],
        defaultUnit: Unit.SHORT,
        // thresholds: errorThresholds,
      }),
      NewStatPanel({ title: 'Datasets', targets: [{ expr: 'count(zfs_dataset_logical_used_bytes{instance=~"$instance"})' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 5 }, [
      NewTablePanel({
        title: 'ZFS Pools',
        targets: [
          { refId: 'ALLOCATED', expr: 'sum(zfs_pool_allocated_bytes{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'DUPLICATION_RATIO', expr: 'sum(zfs_pool_deduplication_ratio{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'FRAGMENTATION_RATIO', expr: 'sum(zfs_pool_fragmentation_ratio{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'FREE', expr: 'sum(zfs_pool_free_bytes{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'FREEING', expr: 'sum(zfs_pool_freeing_bytes{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'HEALTH', expr: 'sum(zfs_pool_health{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'LEAKED', expr: 'sum(zfs_pool_leaked_bytes{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'READONLY', expr: 'sum(zfs_pool_readonly{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
          { refId: 'SIZE', expr: 'sum(zfs_pool_size_bytes{instance=~"$instance"}) by (pool)', format: 'table', type: 'instant' },
        ],
        overrides: [
          { matcher: { id: 'byName', options: 'Allocated' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Deduplication Ratio' }, properties: [{ id: 'unit', value: Unit.SHORT }] },
          { matcher: { id: 'byName', options: 'Fragmentation Ratio' }, properties: [{ id: 'unit', value: Unit.SHORT }] },
          { matcher: { id: 'byName', options: 'Free' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Freeing' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Health' }, properties: [{ id: 'unit', value: Unit.SHORT }] },
          { matcher: { id: 'byName', options: 'Leaked' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Readonly' }, properties: [{ id: 'unit', value: Unit.SHORT }] },
          { matcher: { id: 'byName', options: 'Size' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
        ],
        transformations: [
          { id: 'merge', options: {} },
          { id: 'filterFieldsByName', options: { include: { pattern: '(pool|Value\\s.*)' } } },
          {
            id: 'organize',
            options: {
              excludeByName: tableExcludeByName(['Time']),
              indexByName: {},
              renameByName: {
                pool: 'Pool',
                'Value #ALLOCATED': 'Allocated',
                'Value #DUPLICATION_RATIO': 'Deduplication Ratio',
                'Value #FRAGMENTATION_RATIO': 'Fragmentation Ratio',
                'Value #FREE': 'Free',
                'Value #FREEING': 'Freeing',
                'Value #HEALTH': 'Health',
                'Value #LEAKED': 'Leaked',
                'Value #READONLY': 'Readonly',
                'Value #SIZE': 'Size',
              },
            },
          },
        ],
      }),
    ]),
    NewPanelRow({ datasource, height: 14 }, [
      NewTablePanel({
        title: 'ZFS Datasets',
        targets: [
          { refId: 'AVAILABLE', expr: 'sum(zfs_dataset_available_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'LOGICAL_USED', expr: 'sum(zfs_dataset_logical_used_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'QUOTA', expr: 'sum(zfs_dataset_quota_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'REFERENCED', expr: 'sum(zfs_dataset_referenced_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'USED_BY', expr: 'sum(zfs_dataset_used_by_dataset_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'USED', expr: 'sum(zfs_dataset_used_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          { refId: 'WRITTEN', expr: 'sum(zfs_dataset_written_bytes{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
          // { refId: 'POWER_ON', expr: 'sum(zfs_device_power_on_seconds{instance=~"$instance"}) by (name, pool, type)', format: 'table', type: 'instant' },
        ],
        overrides: [
          { matcher: { id: 'byName', options: 'Available' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Logical Used' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Quota' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Referenced' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Used by' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Used' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          { matcher: { id: 'byName', options: 'Written' }, properties: [{ id: 'unit', value: Unit.BYTES_SI }] },
          // { matcher: { id: 'byName', options: 'Power On Seconds' }, properties: [{ id: 'unit', value: Unit.SECONDS }] },
        ],
        transformations: [
          { id: 'merge', options: {} },
          { id: 'filterFieldsByName', options: { include: { pattern: '(name|pool|type|Value\\s.*)' } } },
          {
            id: 'organize',
            options: {
              excludeByName: tableExcludeByName(['Time']),
              indexByName: {},
              renameByName: {
                name: 'Name',
                pool: 'Pool',
                type: 'Type',
                'Value #AVAILABLE': 'Available',
                'Value #LOGICAL_USED': 'Logical Used',
                'Value #QUOTA': 'Quota',
                'Value #REFERENCED': 'Referenced',
                'Value #USED_BY': 'Used by',
                'Value #USED': 'Used',
                'Value #WRITTEN': 'Written',
                // 'Value #POWER_ON': 'Power On Seconds',
              },
            },
          },
        ],
      }),
    ]),
  ]),
  NewGoRuntimeMetrics({ datasource, selector: '{instance=~"$instance",job="zfs"}' }),
]

function cleanupServiceLabel(query: string): string {
  return `label_replace(${query}, "service", "$1", "service", "([^-]+-[^@]+)@.*")`
}

export const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for ZFS',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['zfs'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'ZFS',
  uid: 'zfs',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }), NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(zfs_exporter_build_info, instance)', includeAll: true, multi: true })],
  },
}
