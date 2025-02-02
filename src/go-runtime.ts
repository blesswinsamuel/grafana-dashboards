import { DataSourceRef } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'
import { CounterMetric, GaugeMetric, SummaryMetric } from './promql-helpers'

// https://github.com/mknyszek/client_golang/blob/master/prometheus/go_collector.go
// https://github.com/mknyszek/client_golang/blob/master/prometheus/process_collector.go

// Build information about the main Go module.
const goBuildInfo = new GaugeMetric('go_build_info') // path, version, checksum
// Number of goroutines that currently exist.
const goGoroutines = new GaugeMetric('go_goroutines')
// Number of OS threads created.
const goThreads = new GaugeMetric('go_threads')
// A summary of the pause duration of garbage collection cycles.
const goGcDurationSeconds = new SummaryMetric('go_gc_duration_seconds')
// Information about the Go environment.
const goInfo = new GaugeMetric('go_info') // version

// Number of bytes allocated and still in use.
const goMemstatsAllocBytes = new GaugeMetric('go_memstats_alloc_bytes')
// Total number of bytes allocated, even if freed.
const goMemstatsAllocBytesTotal = new CounterMetric('go_memstats_alloc_bytes_total')
// Number of bytes obtained from system.
const goMemstatsSysBytes = new GaugeMetric('go_memstats_sys_bytes')
// Total number of pointer lookups.
const goMemstatsLookupsTotal = new CounterMetric('go_memstats_lookups_total')
// Total number of mallocs.
const goMemstatsMallocsTotal = new CounterMetric('go_memstats_mallocs_total')
// Total number of frees.
const goMemstatsFreesTotal = new CounterMetric('go_memstats_frees_total')
// Number of heap bytes allocated and still in use.
const goMemstatsHeapAllocBytes = new GaugeMetric('go_memstats_heap_alloc_bytes')
// Number of heap bytes obtained from system.
const goMemstatsHeapSysBytes = new GaugeMetric('go_memstats_heap_sys_bytes')
// Number of heap bytes waiting to be used.
const goMemstatsHeapIdleBytes = new GaugeMetric('go_memstats_heap_idle_bytes')
// Number of heap bytes that are in use.
const goMemstatsHeapInuseBytes = new GaugeMetric('go_memstats_heap_inuse_bytes')
// Number of heap bytes released to OS.
const goMemstatsHeapReleasedBytes = new GaugeMetric('go_memstats_heap_released_bytes')
// Number of allocated objects.
const goMemstatsHeapObjects = new GaugeMetric('go_memstats_heap_objects')
// Number of bytes in use by the stack allocator.
const goMemstatsStackInuseBytes = new GaugeMetric('go_memstats_stack_inuse_bytes')
// Number of bytes obtained from system for stack allocator.
const goMemstatsStackSysBytes = new GaugeMetric('go_memstats_stack_sys_bytes')
// Number of bytes in use by mspan structures.
const goMemstatsMspanInuseBytes = new GaugeMetric('go_memstats_mspan_inuse_bytes')
// Number of bytes used for mspan structures obtained from system.
const goMemstatsMspanSysBytes = new GaugeMetric('go_memstats_mspan_sys_bytes')
// Number of bytes in use by mcache structures.
const goMemstatsMcacheInuseBytes = new GaugeMetric('go_memstats_mcache_inuse_bytes')
// Number of bytes used for mcache structures obtained from system.
const goMemstatsMcacheSysBytes = new GaugeMetric('go_memstats_mcache_sys_bytes')
// Number of bytes used by the profiling bucket hash table.
const goMemstatsBuckHashSysBytes = new GaugeMetric('go_memstats_buck_hash_sys_bytes')
// Number of bytes used for garbage collection system metadata.
const goMemstatsGcSysBytes = new GaugeMetric('go_memstats_gc_sys_bytes')
// Number of bytes used for other system allocations.
const goMemstatsOtherSysBytes = new GaugeMetric('go_memstats_other_sys_bytes')
// Number of heap bytes when next garbage collection will take place.
const goMemstatsNextGcBytes = new GaugeMetric('go_memstats_next_gc_bytes')
// Number of seconds since 1970 of last garbage collection.
const goMemstatsLastGcTimeSeconds = new GaugeMetric('go_memstats_last_gc_time_seconds')
// The fraction of this program's available CPU time used by the GC since the program started.
const goMemstatsGcCpuFraction = new GaugeMetric('go_memstats_gc_cpu_fraction')

// Total user and system CPU time spent in seconds.
const processCpuSecondsTotal = new CounterMetric('process_cpu_seconds_total')
// Number of open file descriptors.
const processOpenFds = new GaugeMetric('process_open_fds')
// Maximum number of open file descriptors.
const processMaxFds = new GaugeMetric('process_max_fds')
// Virtual memory size in bytes.
const processVirtualMemoryBytes = new GaugeMetric('process_virtual_memory_bytes')
// Maximum amount of virtual memory available in bytes.
const processVirtualMemoryMaxBytes = new GaugeMetric('process_virtual_memory_max_bytes')
// Resident memory size in bytes.
const processResidentMemoryBytes = new GaugeMetric('process_resident_memory_bytes')
// Start time of the process since unix epoch in seconds.
const processStartTimeSeconds = new GaugeMetric('process_start_time_seconds')

export function goRuntimeMetricsPanels({ datasource, title, selectors = [], groupBy = ['pod', 'instance'], collapsed }: { datasource?: DataSourceRef; title?: string; groupBy?: string[]; selectors?: string | string[]; collapsed?: boolean }): PanelGroup {
  return NewPanelGroup({ title: title ?? 'Go Runtime Metrics', collapsed }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'File Descriptors', defaultUnit: Unit.SHORT }, processOpenFds.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'CPU Usage', defaultUnit: Unit.SHORT }, processCpuSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Usage', defaultUnit: Unit.BYTES_SI }, processResidentMemoryBytes.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({
        title: 'Stack Memory Usage',
        targets: [goMemstatsStackSysBytes.calc('avg', { selectors, legendFormat: 'sys' }), goMemstatsStackInuseBytes.calc('avg', { selectors, legendFormat: 'inuse' })],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Heap Memory Usage',
        targets: [goMemstatsHeapSysBytes.calc('avg', { selectors, legendFormat: 'sys' }), goMemstatsHeapIdleBytes.calc('avg', { selectors, legendFormat: 'idle' }), goMemstatsHeapReleasedBytes.calc('avg', { selectors, legendFormat: 'released' }), goMemstatsNextGcBytes.calc('avg', { selectors, legendFormat: 'next_gc' }), goMemstatsHeapInuseBytes.calc('avg', { selectors, legendFormat: 'inuse' }), goMemstatsHeapAllocBytes.calc('avg', { selectors, legendFormat: 'alloc' })],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({ title: 'Heap Objects' }, goMemstatsHeapObjects.calc('avg', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Threads' }, goThreads.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Goroutines' }, goGoroutines.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go Alloc Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, goMemstatsAllocBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go Alloc Bytes', defaultUnit: Unit.BYTES_SI }, goMemstatsAllocBytes.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go GC Per Second' }, goGcDurationSeconds.count().calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds', defaultUnit: Unit.SECONDS }, goGcDurationSeconds.sum().calc('sum', 'rate', { selectors, groupBy })),
    ]),
    // # stat_panel_name("Go Info", f'go_info{selector}', "{{ version }}"),
    // # stat_panel_value("Last GC time", f'go_memstats_last_gc_time_seconds{selector} * 1000', unit=UNITS.DATE_TIME_FROM_NOW),
  ])
}
