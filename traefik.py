import grafanalib.core as G
from grafanalib import formatunits as UNITS

from helpers import GolangResourceUsagePanels, QueryExpr, RowPanel, StatPanel, TimeSeriesPanel, auto_layout, avg_duration_query, generate_dashboard


def cleanup_service_label(query):
    return f'label_replace({query}, "service", "$1", "service", "([^-]+-[^@]+)@.*")'


error_thresholds = [G.Threshold("green", 0, 0.0), G.Threshold("red", 1, 1.0)]
my_dashboard = G.Dashboard(
    title="Traefik",
    uid="traefik",
    description="Dashboard for Traefik",
    tags=["traefik"],
    timezone="browser",
    refresh=None,
    templating=G.Templating(
        list=[
            G.Template(type="datasource", name="datasource", label="Datasource", query="prometheus"),
            G.Template(type="query", dataSource="${datasource}", name="namespace", label="Namespace", query="label_values(traefik_config_last_reload_success, namespace)", includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=False, sort=G.SORT_ALPHA_DESC),
            G.Template(type="query", dataSource="${datasource}", name="instance", label="Instance", query='label_values(traefik_config_last_reload_success{namespace=~"$namespace"}, instance)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=True, sort=G.SORT_ALPHA_DESC),
            G.Template(type="query", dataSource="${datasource}", name="entrypoint", label="Entrypoint", query='label_values(traefik_entrypoint_open_connections{namespace=~"$namespace"}, entrypoint)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=True, sort=G.SORT_ALPHA_DESC),
            G.Template(type="query", dataSource="${datasource}", name="service", label="Service", query='label_values(traefik_service_open_connections{namespace=~"$namespace"}, service)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=True, sort=G.SORT_ALPHA_DESC),
        ]
    ),
    panels=auto_layout(
        [
            *RowPanel(
                title="Overview",
                defaultWidth=4,
                panels=[
                    [
                        # StatPanel("Request Count", [QueryExpr('sum(increase(traefik_entrypoint_requests_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__range]))')], unit=UNITS.SHORT),
                        # StatPanel("Request Bytes", [QueryExpr('sum(increase(traefik_entrypoint_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__range]))')], unit=UNITS.BYTES),
                        # StatPanel("Response Bytes", [QueryExpr('sum(increase(traefik_entrypoint_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__range]))')], unit=UNITS.BYTES),
                        StatPanel("Request Count", [QueryExpr('sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))')], unit=UNITS.SHORT),
                        StatPanel("Request Bytes", [QueryExpr('sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))')], unit=UNITS.BYTES),
                        StatPanel("Response Bytes", [QueryExpr('sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))')], unit=UNITS.BYTES),
                        StatPanel("Config reloads", [QueryExpr('sum(increase(traefik_config_reloads_total{namespace=~"$namespace", instance=~"$instance"}[$__range]))')], unit=UNITS.SHORT),
                        StatPanel("Config reloads failures", [QueryExpr('sum(increase(traefik_config_reloads_failure_total{namespace=~"$namespace", instance=~"$instance"}[$__range]))')], unit=UNITS.SHORT),
                        StatPanel("Last successful config reload", [QueryExpr('max(traefik_config_last_reload_success{namespace=~"$namespace", instance=~"$instance"}[$__range]) * 1000')], unit=UNITS.DATE_TIME_FROM_NOW),
                        StatPanel("Last failed config reload", [QueryExpr('max(traefik_config_last_reload_failure{namespace=~"$namespace", instance=~"$instance"}[$__range]) * 1000')], unit=UNITS.DATE_TIME_FROM_NOW),
                    ],
                ],
            ),
            *RowPanel(
                title="Entrypoint Metrics",  # available labels: entrypoint, code, method, protocol
                defaultWidth=6,
                panels=[
                    [
                        TimeSeriesPanel("Open connections by protocol", [QueryExpr('sum(traefik_entrypoint_open_connections{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval]) by (entrypoint, protocol)', "{{ entrypoint }} - {{ protocol }}")], unit=UNITS.SHORT, w=12),
                        TimeSeriesPanel("Open connections by method", [QueryExpr('sum(traefik_entrypoint_open_connections{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval]) by (entrypoint, method)', "{{ entrypoint }} - {{ method }}")], unit=UNITS.SHORT, w=12),
                        # by entrypoint
                        TimeSeriesPanel("Request Count", [QueryExpr('sum(increase(traefik_entrypoint_requests_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', "{{ entrypoint }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("Request Bytes", [QueryExpr('sum(increase(traefik_entrypoint_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', "{{ entrypoint }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Response Bytes", [QueryExpr('sum(increase(traefik_entrypoint_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', "{{ entrypoint }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Avg request duration", [QueryExpr(cleanup_service_label(avg_duration_query("traefik_entrypoint_request_duration_seconds", '{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}', "entrypoint")), "{{ entrypoint }}")], unit=UNITS.SECONDS),
                    ],
                ],
            ),
            *RowPanel(
                title="Service Metrics",  # available labels: service, code, method, protocol
                defaultWidth=6,
                panels=[
                    [
                        TimeSeriesPanel("Open connections by service", [QueryExpr(cleanup_service_label('sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (service)'), "{{ service }}")], unit=UNITS.SHORT, w=8),
                        TimeSeriesPanel("Open connections by protocol", [QueryExpr(cleanup_service_label('sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (protocol)'), "{{ protocol }}")], unit=UNITS.SHORT, w=8),
                        TimeSeriesPanel("Open connections by method", [QueryExpr(cleanup_service_label('sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (method)'), "{{ method }}")], unit=UNITS.SHORT, w=8),
                        # by service
                        TimeSeriesPanel("Request Count by service", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)'), "{{ service }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("Request Bytes by service", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)'), "{{ service }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Response Bytes by service", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)'), "{{ service }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Avg request duration by service", [QueryExpr(cleanup_service_label(avg_duration_query("traefik_service_request_duration_seconds", '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', "service")), "{{ service }}")], unit=UNITS.SECONDS),
                        # by protocol
                        TimeSeriesPanel("Request Count by protocol", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)'), "{{ protocol }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("Request Bytes by protocol", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)'), "{{ protocol }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Response Bytes by protocol", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)'), "{{ protocol }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Avg request duration by protocol", [QueryExpr(cleanup_service_label(avg_duration_query("traefik_service_request_duration_seconds", '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', "protocol")), "{{ protocol }}")], unit=UNITS.SECONDS),
                        # by method
                        TimeSeriesPanel("Request Count by method", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)'), "{{ method }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("Request Bytes by method", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)'), "{{ method }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Response Bytes by method", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)'), "{{ method }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Avg request duration by method", [QueryExpr(cleanup_service_label(avg_duration_query("traefik_service_request_duration_seconds", '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', "method")), "{{ method }}")], unit=UNITS.SECONDS),
                        # by code
                        TimeSeriesPanel("Request Count by code", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)'), "{{ code }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("Request Bytes by code", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)'), "{{ code }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Response Bytes by code", [QueryExpr(cleanup_service_label('sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)'), "{{ code }}")], unit=UNITS.BYTES, style="bars"),
                        TimeSeriesPanel("Avg request duration by code", [QueryExpr(cleanup_service_label(avg_duration_query("traefik_service_request_duration_seconds", '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', "code")), "{{ code }}")], unit=UNITS.SECONDS),
                    ],
                ],
            ),
            *RowPanel(
                title="TLS Metrics",
                collapsed=True,
                defaultWidth=12,
                panels=[
                    [
                        TimeSeriesPanel("TLS requests", [QueryExpr('sum(increase(traefik_service_requests_tls_total{namespace=~"$namespace", instance=~"$instance"}[$__interval])) by (service, tls_cipher, version)', "{{ service }} {{ tls_cipher }} {{ version }}")], unit=UNITS.SHORT, style="bars"),
                        TimeSeriesPanel("TLS certs expiration timestamp", [QueryExpr('max(traefik_tls_certs_not_after{namespace=~"$namespace", instance=~"$instance"}) by (cn, sans, serial) * 1000', "{{ cn }} {{ sans }} {{ serial }}")], unit=UNITS.DATE_TIME_FROM_NOW),
                    ],
                ],
            ),
            *GolangResourceUsagePanels(selector='{namespace=~"$namespace", instance=~"$instance"}'),
        ]
    ),
).auto_panel_ids()

generate_dashboard(my_dashboard, "traefik.json")
