import grafanalib.core as G
from grafanalib import formatunits as UNITS

from helpers import auto_layout, generate_dashboard


def stat_panel_value(title, expr, unit, thresholds=[G.Threshold("green", 0, 0.0)]):
    return G.Stat(
        title=title,
        dataSource="${datasource}",
        transparent=True,
        targets=[
            G.Target(expr=expr, refId="A"),
        ],
        textMode="value",
        format=unit,
        graphMode="area",
        reduceCalc="lastNotNull",
        gridPos=G.GridPos(h=3, w=3, x=0, y=0),
        thresholds=thresholds,
    )


def stat_panel_name(title, expr, legendFormat):
    return G.Stat(
        title=title,
        dataSource="${datasource}",
        transparent=True,
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A", instant=True),
        ],
        textMode="name",
        gridPos=G.GridPos(h=3, w=3, x=0, y=0),
    )


def create_ts_panel(title, expr, legendFormat, unit=UNITS.SHORT, legendCalcs=["min", "max", "mean", "lastNotNull"]):
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        legendDisplayMode="table",
        legendCalcs=legendCalcs,
        legendPlacement="right",
        unit=unit,
        gridPos=G.GridPos(h=9, w=6, x=0, y=0),
        extraJson=dict(
            fieldConfig=dict(defaults=dict(min=0)),
            options=dict(
                legend=dict(
                    sortBy="Last *",
                    sortDesc=True,
                ),
            ),
        ),
    )


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


def create_ts_panel_multiple(title, exprs, unit=UNITS.SHORT):
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(
                expr="" + expr,
                legendFormat="" + legendFormat,
                refId=chr(ord("A") + i),
            )
            for (i, (expr, legendFormat)) in enumerate(exprs)
        ],
        legendDisplayMode="table",
        legendCalcs=["mean", "lastNotNull"],
        unit=unit,
        extraJson=dict(fieldConfig=dict(defaults=dict(min=0))),
        gridPos=G.GridPos(h=8, w=6, x=0, y=0),
    )


def create_count_panel(title, expr, legendFormat, unit=UNITS.SHORT):
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        drawStyle="bars",
        fillOpacity=100,
        legendDisplayMode="table",
        legendCalcs=["sum", "lastNotNull"],
        stacking={"mode": "normal", "group": "A"},
        unit=unit,
        gridPos=G.GridPos(h=8, w=6, x=0, y=0),
        extraJson=dict(
            fieldConfig=dict(defaults=dict(min=0)),
        ),
    )


def resource_usage_panel(title, exprs, unit, w=5):
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=list(
            [
                G.Target(
                    expr="" + expr,
                    legendFormat="" + legendFormat,
                    refId=chr(ord("A") + i),
                )
                for (i, (expr, legendFormat)) in enumerate(exprs)
            ]
        ),
        legendDisplayMode="table",
        legendCalcs=["mean", "lastNotNull"],
        unit=unit,
        gridPos=G.GridPos(h=8, w=w, x=0, y=0),
        extraJson=dict(fieldConfig=dict(defaults=dict(min=0))),
    )


def stats_ts_panel(title, expr, legendFormat, unit, legendCalcs=["lastNotNull"]):
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        legendDisplayMode="table",
        legendCalcs=legendCalcs,
        unit=unit,
        gridPos=G.GridPos(h=9, w=6, x=0, y=0),
    )


