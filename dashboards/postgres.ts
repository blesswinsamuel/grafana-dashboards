// def create_heatmap_panel(title, expr, legendFormat):
//     return G.Heatmap(
//         title=title,
//         dataSource="${datasource}",
//         dataFormat="timeseries",
//         targets=[
//             G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
//         ],
//         gridPos=G.GridPos(h=9, w=6, x=0, y=0),
//         extraJson=dict(options={}),
//     )

// def create_client_panels(metric_name, labels):
//     labels_comma_separated = ", ".join(labels)
//     labels_legend = " - ".join(f"{{{{{ label }}}}}" for label in labels)
//     return [
//         [
//             TimeSeriesPanel("HTTP Requests Rate", [QueryExpr(f"sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SHORT),
//             TimeSeriesPanel("HTTP Latency (avg)", [QueryExpr(f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated}) / sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SECONDS),
//             create_heatmap_panel("HTTP Latency Histogram", [QueryExpr(f"sum(increase({metric_name}_bucket[$__rate_interval])) by (le)", "{{ le }}")]),
//             TimeSeriesPanel("HTTP Latency Rate", [QueryExpr(f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SECONDS),
//         ],
//         [
//             TimeSeriesPanel("HTTP Latency (99%-ile)", [QueryExpr(f"histogram_quantile(0.99, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
//             TimeSeriesPanel("HTTP Latency (95%-ile)", [QueryExpr(f"histogram_quantile(0.95, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
//             TimeSeriesPanel("HTTP Latency (90%-ile)", [QueryExpr(f"histogram_quantile(0.90, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
//             TimeSeriesPanel("HTTP Latency (50%-ile)", [QueryExpr(f"histogram_quantile(0.50, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
//             # create_ts_panel_multiple(
//             #     "HTTP Latency Percentiles",
//             #     [
//             #         (f"histogram_quantile(0.99, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p99"),
//             #         (f"histogram_quantile(0.95, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p95"),
//             #         (f"histogram_quantile(0.50, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p50"),
//             #     ],
//             #     unit=UNITS.SECONDS,
//             # ),
//         ],
//     ]

import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewGoRuntimeMetrics, NewPanelGroup, NewPanelRow, NewPieChartPanel, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Database Size' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewPieChartPanel({ title: 'Database Size', targets: [{ expr: 'sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.BYTES_SI }),
      NewTimeSeriesPanel({ title: 'Database Size', targets: [{ expr: 'sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.BYTES_SI }),
      NewTimeSeriesPanel({ title: 'Locks Count', targets: [{ expr: 'sum(pg_locks_count{job=~"$job", namespace=~"$namespace"}) by (datname, mode) > 0', legendFormat: '{{ datname }} - {{ mode }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Number of backends connected', targets: [{ expr: 'sum(pg_stat_database_numbackends{job=~"$job", namespace=~"$namespace", datname!=""}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
    ]),
  ]),
  NewPanelGroup({ title: 'Activity count' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Active', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="active"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Disabled', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="disabled"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Fastpath function call', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="fastpath function call"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Idle', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Idle in transaction', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Idle in transaction (aborted)', targets: [{ expr: 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction (aborted)"}) by (datname)', legendFormat: '{{ datname }}' }], defaultUnit: Unit.SHORT }),
    ]),
  ]),
  NewGoRuntimeMetrics({ datasource, title: 'Resource Usage (postgres-exporter)', selector: '{job=~"$job", namespace=~"$namespace"}' }),
]

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for postgres',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['postgres'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Postgres',
  uid: 'postgres',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }), NewQueryVariable({ datasource, name: 'namespace', label: 'Namespace', query: 'label_values(postgres_exporter_build_info, namespace)' }), NewQueryVariable({ datasource, name: 'job', label: 'Job', query: 'label_values(postgres_exporter_build_info{namespace=~"$namespace"}, job)', includeAll: true, multi: true })],
  },
}

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: path.join(__dirname, 'dist', 'postgres.json'),
})
