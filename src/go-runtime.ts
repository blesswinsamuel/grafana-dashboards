import { DataSourceRef } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'

export function NewGoRuntimeMetrics({ datasource, title, selector = '', podLabel = 'pod', collapsed }: { datasource?: DataSourceRef; title?: string; selector?: string; podLabel?: string; collapsed?: boolean }): PanelGroup {
  return NewPanelGroup({ title: title ?? 'Go Runtime Metrics', collapsed }, [
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
      NewTimeSeriesPanel({ title: 'File Descriptors', targets: [{ expr: `sum by (${podLabel}, instance) (process_open_fds${selector})`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'CPU Usage', targets: [{ expr: `sum by (${podLabel}, instance) (rate(process_cpu_seconds_total${selector}[$__rate_interval]))`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Memory Usage', targets: [{ expr: `sum by (${podLabel}, instance) (process_resident_memory_bytes${selector}[$__rate_interval])`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.BYTES_SI }),
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
      NewTimeSeriesPanel({ title: 'Heap Objects', targets: [{ expr: `avg by (${podLabel}, instance) (go_memstats_heap_objects${selector})`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Threads', targets: [{ expr: `sum by (${podLabel}, instance) (go_threads${selector})`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Goroutines', targets: [{ expr: `sum by (${podLabel}, instance) (go_goroutines${selector})`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Go Alloc Rate', targets: [{ expr: `sum by (${podLabel}, instance) (rate(go_memstats_alloc_bytes_total${selector}[$__rate_interval]))`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.BYTES_PER_SEC_SI }),
      NewTimeSeriesPanel({ title: 'Go Alloc Bytes', targets: [{ expr: `sum by (${podLabel}, instance) (go_memstats_alloc_bytes${selector})`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.BYTES_SI }),
      NewTimeSeriesPanel({ title: 'Go GC Per Second', targets: [{ expr: `sum by (${podLabel}, instance) (rate(go_gc_duration_seconds_count${selector}[$__rate_interval]))`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Go GC Duration Seconds', targets: [{ expr: `sum by (${podLabel}, instance) (rate(go_gc_duration_seconds_sum${selector}[$__rate_interval]))`, legendFormat: `{{ ${podLabel} }} - {{ instance }}` }], defaultUnit: Unit.SECONDS }),
    ]),
    // # stat_panel_name("Go Info", f'go_info{selector}', "{{ version }}"),
    // # stat_panel_value("Last GC time", f'go_memstats_last_gc_time_seconds{selector} * 1000', unit=UNITS.DATE_TIME_FROM_NOW),
  ])
}
