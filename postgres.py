import grafanalib.core as G
from grafanalib import formatunits as UNITS

from helpers import GolangResourceUsagePanels, QueryExpr, RowPanel, TimeSeriesPanel, auto_layout, generate_dashboard


def create_heatmap_panel(title, expr, legendFormat):
    return G.Heatmap(
        title=title,
        dataSource="${datasource}",
        dataFormat="timeseries",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        gridPos=G.GridPos(h=9, w=6, x=0, y=0),
        extraJson=dict(options={}),
    )


def create_client_panels(metric_name, labels):
    labels_comma_separated = ", ".join(labels)
    labels_legend = " - ".join(f"{{{{{ label }}}}}" for label in labels)
    return [
        [
            TimeSeriesPanel("HTTP Requests Rate", [QueryExpr(f"sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SHORT),
            TimeSeriesPanel("HTTP Latency (avg)", [QueryExpr(f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated}) / sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SECONDS),
            create_heatmap_panel("HTTP Latency Histogram", [QueryExpr(f"sum(increase({metric_name}_bucket[$__rate_interval])) by (le)", "{{ le }}")]),
            TimeSeriesPanel("HTTP Latency Rate", [QueryExpr(f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated})", labels_legend)], unit=UNITS.SECONDS),
        ],
        [
            TimeSeriesPanel("HTTP Latency (99%-ile)", [QueryExpr(f"histogram_quantile(0.99, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
            TimeSeriesPanel("HTTP Latency (95%-ile)", [QueryExpr(f"histogram_quantile(0.95, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
            TimeSeriesPanel("HTTP Latency (90%-ile)", [QueryExpr(f"histogram_quantile(0.90, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
            TimeSeriesPanel("HTTP Latency (50%-ile)", [QueryExpr(f"histogram_quantile(0.50, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend)], unit=UNITS.SECONDS),
            # create_ts_panel_multiple(
            #     "HTTP Latency Percentiles",
            #     [
            #         (f"histogram_quantile(0.99, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p99"),
            #         (f"histogram_quantile(0.95, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p95"),
            #         (f"histogram_quantile(0.50, sum(rate({metric_name}_bucket[$__rate_interval])) by (le))", "p50"),
            #     ],
            #     unit=UNITS.SECONDS,
            # ),
        ],
    ]


def create_pie_panel(title, expr, legendFormat, unit=UNITS.SHORT):
    return G.PieChartv2(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        legendDisplayMode="table",
        legendPlacement="right",
        legendValues=["value", "percent"],
        unit=unit,
        gridPos=G.GridPos(h=9, w=6, x=0, y=0),
    )


error_thresholds = [G.Threshold("green", 0, 0.0), G.Threshold("red", 1, 1.0)]
my_dashboard = G.Dashboard(
    title="Postgres",
    uid="postgres",
    description="Dashboard for Postgres",
    tags=["postgres"],
    timezone="browser",
    refresh=None,
    templating=G.Templating(
        list=[
            G.Template(type="datasource", name="datasource", label="Datasource", query="prometheus"),
            G.Template(type="query", dataSource="${datasource}", name="namespace", label="Namespace", query="label_values(postgres_exporter_build_info, namespace)", includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=False, sort=G.SORT_ALPHA_DESC),
            G.Template(type="query", dataSource="${datasource}", name="job", label="Job", query='label_values(postgres_exporter_build_info{namespace=~"$namespace"}, job)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=False, sort=G.SORT_ALPHA_DESC),
        ]
    ),
    panels=auto_layout(
        [
            *RowPanel(title="Overview"),
            *RowPanel(
                title="Database Size",
                panels=[
                    [
                        create_pie_panel("Database Size", 'sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', "{{ datname }}", unit=UNITS.BYTES),
                        TimeSeriesPanel("Database Size", [QueryExpr('sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', "{{ datname }}")], unit=UNITS.BYTES),
                        TimeSeriesPanel("Locks count", [QueryExpr('sum(pg_locks_count{job=~"$job", namespace=~"$namespace"}) by (datname, mode)', "{{ datname }}")], unit=UNITS.SHORT),
                        TimeSeriesPanel("Number of backends connected", [QueryExpr('sum(pg_stat_database_numbackends{job=~"$job", namespace=~"$namespace", datname!=""}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                    ]
                ],
            ),
            *RowPanel(
                title="Activity count",
                panels=[
                    [
                        TimeSeriesPanel("Active", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="active"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                        TimeSeriesPanel("Disabled", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="disabled"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                        TimeSeriesPanel("Fastpath function call", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="fastpath function call"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                        TimeSeriesPanel("Idle", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                    ],
                    [
                        TimeSeriesPanel("Idle in transaction", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                        TimeSeriesPanel("Idle in transaction (aborted)", [QueryExpr('sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction (aborted)"}) by (datname)', "{{ datname }}")], unit=UNITS.SHORT),
                    ],
                ],
            ),
            *GolangResourceUsagePanels(title="Resource Usage (postgres-exporter)", selector='{job=~"$job", namespace=~"$namespace"}'),
        ]
    ),
).auto_panel_ids()

generate_dashboard(my_dashboard, "postgres.json")
