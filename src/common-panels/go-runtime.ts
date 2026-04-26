import * as units from '@grafana/grafana-foundation-sdk/units'
import { common, type dashboard, NewPanelGroup, NewPanelRow, NewStatPanel, NewTimeSeriesPanel, type PanelGroup } from '../grafana-helpers'
import { CounterMetric, GaugeMetric, SummaryMetric, wrapMultiply } from '../helpers/promql'

// https://github.com/mknyszek/client_golang/blob/master/prometheus/go_collector.go
// https://github.com/mknyszek/client_golang/blob/master/prometheus/process_collector.go

const goBuildInfo = new GaugeMetric('go_build_info', { description: 'Build information about the main Go module', labels: ['path', 'version', 'checksum'] })
const goGoroutines = new GaugeMetric('go_goroutines', { description: 'Number of goroutines that currently exist' })
const goThreads = new GaugeMetric('go_threads', { description: 'Number of OS threads created' })
const goGcDurationSeconds = new SummaryMetric('go_gc_duration_seconds', { description: 'A summary of the pause duration of garbage collection cycles' })
const goInfo = new GaugeMetric('go_info', { description: 'Information about the Go environment', labels: ['version'] })

const goMemstatsAllocBytes = new GaugeMetric('go_memstats_alloc_bytes', { description: 'Number of bytes allocated and still in use' })
const goMemstatsAllocBytesTotal = new CounterMetric('go_memstats_alloc_bytes_total', { description: 'Total number of bytes allocated, even if freed' })
const goMemstatsSysBytes = new GaugeMetric('go_memstats_sys_bytes', { description: 'Number of bytes obtained from system' })
const goMemstatsLookupsTotal = new CounterMetric('go_memstats_lookups_total', { description: 'Total number of pointer lookups' })
const goMemstatsMallocsTotal = new CounterMetric('go_memstats_mallocs_total', { description: 'Total number of mallocs' })
const goMemstatsFreesTotal = new CounterMetric('go_memstats_frees_total', { description: 'Total number of frees' })
const goMemstatsHeapAllocBytes = new GaugeMetric('go_memstats_heap_alloc_bytes', { description: 'Number of heap bytes allocated and still in use' })
const goMemstatsHeapSysBytes = new GaugeMetric('go_memstats_heap_sys_bytes', { description: 'Number of heap bytes obtained from system' })
const goMemstatsHeapIdleBytes = new GaugeMetric('go_memstats_heap_idle_bytes', { description: 'Number of heap bytes waiting to be used' })
const goMemstatsHeapInuseBytes = new GaugeMetric('go_memstats_heap_inuse_bytes', { description: 'Number of heap bytes that are in use' })
const goMemstatsHeapReleasedBytes = new GaugeMetric('go_memstats_heap_released_bytes', { description: 'Number of heap bytes released to OS' })
const goMemstatsHeapObjects = new GaugeMetric('go_memstats_heap_objects', { description: 'Number of allocated objects' })
const goMemstatsStackInuseBytes = new GaugeMetric('go_memstats_stack_inuse_bytes', { description: 'Number of bytes in use by the stack allocator' })
const goMemstatsStackSysBytes = new GaugeMetric('go_memstats_stack_sys_bytes', { description: 'Number of bytes obtained from system for stack allocator' })
const goMemstatsMspanInuseBytes = new GaugeMetric('go_memstats_mspan_inuse_bytes', { description: 'Number of bytes in use by mspan structures' })
const goMemstatsMspanSysBytes = new GaugeMetric('go_memstats_mspan_sys_bytes', { description: 'Number of bytes used for mspan structures obtained from system' })
const goMemstatsMcacheInuseBytes = new GaugeMetric('go_memstats_mcache_inuse_bytes', { description: 'Number of bytes in use by mcache structures' })
const goMemstatsMcacheSysBytes = new GaugeMetric('go_memstats_mcache_sys_bytes', { description: 'Number of bytes used for mcache structures obtained from system' })
const goMemstatsBuckHashSysBytes = new GaugeMetric('go_memstats_buck_hash_sys_bytes', { description: 'Number of bytes used by the profiling bucket hash table' })
const goMemstatsGcSysBytes = new GaugeMetric('go_memstats_gc_sys_bytes', { description: 'Number of bytes used for garbage collection system metadata' })
const goMemstatsOtherSysBytes = new GaugeMetric('go_memstats_other_sys_bytes', { description: 'Number of bytes used for other system allocations' })
const goMemstatsNextGcBytes = new GaugeMetric('go_memstats_next_gc_bytes', { description: 'Number of heap bytes when next garbage collection will take place' })
const goMemstatsLastGcTimeSeconds = new GaugeMetric('go_memstats_last_gc_time_seconds', { description: 'Number of seconds since 1970 of last garbage collection' })
const goMemstatsGcCpuFraction = new GaugeMetric('go_memstats_gc_cpu_fraction', { description: "The fraction of this program's available CPU time used by the GC since the program started" })

const processCpuSecondsTotal = new CounterMetric('process_cpu_seconds_total', { description: 'Total user and system CPU time spent in seconds' })
const processOpenFds = new GaugeMetric('process_open_fds', { description: 'Number of open file descriptors' })
const processMaxFds = new GaugeMetric('process_max_fds', { description: 'Maximum number of open file descriptors' })
const processVirtualMemoryBytes = new GaugeMetric('process_virtual_memory_bytes', { description: 'Virtual memory size in bytes' })
const processVirtualMemoryMaxBytes = new GaugeMetric('process_virtual_memory_max_bytes', { description: 'Maximum amount of virtual memory available in bytes' })
const processResidentMemoryBytes = new GaugeMetric('process_resident_memory_bytes', { description: 'Resident memory size in bytes' })
const processStartTimeSeconds = new GaugeMetric('process_start_time_seconds', { description: 'Start time of the process since unix epoch in seconds' })