def create_client_panels(metric_name, labels):
    labels_comma_separated = ", ".join(labels)
    labels_legend = " - ".join(f"{{{{{ label }}}}}" for label in labels)
    return [
        [
            create_ts_panel("HTTP Requests Rate", f"sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend, unit=UNITS.SHORT),
            create_ts_panel("HTTP Latency (avg)", f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated}) / sum(rate({metric_name}_count[$__rate_interval])) by ({labels_comma_separated})", labels_legend, unit=UNITS.SECONDS),
            create_heatmap_panel("HTTP Latency Histogram", f"sum(increase({metric_name}_bucket[$__rate_interval])) by (le)", "{{ le }}"),
            create_ts_panel("HTTP Latency Rate", f"sum(rate({metric_name}_sum[$__rate_interval])) by ({labels_comma_separated})", labels_legend, unit=UNITS.SECONDS),
        ],
        [
            create_ts_panel("HTTP Latency (99%-ile)", f"histogram_quantile(0.99, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend, unit=UNITS.SECONDS),
            create_ts_panel("HTTP Latency (95%-ile)", f"histogram_quantile(0.95, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend, unit=UNITS.SECONDS),
            create_ts_panel("HTTP Latency (90%-ile)", f"histogram_quantile(0.90, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend, unit=UNITS.SECONDS),
            create_ts_panel("HTTP Latency (50%-ile)", f"histogram_quantile(0.50, sum(rate({metric_name}_bucket[$__rate_interval])) by (le, {labels_comma_separated}))", labels_legend, unit=UNITS.SECONDS),
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
    uid="postgres-metrics",
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
            G.RowPanel(title="Overview"),
            G.RowPanel(
                title="Database Size",
                collapsed=False,
                panels=[
                    [
                        create_pie_panel("Database Size", 'sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', "{{ datname }}", unit=UNITS.BYTES),
                        create_ts_panel("Database Size", 'sum(pg_database_size_bytes{job=~"$job", namespace=~"$namespace"}) by (datname)', "{{ datname }}", unit=UNITS.BYTES),
                        create_ts_panel("Locks count", 'sum(pg_locks_count{job=~"$job", namespace=~"$namespace"}) by (datname, mode)', "{{ datname }}", unit=UNITS.SHORT),
                        create_ts_panel("Number of backends connected", 'sum(pg_stat_database_numbackends{job=~"$job", namespace=~"$namespace", datname!=""}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                    ]
                ],
            ),
            G.RowPanel(
                title="Activity count",
                collapsed=False,
                panels=[
                    [
                        create_ts_panel("Active", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="active"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                        create_ts_panel("Disabled", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="disabled"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                        create_ts_panel("Fastpath function call", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="fastpath function call"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                        create_ts_panel("Idle", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                    ],
                    [
                        create_ts_panel("Idle in transaction", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                        create_ts_panel("Idle in transaction (aborted)", 'sum(pg_stat_activity_count{job=~"$job", namespace=~"$namespace", state="idle in transaction (aborted)"}) by (datname)', "{{ datname }}", unit=UNITS.SHORT),
                    ],
                ],
            ),
            G.RowPanel(title="Resource Usage (postgres-exporter)"),
            [
                resource_usage_panel("File Descriptors", [('process_open_fds{job=~"$job", namespace=~"$namespace"}', "{{ pod }}")], UNITS.SHORT, w=4),
                resource_usage_panel("CPU Usage", [('rate(process_cpu_seconds_total{job=~"$job", namespace=~"$namespace"}[$__rate_interval])', "{{ pod }}")], UNITS.SHORT),
                resource_usage_panel("Memory Usage", [('process_resident_memory_bytes{job=~"$job", namespace=~"$namespace"}', "{{ pod }}")], UNITS.BYTES),
                resource_usage_panel("Stack Memory Usage", [('avg(go_memstats_stack_sys_bytes{job=~"$job", namespace=~"$namespace"})', "sys"), ('avg(go_memstats_stack_inuse_bytes{job=~"$job", namespace=~"$namespace"})', "inuse")], UNITS.BYTES),
                resource_usage_panel(
                    "Heap Memory Usage",
                    [
                        ('avg(go_memstats_heap_sys_bytes{job=~"$job", namespace=~"$namespace"})', "sys"),
                        ('avg(go_memstats_heap_idle_bytes{job=~"$job", namespace=~"$namespace"})', "idle"),
                        ('avg(go_memstats_heap_released_bytes{job=~"$job", namespace=~"$namespace"})', "released"),
                        ('avg(go_memstats_next_gc_bytes{job=~"$job", namespace=~"$namespace"})', "next_gc"),
                        ('avg(go_memstats_heap_inuse_bytes{job=~"$job", namespace=~"$namespace"})', "inuse"),
                        ('avg(go_memstats_heap_alloc_bytes{job=~"$job", namespace=~"$namespace"})', "alloc"),
                    ],
                    UNITS.BYTES,
                ),
            ],
            [
                resource_usage_panel("Goroutines", [('go_goroutines{job=~"$job", namespace=~"$namespace"}', "{{ pod }}")], UNITS.SHORT, w=4),
                resource_usage_panel("Go Alloc Rate", [('rate(go_memstats_alloc_bytes_total{job=~"$job", namespace=~"$namespace"}[$__rate_interval])', "{{ pod }}")], UNITS.BYTES_SEC),
                resource_usage_panel("Go Alloc", [('go_memstats_alloc_bytes{job=~"$job", namespace=~"$namespace"}', "{{ pod }}")], UNITS.BYTES),
                resource_usage_panel("Go GC Per Second", [('rate(go_gc_duration_seconds_count{job=~"$job", namespace=~"$namespace"}[$__rate_interval])', "{{ pod }}")], UNITS.SHORT),
                resource_usage_panel("Go GC Duration", [('rate(go_gc_duration_seconds_sum{job=~"$job", namespace=~"$namespace"}[$__rate_interval])', "{{ pod }}")], UNITS.SECONDS),
            ],
            [
                resource_usage_panel("Threads", [('go_threads{job=~"$job", namespace=~"$namespace"}', "{{ pod }}")], UNITS.SHORT, w=4),
                resource_usage_panel(
                    "Heap Objects",
                    [
                        ('avg(go_memstats_heap_objects{job=~"$job", namespace=~"$namespace"})', "objects"),
                    ],
                    UNITS.BYTES,
                ),
                stat_panel_name("Go Info", 'go_info{job=~"$job", namespace=~"$namespace"}', "{{ version }}"),
                stat_panel_value("Last GC time", 'go_memstats_last_gc_time_seconds{job=~"$job", namespace=~"$namespace"} * 1000', unit=UNITS.DATE_TIME_FROM_NOW),
            ],
        ]
    ),
).auto_panel_ids()

generate_dashboard(my_dashboard, "postgres.json")
