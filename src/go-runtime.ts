import { DataSourceRef } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'

export function NewGoRuntimeMetrics({ datasource, selector = '' }: { datasource?: DataSourceRef; selector?: string }): PanelGroup {
  return NewPanelGroup({ title: 'Go Runtime Metrics' }, [
    NewPanelRow({ datasource, height: 8 }, [
      // NewTimeSeriesPanel({
      //   type: 'bar',
      //   title: 'Go GC Pause Seconds',
      //   targets: [{ expr: `sum by (pod) (increase(go_gc_duration_seconds_sum${selector}[$__interval]))`, legendFormat: '{{ pod }}' }],
      //   defaultUnit: Unit.SECONDS,
      // }),
      // NewTimeSeriesPanel({
      //   type: 'bar',
      //   title: 'Go GC Pause Count',
      //   targets: [{ expr: `sum by (pod) (increase(go_gc_duration_seconds_count${selector}[$__interval]))`, legendFormat: '{{ pod }}' }],
      //   defaultUnit: Unit.SHORT,
      // }),
      NewTimeSeriesPanel({
        title: 'File Descriptors',
        targets: [{ expr: `sum by (pod) (process_open_fds${selector})`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
      NewTimeSeriesPanel({
        title: 'CPU Usage',
        targets: [{ expr: `sum by (pod) (rate(process_cpu_seconds_total${selector}[$__rate_interval]))`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
      NewTimeSeriesPanel({
        title: 'Memory Usage',
        targets: [{ expr: `sum by (pod) (process_resident_memory_bytes${selector}[$__rate_interval])`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Stack Memory Usage',
        targets: [
          { expr: `avg(go_memstats_stack_sys_bytes${selector})`, legendFormat: 'sys' },
          { expr: `avg(go_memstats_stack_inuse_bytes${selector})`, legendFormat: 'inuse' },
        ],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Heap Memory Usage',
        targets: [
          { expr: `avg(go_memstats_heap_sys_bytes${selector})`, legendFormat: 'sys' },
          { expr: `avg(go_memstats_heap_idle_bytes${selector})`, legendFormat: 'idle' },
          { expr: `avg(go_memstats_heap_released_bytes${selector})`, legendFormat: 'released' },
          { expr: `avg(go_memstats_next_gc_bytes${selector})`, legendFormat: 'next_gc' },
          { expr: `avg(go_memstats_heap_inuse_bytes${selector})`, legendFormat: 'inuse' },
          { expr: `avg(go_memstats_heap_alloc_bytes${selector})`, legendFormat: 'alloc' },
        ],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Heap Objects',
        targets: [{ expr: `avg by (pod) (go_memstats_heap_objects${selector})`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({
        title: 'Threads',
        targets: [{ expr: `sum by (pod) (go_threads${selector})`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
      NewTimeSeriesPanel({
        title: 'Goroutines',
        targets: [{ expr: `sum by (pod) (go_goroutines${selector})`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
      NewTimeSeriesPanel({
        title: 'Go Alloc Rate',
        targets: [{ expr: `sum by (pod) (rate(go_memstats_alloc_bytes_total${selector}[$__rate_interval]))`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Go Alloc Bytes',
        targets: [{ expr: `sum by (pod) (go_memstats_alloc_bytes${selector})`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.BYTES_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Go GC Per Second',
        targets: [{ expr: `sum by (pod) (rate(go_gc_duration_seconds_count${selector}[$__rate_interval]))`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SHORT,
      }),
      NewTimeSeriesPanel({
        title: 'Go GC Duration Seconds',
        targets: [{ expr: `sum by (pod) (rate(go_gc_duration_seconds_sum${selector}[$__rate_interval]))`, legendFormat: '{{ pod }}' }],
        defaultUnit: Unit.SECONDS,
      }),
    ]),
  ])
}