export function goRuntimeMetricsPanels({
  datasource,
  title,
  buildInfoMetric,
  selectors = [],
  by = ['pod', 'instance'],
  collapsed,
}: {
  datasource?: dashboard.DataSourceRef
  title?: string
  buildInfoMetric?: string
  by?: string[]
  selectors?: string | string[]
  collapsed?: boolean
}): PanelGroup {
  return NewPanelGroup({ title: title ?? 'Go Runtime Metrics', collapsed }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Go Version', reduceFields: '/^version$/' }, goInfo.sum({ selectors, by: ['version'], instant: true }).target()),
      NewStatPanel({ title: 'Process Start Time', unit: units.DateTimeFromNow }, processStartTimeSeconds.max({ selectors, instant: true }).wrap(wrapMultiply(1000)).target()),
      NewStatPanel({ title: 'Process Max File Descriptors', unit: units.Short }, processMaxFds.min({ selectors, instant: true }).target()),
      NewStatPanel({ title: 'Process Virtual Memory Max', unit: units.BytesSI }, processVirtualMemoryMaxBytes.min({ selectors, instant: true }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      buildInfoMetric
        ? NewStatPanel(
            { width: 6, title: 'Go Build Info', reduceFields: '/^(branch|goarch|goos|goversion|revision|tags|version)$/', orientation: common.VizOrientation.Horizontal, textTitleSize: 12 },
            new GaugeMetric(buildInfoMetric).sum({ selectors, by: ['branch', 'goarch', 'goos', 'goversion', 'revision', 'tags', 'version'], instant: true }).target(),
          )
        : undefined,
      NewTimeSeriesPanel({ title: 'Process Open File Descriptors', unit: units.Short }, processOpenFds.sum({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Threads' }, goThreads.sum({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Goroutines' }, goGoroutines.sum({ selectors, by }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'CPU Usage', unit: units.Short }, processCpuSecondsTotal.rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Memory Usage', unit: units.BytesSI }, processResidentMemoryBytes.sum({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Go Alloc Rate', unit: units.BytesPerSecondSI }, goMemstatsAllocBytesTotal.rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Go Alloc Bytes', unit: units.BytesSI }, goMemstatsAllocBytes.sum({ selectors, by }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel(
        { title: 'Stack Memory Usage (avg)', unit: units.BytesSI },
        goMemstatsStackSysBytes.avg({ selectors }).target({ legend: 'sys' }),
        goMemstatsStackInuseBytes.avg({ selectors }).target({ legend: 'inuse' }),
      ),
      NewTimeSeriesPanel(
        { title: 'Heap Memory Usage (avg)', unit: units.BytesSI },
        //
        goMemstatsHeapSysBytes.avg({ selectors }).target({ legend: 'sys' }),
        goMemstatsHeapIdleBytes.avg({ selectors }).target({ legend: 'idle' }),
        goMemstatsHeapReleasedBytes.avg({ selectors }).target({ legend: 'released' }),
        goMemstatsHeapInuseBytes.avg({ selectors }).target({ legend: 'inuse' }),
        goMemstatsHeapAllocBytes.avg({ selectors }).target({ legend: 'alloc' }),
      ),
      NewTimeSeriesPanel({ title: 'Heap Objects', unit: units.Short }, goMemstatsHeapObjects.avg({ selectors, by }).target()),
      NewTimeSeriesPanel(
        { title: 'Other Memory (avg)', unit: units.BytesSI },
        goMemstatsMspanSysBytes.avg({ selectors }).target({ legend: 'mspan_sys' }),
        goMemstatsMspanInuseBytes.avg({ selectors }).target({ legend: 'mspan_inuse' }),
        goMemstatsMcacheSysBytes.avg({ selectors }).target({ legend: 'mcache_sys' }),
        goMemstatsMcacheInuseBytes.avg({ selectors }).target({ legend: 'mcache_inuse' }),
        goMemstatsBuckHashSysBytes.avg({ selectors }).target({ legend: 'buck_hash_sys' }),
        goMemstatsOtherSysBytes.avg({ selectors }).target({ legend: 'other_sys' }),
        goMemstatsGcSysBytes.avg({ selectors }).target({ legend: 'gc_sys' }),
        goMemstatsNextGcBytes.avg({ selectors }).target({ legend: 'next_gc' }),
        goMemstatsSysBytes.avg({ selectors }).target({ legend: 'sys' }),
      ),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Go GC count' }, goGcDurationSeconds.count().increase({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds (rate)', unit: units.Seconds }, goGcDurationSeconds.sum().rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds (avg)', unit: units.Seconds }, goGcDurationSeconds.avg({ selectors, by }).target()),
      // NewTimeSeriesPanel({ title: 'Go GC CPU Fraction' }, goMemstatsGcCpuFraction.sum({ selectors, by })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Lookups rate', unit: units.Short }, goMemstatsLookupsTotal.rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Mallocs rate', unit: units.Short }, goMemstatsMallocsTotal.rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Frees rate', unit: units.Short }, goMemstatsFreesTotal.rate({ selectors, by }).target()),
      NewTimeSeriesPanel({ title: 'Process Virtual Memory', unit: units.BytesSI }, processVirtualMemoryBytes.sum({ selectors, by }).target()),
    ]),
  ])
}
