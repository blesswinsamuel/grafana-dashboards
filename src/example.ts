import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import {
  NewPanelGroup,
  NewPanelRow,
  NewPrometheusDatasource as NewPrometheusDatasourceVariable,
  NewTimeSeriesPanel,
  PanelGroup,
  PanelRowAndGroups,
  Unit,
  autoLayout,
  writeDashboardAndPostToGrafana,
} from './grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const panels: PanelRowAndGroups = [
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({
      title: 'Cache Files Count',
      targets: [{ expr: 'sum by (cache_path) (media_proxy_cache_fs_files_count)', legendFormat: '{{cache_path}}' }],
      defaultUnit: Unit.SHORT,
    }),
    NewTimeSeriesPanel({
      title: 'Cache Files Bytes',
      targets: [{ expr: 'sum by (cache_path) (media_proxy_cache_fs_size_bytes)', legendFormat: '{{cache_path}}' }],
      defaultUnit: Unit.BYTES_SI,
    }),
    NewTimeSeriesPanel({
      title: 'Loader Downloaded Bytes',
      targets: [{ expr: 'sum(increase(media_proxy_loader_response_size_bytes_sum))', legendFormat: 'value' }],
      defaultUnit: Unit.BYTES_SI,
    }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({
      title: 'Vips Memory Usage Bytes',
      targets: [{ expr: 'sum(media_proxy_vips_memory_bytes)', legendFormat: 'value' }],
      defaultUnit: Unit.BYTES_SI,
    }),
    NewTimeSeriesPanel({
      title: 'Vips Memory HighWater Bytes',
      targets: [{ expr: 'sum(media_proxy_vips_memory_highwater_bytes)', legendFormat: 'value' }],
      defaultUnit: Unit.BYTES_SI,
    }),
    NewTimeSeriesPanel({
      title: 'Vips Memory Alloc Bytes',
      targets: [{ expr: 'sum(media_proxy_vips_memory_allocs)', legendFormat: 'value' }],
      defaultUnit: Unit.BYTES_SI,
    }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({
      title: 'Vips Memory Files',
      targets: [{ expr: 'sum(media_proxy_vips_memory_files)', legendFormat: 'value' }],
      defaultUnit: Unit.BYTES_SI,
    }),
    NewTimeSeriesPanel({
      title: 'Vips Operation Count',
      targets: [{ expr: 'sum by (operation) (media_proxy_vips_operation_count)', legendFormat: '{{ operation }}' }],
      defaultUnit: Unit.SHORT,
    }),
  ]),
  NewGoRuntimeMetrics({ datasource, selector: '{job="media-proxy"}' }),
]

function NewGoRuntimeMetrics({ datasource, selector = '' }: { datasource?: DataSourceRef; selector?: string }): PanelGroup {
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

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for media-proxy',
  graphTooltip: DashboardCursorSync.Crosshair,
  style: 'dark',
  tags: ['media-proxy'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Media Proxy',
  uid: 'media-proxy',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' })],
  },
}

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: 'media-proxy.json',
})
