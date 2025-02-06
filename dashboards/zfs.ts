import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import { GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, PanelRowAndGroups, Unit, autoLayout, goRuntimeMetricsPanels, tableExcludeByName } from '../src/grafana-helpers'

// https://github.com/pdf/zfs_exporter
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const scrapeDuration = new GaugeMetric('zfs_scrape_collector_duration_seconds', { description: 'zfs_exporter: Duration of a collector scrape.', labels: ['collector'] }) // collector
const scrapeSuccess = new GaugeMetric('zfs_scrape_collector_success', { description: 'zfs_exporter: Whether a collector succeeded.', labels: ['collector'] })

const datasetAllocatedBytes = new GaugeMetric('zfs_dataset_allocated_bytes', { description: 'The amount of space in bytes allocated to the dataset and all its descendents.', labels: ['name', 'pool', 'type'] })
const datasetCompressionRatio = new GaugeMetric('zfs_dataset_deduplication_ratio', { description: 'The ratio of compressed size vs uncompressed size for this dataset.', labels: ['name', 'pool', 'type'] })
const datasetFragmentationRatio = new GaugeMetric('zfs_dataset_fragmentation_ratio', { description: 'The ratio of compressed size vs uncompressed size for this dataset.', labels: ['name', 'pool', 'type'] })
const datasetAvailableBytes = new GaugeMetric('zfs_dataset_available_bytes', { description: 'The amount of space in bytes available to the dataset and all its children.', labels: ['name', 'pool', 'type'] })
const datasetLogicalUsedBytes = new GaugeMetric('zfs_dataset_logical_used_bytes', { description: 'The amount of space in bytes that is "logically" consumed by this dataset and all its descendents. See the "used_bytes" property.', labels: ['name', 'pool', 'type'] })
const datasetLogicalReferencedBytes = new GaugeMetric('zfs_dataset_logical_referenced_bytes', { description: 'The amount of space that is "logically" accessible by this dataset. See the "referenced_bytes" property.', labels: ['name', 'pool', 'type'] })
const datasetQuotaBytes = new GaugeMetric('zfs_dataset_quota_bytes', { description: 'The maximum amount of space in bytes this dataset and its descendents can consume.', labels: ['name', 'pool', 'type'] })
const datasetReferencedCompressionRatio = new GaugeMetric('zfs_dataset_referenced_compression_ratio', { description: 'The ratio of compressed size vs uncompressed size for the referenced space of this dataset. See also the "compression_ratio" property.', labels: ['name', 'pool', 'type'] })
const datasetReferencedBytes = new GaugeMetric('zfs_dataset_referenced_bytes', { description: 'The amount of data in bytes that is accessible by this dataset, which may or may not be shared with other datasets in the pool.', labels: ['name', 'pool', 'type'] })
const datasetReferencedQuotaBytes = new GaugeMetric('zfs_dataset_referenced_quota_bytes', { description: 'The maximum amount of space in bytes this dataset can consume.', labels: ['name', 'pool', 'type'] })
const datasetReferencedReservationBytes = new GaugeMetric('zfs_dataset_referenced_reservation_bytes', { description: 'The minimum amount of space in bytes guaranteed to this dataset.', labels: ['name', 'pool', 'type'] })
const datasetReservationBytes = new GaugeMetric('zfs_dataset_reservation_bytes', { description: 'The minimum amount of space in bytes guaranteed to a dataset and its descendants.', labels: ['name', 'pool', 'type'] })
const datasetSnapshotCountTotal = new GaugeMetric('zfs_dataset_snapshot_count_total', { description: 'The total number of snapshots that exist under this location in the dataset tree. This value is only available when a snapshot_limit has been set somewhere in the tree under which the dataset resides.', labels: ['name', 'pool', 'type'] })
const datasetSnapshotLimitTotal = new GaugeMetric('zfs_dataset_snapshot_limit_total', { description: 'The total limit on the number of snapshots that can be created on a dataset and its descendents.', labels: ['name', 'pool', 'type'] })
const datasetUsedBytes = new GaugeMetric('zfs_dataset_used_bytes', { description: 'The amount of space in bytes consumed by this dataset and all its descendents.', labels: ['name', 'pool', 'type'] })
const datasetUsedByChildrenBytes = new GaugeMetric('zfs_dataset_used_by_children_bytes', { description: "The amount of space in bytes used by children of this dataset, which would be freed if all the dataset's children were", labels: ['name', 'pool', 'type'] })
const datasetUsedByDatasetBytes = new GaugeMetric('zfs_dataset_used_by_dataset_bytes', { description: 'The amount of space in bytes used by this dataset itself, which would be freed if the dataset were destroyed.', labels: ['name', 'pool', 'type'] })
const datasetUsedByReferencedReservationBytes = new GaugeMetric('zfs_dataset_used_by_referenced_reservation_bytes', { description: 'The amount of space in bytes used by a refreservation set on this dataset, which would be freed if the refreservation was removed.', labels: ['name', 'pool', 'type'] })
const datasetUsedBySnapshotBytes = new GaugeMetric('zfs_dataset_used_by_snapshot_bytes', { description: 'The amount of space in bytes consumed by snapshots of this dataset.', labels: ['name', 'pool', 'type'] })
const datasetVolumeSizeBytes = new GaugeMetric('zfs_dataset_volume_size_bytes', { description: 'The logical size in bytes of this volume.', labels: ['name', 'pool', 'type'] })
const datasetWrittenBytes = new GaugeMetric('zfs_dataset_written_bytes', { description: 'The amount of referenced space in bytes written to this dataset since the previous snapshot.', labels: ['name', 'pool', 'type'] })

