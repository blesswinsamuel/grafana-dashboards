import grafanalib.core as G
from grafanalib import formatunits as UNITS

from helpers import auto_layout, generate_dashboard


def TimeSeriesPanel(title, expr, legendFormat, unit=UNITS.SHORT, legendCalcs=["min", "max", "mean", "lastNotNull"], style="line"):
    # style: line, bars, points
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=[
            G.Target(expr=expr, legendFormat=legendFormat, refId="A"),
        ],
        legendDisplayMode="table",
        legendCalcs=legendCalcs,
        legendPlacement="right",
        drawStyle=style,
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


def RowPanel(title, collapsed=True, defaultWidth=24, panels=[]):
    return G.RowPanel(
        title=title,
        collapsed=collapsed,
        panels=panels,
        gridPos=G.GridPos(h=1, w=24, x=0, y=0),
    )


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
            G.Template(type="query", dataSource="${datasource}", name="job", label="Job", query='label_values(traefik_config_last_reload_success{namespace=~"$namespace"}, job)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=False, sort=G.SORT_ALPHA_DESC),
            G.Template(type="query", dataSource="${datasource}", name="instance", label="Instance", query='label_values(traefik_config_last_reload_success{namespace=~"$namespace", job=~"$job"}, instance)', includeAll=True, refresh=G.REFRESH_ON_TIME_RANGE_CHANGE, multi=True, sort=G.SORT_ALPHA_DESC),
        ]
    ),
    panels=auto_layout(
        [
            RowPanel(title="Overview"),
            RowPanel(
                title="Database Size",
                collapsed=False,
                defaultWidth=24,
                panels=[
                    [
                        TimeSeriesPanel("Service Requests", 'sum(increase(traefik_service_requests_total{job=~"$job", namespace=~"$namespace"}[$__interval])) by (service)', "{{ service }}", unit=UNITS.BYTES, style="bars"),
                    ]
                ],
            ),
        ]
    ),
).auto_panel_ids()

generate_dashboard(my_dashboard, "traefik.json")
