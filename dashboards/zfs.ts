import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import { GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, PanelRowAndGroups, Unit, autoLayout, goRuntimeMetricsPanels, tableExcludeByName } from '../src/grafana-helpers'

// https://github.com/pdf/zfs_exporter
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

// zfs_exporter: Duration of a collector scrape.
const scrapeDuration = new GaugeMetric('zfs_scrape_collector_duration_seconds') // collector
// zfs_exporter: Whether a collector succeeded.
const scrapeSuccess = new GaugeMetric('zfs_scrape_collector_success') // collector

// The amount of space in bytes allocated to the dataset and all its descendents.
const datasetAllocatedBytes = new GaugeMetric('zfs_dataset_allocated_bytes') // name, pool, type
// The ratio of compressed size vs uncompressed size for this dataset.
const datasetCompressionRatio = new GaugeMetric('zfs_dataset_deduplication_ratio') // name, pool, type
// The ratio of compressed size vs uncompressed size for this dataset.
const datasetFragmentationRatio = new GaugeMetric('zfs_dataset_fragmentation_ratio') // name, pool, type
// The amount of space in bytes available to the dataset and all its children.
const datasetAvailableBytes = new GaugeMetric('zfs_dataset_available_bytes') // name, pool, type
// The amount of space in bytes that is "logically" consumed by this dataset and all its descendents. See the "used_bytes" property.
const datasetLogicalUsedBytes = new GaugeMetric('zfs_dataset_logical_used_bytes') // name, pool, type
// The amount of space that is "logically" accessible by this dataset. See the "referenced_bytes" property.
const datasetLogicalReferencedBytes = new GaugeMetric('zfs_dataset_logical_referenced_bytes') // name, pool, type
// The maximum amount of space in bytes this dataset and its descendents can consume.
const datasetQuotaBytes = new GaugeMetric('zfs_dataset_quota_bytes') // name, pool, type
// The ratio of compressed size vs uncompressed size for the referenced space of this dataset. See also the "compression_ratio" property.
const datasetReferencedCompressionRatio = new GaugeMetric('zfs_dataset_referenced_compression_ratio') // name, pool, type
// The amount of data in bytes that is accessible by this dataset, which may or may not be shared with other datasets in the pool.
const datasetReferencedBytes = new GaugeMetric('zfs_dataset_referenced_bytes') // name, pool, type
// The maximum amount of space in bytes this dataset can consume.
const datasetReferencedQuotaBytes = new GaugeMetric('zfs_dataset_referenced_quota_bytes') // name, pool, type
// The minimum amount of space in bytes guaranteed to this dataset.
const datasetReferencedReservationBytes = new GaugeMetric('zfs_dataset_referenced_reservation_bytes') // name, pool, type
// The minimum amount of space in bytes guaranteed to a dataset and its descendants.
const datasetReservationBytes = new GaugeMetric('zfs_dataset_reservation_bytes') // name, pool, type
// The total number of snapshots that exist under this location in the dataset tree. This value is only available when a snapshot_limit has been set somewhere in the tree under which the dataset resides.
const datasetSnapshotCountTotal = new GaugeMetric('zfs_dataset_snapshot_count_total') // name, pool, type
// The total limit on the number of snapshots that can be created on a dataset and its descendents.
const datasetSnapshotLimitTotal = new GaugeMetric('zfs_dataset_snapshot_limit_total') // name, pool, type
// The amount of space in bytes consumed by this dataset and all its descendents.
const datasetUsedBytes = new GaugeMetric('zfs_dataset_used_bytes') // name, pool, type
// The amount of space in bytes used by children of this dataset, which would be freed if all the dataset's children were
const datasetUsedByChildrenBytes = new GaugeMetric('zfs_dataset_used_by_children_bytes') // name, pool, type
// The amount of space in bytes used by this dataset itself, which would be freed if the dataset were destroyed.
const datasetUsedByDatasetBytes = new GaugeMetric('zfs_dataset_used_by_dataset_bytes') // name, pool, type
// The amount of space in bytes used by a refreservation set on this dataset, which would be freed if the refreservation was removed.
const datasetUsedByReferencedReservationBytes = new GaugeMetric('zfs_dataset_used_by_referenced_reservation_bytes') // name, pool, type
// The amount of space in bytes consumed by snapshots of this dataset.
const datasetUsedBySnapshotBytes = new GaugeMetric('zfs_dataset_used_by_snapshot_bytes') // name, pool, type
// The logical size in bytes of this volume.
const datasetVolumeSizeBytes = new GaugeMetric('zfs_dataset_volume_size_bytes') // name, pool, type
// The amount of referenced space in bytes written to this dataset since the previous snapshot.
const datasetWrittenBytes = new GaugeMetric('zfs_dataset_written_bytes') // name, pool, type