const poolAllocated = new GaugeMetric('zfs_pool_allocated_bytes', { description: 'Amount of storage in bytes used within the pool.', labels: ['pool'] })
const poolDedupratio = new GaugeMetric('zfs_pool_deduplication_ratio', { description: 'The ratio of deduplicated size vs undeduplicated size for data in this pool.', labels: ['pool'] })
const poolCapacityRatio = new GaugeMetric('zfs_pool_capacity_ratio', { description: 'Ratio of pool space used.', labels: ['pool'] })
const poolExpandsize = new GaugeMetric('zfs_pool_expand_size_bytes', { description: 'Amount of uninitialized space within the pool or device that can be used to increase the total capacity of the pool.', labels: ['pool'] })
const poolFragmentation = new GaugeMetric('zfs_pool_fragmentation_ratio', { description: 'The fragmentation ratio of the pool.', labels: ['pool'] })
const poolFree = new GaugeMetric('zfs_pool_free_bytes', { description: 'The amount of free space in bytes available in the pool.', labels: ['pool'] })
const poolFreeing = new GaugeMetric('zfs_pool_freeing_bytes', { description: 'The amount of space in bytes remaining to be freed following the destruction of a file system or snapshot.', labels: ['pool'] })
const poolHealth = new GaugeMetric('zfs_pool_health', { description: 'Health status code for the pool [0: online, 1: degraded, 2: faulted, 3: offline, 4: unavailable, 5: removed, 6: suspended].', labels: ['pool'] })
const poolLeaked = new GaugeMetric('zfs_pool_leaked_bytes', { description: 'Number of leaked bytes in the pool.', labels: ['pool'] })
const poolReadonly = new GaugeMetric('zfs_pool_readonly', { description: 'Read-only status of the pool [0: read-write, 1: read-only].', labels: ['pool'] })
const poolSize = new GaugeMetric('zfs_pool_size_bytes', { description: 'Total size in bytes of the storage pool.', labels: ['pool'] })

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Pools', defaultUnit: Unit.SHORT }, poolAllocated.calc('count', { selectors: 'instance=~"$instance"' }).target()),
      NewStatPanel({ title: 'Datasets', defaultUnit: Unit.SHORT }, datasetLogicalUsedBytes.calc('count', { selectors: 'instance=~"$instance"' }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'ZFS Pools',
        tableConfig: {
          queries: {
            pool: { name: 'Pool' },
            ALLOCATED: { name: 'Allocated', unit: Unit.BYTES_SI, target: poolAllocated.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            DUPLICATION_RATIO: { name: 'Deduplication Ratio', unit: Unit.SHORT, target: poolDedupratio.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            FRAGMENTATION_RATIO: { name: 'Fragmentation Ratio', unit: Unit.SHORT, target: poolFragmentation.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            FREE: { name: 'Free', unit: Unit.BYTES_SI, target: poolFree.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            FREEING: { name: 'Freeing', unit: Unit.BYTES_SI, target: poolFreeing.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            HEALTH: { name: 'Health', unit: Unit.SHORT, target: poolHealth.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            LEAKED: { name: 'Leaked', unit: Unit.BYTES_SI, target: poolLeaked.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            READONLY: { name: 'Readonly', unit: Unit.SHORT, target: poolReadonly.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
            SIZE: { name: 'Size', unit: Unit.BYTES_SI, target: poolSize.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['pool'], type: 'instant' }).target() },
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
            AVAILABLE: { name: 'Available', unit: Unit.BYTES_SI, target: datasetAvailableBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            LOGICAL_USED: { name: 'Logical Used', unit: Unit.BYTES_SI, target: datasetLogicalUsedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            QUOTA: { name: 'Quota', unit: Unit.BYTES_SI, target: datasetQuotaBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            REFERENCED: { name: 'Referenced', unit: Unit.BYTES_SI, target: datasetReferencedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            USED_BY: { name: 'Used by', unit: Unit.BYTES_SI, target: datasetUsedByDatasetBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            USED: { name: 'Used', unit: Unit.BYTES_SI, target: datasetUsedBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
            WRITTEN: { name: 'Written', unit: Unit.BYTES_SI, target: datasetWrittenBytes.calc('sum', { selectors: 'instance=~"$instance"', groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
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
