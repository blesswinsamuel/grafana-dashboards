import { GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, dashboard, goRuntimeMetricsPanels, newDashboard, tableExcludeByName, units } from '../src/grafana-helpers'

// https://github.com/pdf/zfs_exporter
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/

const datasource: dashboard.DataSourceRef = {
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

const selectors = 'instance=~"$instance", pool=~"$pool"'

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Pools' }, poolAllocated.calc('count', { selectors }).target()),
      NewStatPanel({ title: 'Datasets' }, datasetLogicalUsedBytes.calc('count', { selectors }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'ZFS Pools',
        queries: {
          pool: { name: 'Pool' },
          ALLOCATED: { name: 'Allocated', unit: units.BytesSI, target: poolAllocated.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          DUPLICATION_RATIO: { name: 'Deduplication Ratio', target: poolDedupratio.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          FRAGMENTATION_RATIO: { name: 'Fragmentation Ratio', target: poolFragmentation.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          FREE: { name: 'Free', unit: units.BytesSI, target: poolFree.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          FREEING: { name: 'Freeing', unit: units.BytesSI, target: poolFreeing.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          HEALTH: { name: 'Health', target: poolHealth.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          LEAKED: { name: 'Leaked', unit: units.BytesSI, target: poolLeaked.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          READONLY: { name: 'Readonly', target: poolReadonly.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
          SIZE: { name: 'Size', unit: units.BytesSI, target: poolSize.calc('sum', { selectors, groupBy: ['pool'], type: 'instant' }).target() },
        },
        excludeColumns: ['Time'],
      }),
    ]),
    NewPanelRow({ datasource, height: 20 }, [
      NewTablePanel({
        title: 'ZFS Datasets',
        queries: {
          name: { name: 'Name', width: 400 },
          pool: { name: 'Pool', width: 140 },
          type: { name: 'Type', width: 100 },
          AVAILABLE: { name: 'Available', unit: units.BytesSI, target: datasetAvailableBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          LOGICAL_USED: { name: 'Logical Used', unit: units.BytesSI, target: datasetLogicalUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          QUOTA: { name: 'Quota', unit: units.BytesSI, target: datasetQuotaBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          REFERENCED: { name: 'Referenced', unit: units.BytesSI, target: datasetReferencedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          USED_BY: { name: 'Used by', unit: units.BytesSI, target: datasetUsedByDatasetBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          USED: { name: 'Used', unit: units.BytesSI, target: datasetUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          WRITTEN: { name: 'Written', unit: units.BytesSI, target: datasetWrittenBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' }).target() },
          PERCENTAGE_USED: { name: 'Percentage Used', unit: units.PercentUnit, target: { expr: `${datasetUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' })} / ${datasetQuotaBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'], type: 'instant' })}`, legendFormat: 'Percentage Used', type: 'instant', format: 'table' } },
        },
        excludeColumns: ['Time'],
      }),
    ]),
  ]),
  NewPanelGroup({ title: 'ZFS Pools' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Pool Capacity Ratio', unit: units.PercentUnit, description: poolCapacityRatio.description() }, poolCapacityRatio.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Deduplication Ratio', description: poolDedupratio.description() }, poolDedupratio.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Fragmentation Ratio', description: poolFragmentation.description() }, poolFragmentation.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Health', description: poolHealth.description() }, poolHealth.calc('sum', { selectors, groupBy: ['pool'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Pool Leaked', unit: units.BytesSI, description: poolLeaked.description() }, poolLeaked.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Readonly', description: poolReadonly.description() }, poolReadonly.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Size', unit: units.BytesSI, description: poolSize.description() }, poolSize.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Free', unit: units.BytesSI, description: poolFree.description() }, poolFree.calc('sum', { selectors, groupBy: ['pool'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Pool Freeing', unit: units.BytesSI, description: poolFreeing.description() }, poolFreeing.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Expand Size', unit: units.BytesSI, description: poolExpandsize.description() }, poolExpandsize.calc('sum', { selectors, groupBy: ['pool'] }).target()),
      NewTimeSeriesPanel({ title: 'Pool Allocated', unit: units.BytesSI, description: poolAllocated.description() }, poolAllocated.calc('sum', { selectors, groupBy: ['pool'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'ZFS Datasets' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Percentage Used', unit: units.PercentUnit }, { expr: `${datasetUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] })} / ${datasetQuotaBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] })}`, legendFormat: '{{name}} - {{pool}} - {{type}}', type: 'instant' }),
      NewTimeSeriesPanel({ title: 'Dataset Available', unit: units.BytesSI, description: datasetAvailableBytes.description() }, datasetAvailableBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Logical Used', unit: units.BytesSI, description: datasetLogicalUsedBytes.description() }, datasetLogicalUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Quota', unit: units.BytesSI, description: datasetQuotaBytes.description() }, datasetQuotaBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Used By', unit: units.BytesSI, description: datasetUsedByDatasetBytes.description() }, datasetUsedByDatasetBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Used', unit: units.BytesSI, description: datasetUsedBytes.description() }, datasetUsedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Written', unit: units.BytesSI, description: datasetWrittenBytes.description() }, datasetWrittenBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Referenced', unit: units.BytesSI, description: datasetReferencedBytes.description() }, datasetReferencedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Fragmentation Ratio' }, datasetFragmentationRatio.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Referenced Compression Ratio' }, datasetReferencedCompressionRatio.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Used By Children', unit: units.BytesSI }, datasetUsedByChildrenBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Used By Referenced Reservation', unit: units.BytesSI }, datasetUsedByReferencedReservationBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Used By Snapshot', unit: units.BytesSI }, datasetUsedBySnapshotBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Volume Size', unit: units.BytesSI }, datasetVolumeSizeBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Snapshot Count Total' }, datasetSnapshotCountTotal.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Snapshot Limit Total' }, datasetSnapshotLimitTotal.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Referenced Quota', unit: units.BytesSI }, datasetReferencedQuotaBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Dataset Referenced Reservation', unit: units.BytesSI }, datasetReferencedReservationBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Logical Referenced', unit: units.BytesSI }, datasetLogicalReferencedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Allocation', unit: units.BytesSI }, datasetAllocatedBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Dataset Compression Ratio', unit: units.BytesSI }, datasetCompressionRatio.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
      NewTimeSeriesPanel({ title: 'Dataset Reservation', unit: units.BytesSI }, datasetReservationBytes.calc('sum', { selectors, groupBy: ['name', 'pool', 'type'] }).target()),
    ]),
  ]),
  goRuntimeMetricsPanels({ datasource, selectors: `instance=~"$instace"`, groupBy: ['instance'], collapsed: true }),
]

export const zfsDashboard = newDashboard({
  variables: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }), NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(zfs_exporter_build_info, instance)', includeAll: true, multi: true }), NewQueryVariable({ datasource, name: 'pool', label: 'Pool', query: 'label_values(zfs_pool_allocated_bytes, pool)', includeAll: true, multi: true })],
  panels,
})
