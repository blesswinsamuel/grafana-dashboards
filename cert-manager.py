import grafanalib.core as G
from grafanalib import formatunits as UNITS

from helpers import QueryExpr, RowPanel, TablePanel, TimeSeriesPanel, auto_layout, avg_duration_query, generate_dashboard


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
    title="Cert Manager",
    uid="cert-manager",
    description="Dashboard for cert-manager",
    tags=["cert-manager"],
    timezone="browser",
    refresh=None,
    templating=G.Templating(
        list=[
            G.Template(type="datasource", name="datasource", label="Datasource", query="prometheus"),
        ]
    ),
    panels=auto_layout(
        [
            *RowPanel(
                title="Ready status",
                defaultWidth=24,
                defaultHeight=24,
                panels=[
                    [
                        TablePanel(
                            "",
                            [
                                QueryExpr("sum(certmanager_certificate_ready_status == 1) by (issuer_group, issuer_kind, issuer_name, name, namespace, condition)", "", "discard"),
                                QueryExpr("max(certmanager_certificate_expiration_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000", "", "expiration_time"),
                                QueryExpr("max(certmanager_certificate_renewal_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000", "", "renewal_time"),
                            ],
                            columnOrder=["issuer_group", "issuer_kind", "issuer_name", "namespace", "name", "condition"],
                            excludeColumns=["Time", "Value #discard"],
                            renameColumns={"Value #expiration_time": "Expiration time", "Value #renewal_time": "Renewal time"},
                            valueMappings={"condition": {"True": ("Ready", "green"), "False": ("Not ready", "red")}},
                            unitMappings={"Expiration time": UNITS.DATE_TIME_FROM_NOW, "Renewal time": UNITS.DATE_TIME_FROM_NOW},
                            sortBy=["condition"],
                            merge=True,
                        ),
                    ],
                ],
            ),
            *RowPanel(
                title="Metrics",
                defaultWidth=12,
                panels=[
                    [
                        TimeSeriesPanel("The number of sync() calls made by a controller", [QueryExpr("sum(increase(certmanager_controller_sync_call_count[$__interval])) by (controller)", "{{ controller }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("The number of requests made by the ACME client", [QueryExpr("sum(increase(certmanager_http_acme_client_request_count[$__interval])) by (host, method, path, scheme, status)", "{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}")], unit=UNITS.SHORT, style="bars"),
                        # TimeSeriesPanel("The clock time", [QueryExpr("max(certmanager_clock_time_seconds_gauge[$__interval]) * 1000", "")], unit=UNITS.DATE_TIME_FROM_NOW),
                        TimeSeriesPanel("Expiration time", [QueryExpr("max(certmanager_certificate_expiration_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000", "{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}")], unit=UNITS.DATE_TIME_FROM_NOW),
                        TimeSeriesPanel("Renewal time", [QueryExpr("max(certmanager_certificate_renewal_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000", "{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}")], unit=UNITS.DATE_TIME_FROM_NOW),
                        TimeSeriesPanel("Avg HTTP request latencies for the ACME client", [QueryExpr(avg_duration_query("certmanager_http_acme_client_request_duration_seconds", "{}", "host, method, path, scheme, status"), "{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}")], unit=UNITS.SECONDS),
                    ],
                ],
            ),
        ]
    ),
).auto_panel_ids()

generate_dashboard(my_dashboard, "cert-manager.json")
