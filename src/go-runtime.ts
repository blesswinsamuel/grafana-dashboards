import { DataSourceRef, VizOrientation } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewStatPanel, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'
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

export function goRuntimeMetricsPanels({ datasource, title, buildInfoMetric, selectors = [], groupBy = ['pod', 'instance'], collapsed }: { datasource?: DataSourceRef; title?: string; buildInfoMetric?: string; groupBy?: string[]; selectors?: string | string[]; collapsed?: boolean }): PanelGroup {
  return NewPanelGroup({ title: title ?? 'Go Runtime Metrics', collapsed }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Go Version', options: { reduceOptions: { fields: '/^version$/' } } }, goInfo.calc('sum', { selectors, groupBy: ['version'], type: 'instant' })),
      NewStatPanel({ title: 'Process Start Time', defaultUnit: Unit.DATE_TIME_FROM_NOW }, processStartTimeSeconds.calc('max', { selectors, type: 'instant', append: ' * 1000' })),
      NewStatPanel({ title: 'Process Max File Descriptors', defaultUnit: Unit.SHORT }, processMaxFds.calc('min', { selectors, type: 'instant' })),
      NewStatPanel({ title: 'Process Virtual Memory Max', defaultUnit: Unit.BYTES_SI }, processVirtualMemoryMaxBytes.calc('min', { selectors, type: 'instant' })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      buildInfoMetric && NewStatPanel({ width: 6, title: 'Go Build Info', options: { text: { titleSize: 12 }, orientation: VizOrientation.Horizontal, reduceOptions: { fields: '/^(branch|goarch|goos|goversion|revision|tags|version)$/' } } }, new GaugeMetric(buildInfoMetric).calc('sum', { selectors, groupBy: ['branch', 'goarch', 'goos', 'goversion', 'revision', 'tags', 'version'], type: 'instant' })),
      NewTimeSeriesPanel({ title: 'Process Open File Descriptors', defaultUnit: Unit.SHORT }, processOpenFds.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Threads' }, goThreads.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Goroutines' }, goGoroutines.calc('sum', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'CPU Usage', defaultUnit: Unit.SHORT }, processCpuSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Usage', defaultUnit: Unit.BYTES_SI }, processResidentMemoryBytes.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go Alloc Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, goMemstatsAllocBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go Alloc Bytes', defaultUnit: Unit.BYTES_SI }, goMemstatsAllocBytes.calc('sum', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Stack Memory Usage (avg)', defaultUnit: Unit.BYTES_SI }, goMemstatsStackSysBytes.calc('avg', { selectors, legendFormat: 'sys' }), goMemstatsStackInuseBytes.calc('avg', { selectors, legendFormat: 'inuse' })),
      NewTimeSeriesPanel(
        { title: 'Heap Memory Usage (avg)', defaultUnit: Unit.BYTES_SI },
        //
        goMemstatsHeapSysBytes.calc('avg', { selectors, legendFormat: 'sys' }),
        goMemstatsHeapIdleBytes.calc('avg', { selectors, legendFormat: 'idle' }),
        goMemstatsHeapReleasedBytes.calc('avg', { selectors, legendFormat: 'released' }),
        goMemstatsHeapInuseBytes.calc('avg', { selectors, legendFormat: 'inuse' }),
        goMemstatsHeapAllocBytes.calc('avg', { selectors, legendFormat: 'alloc' })
      ),
      NewTimeSeriesPanel({ title: 'Heap Objects', defaultUnit: Unit.SHORT }, goMemstatsHeapObjects.calc('avg', { selectors, groupBy })),
      NewTimeSeriesPanel(
        { title: 'Other Memory (avg)', defaultUnit: Unit.BYTES_SI },
        goMemstatsMspanSysBytes.calc('avg', { selectors, legendFormat: 'mspan_sys' }),
        goMemstatsMspanInuseBytes.calc('avg', { selectors, legendFormat: 'mspan_inuse' }),
        goMemstatsMcacheSysBytes.calc('avg', { selectors, legendFormat: 'mcache_sys' }),
        goMemstatsMcacheInuseBytes.calc('avg', { selectors, legendFormat: 'mcache_inuse' }),
        goMemstatsBuckHashSysBytes.calc('avg', { selectors, legendFormat: 'buck_hash_sys' }),
        goMemstatsOtherSysBytes.calc('avg', { selectors, legendFormat: 'other_sys' }),
        goMemstatsGcSysBytes.calc('avg', { selectors, legendFormat: 'gc_sys' }),
        goMemstatsNextGcBytes.calc('avg', { selectors, legendFormat: 'next_gc' }),
        goMemstatsSysBytes.calc('avg', { selectors, legendFormat: 'sys' })
      ),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Go GC count' }, goGcDurationSeconds.count().calc('sum', 'increase', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds (rate)', defaultUnit: Unit.SECONDS }, goGcDurationSeconds.sum().calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds (avg)', defaultUnit: Unit.SECONDS }, goGcDurationSeconds.avg({ selectors, groupBy })),
      // NewTimeSeriesPanel({ title: 'Go GC CPU Fraction' }, goMemstatsGcCpuFraction.calc('sum', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Lookups rate', defaultUnit: Unit.SHORT }, goMemstatsLookupsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Mallocs rate', defaultUnit: Unit.SHORT }, goMemstatsMallocsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Frees rate', defaultUnit: Unit.SHORT }, goMemstatsFreesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Process Virtual Memory', defaultUnit: Unit.BYTES_SI }, processVirtualMemoryBytes.calc('sum', { selectors, groupBy })),
    ]),
  ])
}