// Amount of storage in bytes used within the pool.
const poolAllocated = new GaugeMetric('zfs_pool_allocated_bytes') // pool
// The ratio of deduplicated size vs undeduplicated size for data in this pool.
const poolDedupratio = new GaugeMetric('zfs_pool_deduplication_ratio') // pool
// Ratio of pool space used.
const poolCapacityRatio = new GaugeMetric('zfs_pool_capacity_ratio') // pool
// Amount of uninitialized space within the pool or device that can be used to increase the total capacity of the pool.
const poolExpandsize = new GaugeMetric('zfs_pool_expand_size_bytes') // pool
// The fragmentation ratio of the pool.
const poolFragmentation = new GaugeMetric('zfs_pool_fragmentation_ratio') // pool
// The amount of free space in bytes available in the pool.
const poolFree = new GaugeMetric('zfs_pool_free_bytes') // pool
// The amount of space in bytes remaining to be freed following the destruction of a file system or snapshot.
const poolFreeing = new GaugeMetric('zfs_pool_freeing_bytes') // pool
// Health status code for the pool [0: online, 1: degraded, 2: faulted, 3: offline, 4: unavailable, 5: removed, 6: suspended].
const poolHealth = new GaugeMetric('zfs_pool_health') // pool
// Number of leaked bytes in the pool.
const poolLeaked = new GaugeMetric('zfs_pool_leaked_bytes') // pool
// Read-only status of the pool [0: read-write, 1: read-only].
const poolReadonly = new GaugeMetric('zfs_pool_readonly') // pool
// Total size in bytes of the storage pool.
const poolSize = new GaugeMetric('zfs_pool_size_bytes') // pool

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Pools', defaultUnit: Unit.SHORT }, poolAllocated.calc('count', { selectors: 'instance=~"$instance"' })),
      NewStatPanel({ title: 'Datasets', defaultUnit: Unit.SHORT }, datasetLogicalUsedBytes.calc('count', { selectors: 'instance=~"$instance"' })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'ZFS Pools',
        tableConfig: {
          queries: {
            pool: { name: 'Pool' },
            ALLOCATED: { name: 'Allocated', unit: Unit.BYTES_SI, target: poolAllocated.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            DUPLICATION_RATIO: { name: 'Deduplication Ratio', unit: Unit.SHORT, target: poolDedupratio.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            FRAGMENTATION_RATIO: { name: 'Fragmentation Ratio', unit: Unit.SHORT, target: poolFragmentation.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            FREE: { name: 'Free', unit: Unit.BYTES_SI, target: poolFree.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            FREEING: { name: 'Freeing', unit: Unit.BYTES_SI, target: poolFreeing.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            HEALTH: { name: 'Health', unit: Unit.SHORT, target: poolHealth.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            LEAKED: { name: 'Leaked', unit: Unit.BYTES_SI, target: poolLeaked.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            READONLY: { name: 'Readonly', unit: Unit.SHORT, target: poolReadonly.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
            SIZE: { name: 'Size', unit: Unit.BYTES_SI, target: poolSize.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }) },
          },
          excludeColumns: ['Time'],
        },
      }),
    ]),
    NewPanelRow({ datasource, height: 20 }, [
      NewTablePanel({
        title: 'ZFS Datasets',
        tableConfig: {
          queries: {
            name: { name: 'Name', width: 400 },
            pool: { name: 'Pool', width: 140 },
            type: { name: 'Type', width: 100 },
            AVAILABLE: { name: 'Available', unit: Unit.BYTES_SI, target: datasetAvailableBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            LOGICAL_USED: { name: 'Logical Used', unit: Unit.BYTES_SI, target: datasetLogicalUsedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            QUOTA: { name: 'Quota', unit: Unit.BYTES_SI, target: datasetQuotaBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            REFERENCED: { name: 'Referenced', unit: Unit.BYTES_SI, target: datasetReferencedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            USED_BY: { name: 'Used by', unit: Unit.BYTES_SI, target: datasetUsedByDatasetBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            USED: { name: 'Used', unit: Unit.BYTES_SI, target: datasetUsedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
            WRITTEN: { name: 'Written', unit: Unit.BYTES_SI, target: datasetWrittenBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }) },
          },
          excludeColumns: ['Time'],
        },
      }),
    ]),
  ]),
  goRuntimeMetricsPanels({ datasource, selectors: 'instance=~"$instance"', groupBy: ['instance'], collapsed: true }),
]

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
    list: [
      //
      NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
      NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(zfs_exporter_build_info, instance)', includeAll: true, multi: true }),
    ],
  },
}
