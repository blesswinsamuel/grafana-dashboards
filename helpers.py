import json
from dataclasses import dataclass
from os import getenv
from typing import List

import grafanalib.core as G
import requests
from grafanalib import formatunits as UNITS
from grafanalib._gen import DashboardEncoder


def auto_layout(rows):
    def auto_layout_inner(rows, y=0):
        r = []
        for row in rows:
            panels = row
            if isinstance(row, G.RowPanel):
                panels = [row]

            maxh = 0
            x = 0
            for panel in panels:
                if x + 1 > 24:
                    # print("WARNING: Panel width exceeds 24")
                    x = 0
                    y += maxh
                    maxh = 0
                panel.gridPos.x = x
                panel.gridPos.y = y

                if panel.gridPos.h > maxh:
                    maxh = panel.gridPos.h

                x += panel.gridPos.w
                r += [panel]

            y += maxh

            if isinstance(row, G.RowPanel):
                row.panels, y = auto_layout_inner(row.panels, y)
        return r, y

    r, _ = auto_layout_inner(rows)
    return r


def get_dashboard_json_for_upload(dashboard, overwrite=False, message="Updated by grafanlib"):
    json_data = dashboard.to_json_data()
    json_data["uid"] += "-debug"
    json_data["title"] += " Debug"
    return json.dumps(
        {
            "dashboard": json_data,
            "overwrite": overwrite,
            "message": message,
        },
        sort_keys=True,
        indent=2,
        cls=DashboardEncoder,
    )


def get_dashboard_json_for_file(dashboard):
    return json.dumps(
        dashboard.to_json_data(),
        sort_keys=True,
        indent=2,
        cls=DashboardEncoder,
    )


def generate_dashboard(
    dashboard,
    filename,
):
    # Setting GRAFANA_URL is optional. If set, the dashboard will be uploaded to the specified grafana server for easier development.
    grafana_url = getenv("GRAFANA_URL", "")

    def upload_to_grafana(dashboard_data, verify=True):
        headers = {"Content-Type": "application/json"}
        session = requests.Session()
        r = session.post(
            f"{grafana_url}/api/dashboards/db",
            data=dashboard_data,
            headers=headers,
            verify=verify,
        )
        print(f"{r.status_code} - {r.content}")

    with open(filename, "w") as f:
        my_dashboard_json = get_dashboard_json_for_file(dashboard)
        f.write(my_dashboard_json)
        print(f"Dashboard saved to {filename}")

    if grafana_url != "":
        print("Uploading dashboard to grafana...")
        my_dashboard_json = get_dashboard_json_for_upload(dashboard, overwrite=True)
        upload_to_grafana(my_dashboard_json, verify=False)


@dataclass
class QueryExpr:
    expr: str
    legendFormat: str = ""
    refId: str = None


def _get_targets(exprs: List[QueryExpr]):
    return [
        G.Target(
            expr="" + qe.expr,
            legendFormat="" + qe.legendFormat,
            refId=qe.refId if qe.refId else chr(ord("A") + i),
        )
        for (i, qe) in enumerate(exprs)
    ]


def StatPanel(title, exprs, unit=None, thresholds=None, mode="value"):
    # mode: 'auto' 'name' 'none' 'value' 'value_and_name'
    zero_to_dash_mapping = {"type": "value", "options": {"0": {"text": "-", "index": 0}}}
    mappings = []
    if unit == UNITS.DATE_TIME_FROM_NOW:
        mappings += [zero_to_dash_mapping]
    reduceCalc = None
    graphMode = None
    if mode == "value":
        reduceCalc = "lastNotNull"
        graphMode = "area"
        if thresholds is None:
            thresholds = [G.Threshold("green", 0, 0.0)]
    return G.Stat(
        title=title,
        dataSource="${datasource}",
        transparent=True,
        targets=_get_targets(exprs),
        textMode=mode,
        format=unit,
        graphMode=graphMode,
        reduceCalc=reduceCalc,
        gridPos=G.GridPos(h=0, w=0, x=0, y=0),
        thresholds=thresholds,
        mappings=mappings,
    )


def TimeSeriesPanel(title, exprs: List[QueryExpr], unit=UNITS.SHORT, legendCalcs=None, style="line", w=0, legendPlacement="right", axisMin=0):
    maxDataPoints = 100
    fillOpacity = 0
    sortBy = "Last *"
    stacking = {}
    if style == "line":
        if legendCalcs is None:
            legendCalcs = ["min", "max", "mean", "lastNotNull"]
            sortBy = "Last *"
        fillOpacity = 5
    if style == "bars":
        if legendCalcs is None:
            legendCalcs = ["sum"]
            sortBy = "Total"
        maxDataPoints = 60
        fillOpacity = 30
        stacking = {"mode": "normal", "group": "A"}
    # style: line, bars, points
    return G.TimeSeries(
        title=title,
        dataSource="${datasource}",
        targets=_get_targets(exprs),
        legendDisplayMode="table",
        legendCalcs=legendCalcs,
        legendPlacement=legendPlacement,
        drawStyle=style,
        unit=unit,
        fillOpacity=fillOpacity,
        maxDataPoints=maxDataPoints,
        gridPos=G.GridPos(w=w, h=0, x=0, y=0),
        stacking=stacking,
        extraJson=dict(
            fieldConfig=dict(defaults=dict(min=axisMin)),
            options=dict(
                legend=dict(
                    sortBy=sortBy,
                    sortDesc=True,
                ),
            ),
        ),
    )


def RowPanel(title, collapsed=False, defaultWidth=6, defaultHeight=9, panels=[]):
    for row in panels:
        for panel in row:
            if panel.gridPos.w == 0:
                panel.gridPos.w = defaultWidth
            if panel.gridPos.h == 0:
                panel.gridPos.h = defaultHeight
    if collapsed:
        return [
            G.RowPanel(
                title=title,
                collapsed=collapsed,
                panels=panels,
                gridPos=G.GridPos(h=1, w=24, x=0, y=0),
            ),
        ]
    else:
        return [
            G.RowPanel(
                title=title,
                collapsed=collapsed,
                gridPos=G.GridPos(h=1, w=24, x=0, y=0),
            ),
            *panels,
        ]


def GolangResourceUsagePanels(title="Resource Usage", selector=""):
    return RowPanel(
        title=title,
        defaultWidth=5,
        panels=[
            [
                TimeSeriesPanel("File Descriptors", [QueryExpr(f"process_open_fds{selector}", "{{ pod }}")], UNITS.SHORT, w=4, legendPlacement="bottom"),
                TimeSeriesPanel("CPU Usage", [QueryExpr(f"rate(process_cpu_seconds_total{selector}[$__rate_interval])", "{{ pod }}")], UNITS.SHORT, legendPlacement="bottom"),
                TimeSeriesPanel("Memory Usage", [QueryExpr(f"process_resident_memory_bytes{selector}", "{{ pod }}")], UNITS.BYTES, legendPlacement="bottom"),
                TimeSeriesPanel("Stack Memory Usage", [QueryExpr(f"avg(go_memstats_stack_sys_bytes{selector})", "sys"), QueryExpr(f"avg(go_memstats_stack_inuse_bytes{selector})", "inuse")], UNITS.BYTES, legendPlacement="bottom"),
                TimeSeriesPanel(
                    "Heap Memory Usage",
                    [
                        QueryExpr(f"avg(go_memstats_heap_sys_bytes{selector})", "sys"),
                        QueryExpr(f"avg(go_memstats_heap_idle_bytes{selector})", "idle"),
                        QueryExpr(f"avg(go_memstats_heap_released_bytes{selector})", "released"),
                        QueryExpr(f"avg(go_memstats_next_gc_bytes{selector})", "next_gc"),
                        QueryExpr(f"avg(go_memstats_heap_inuse_bytes{selector})", "inuse"),
                        QueryExpr(f"avg(go_memstats_heap_alloc_bytes{selector})", "alloc"),
                    ],
                    UNITS.BYTES,
                    legendPlacement="bottom",
                ),
            ],
            [
                TimeSeriesPanel("Goroutines", [QueryExpr(f"go_goroutines{selector}", "{{ pod }}")], UNITS.SHORT, w=4, legendPlacement="bottom"),
                TimeSeriesPanel("Go Alloc Rate", [QueryExpr(f"rate(go_memstats_alloc_bytes_total{selector}[$__rate_interval])", "{{ pod }}")], UNITS.BYTES_SEC, legendPlacement="bottom"),
                TimeSeriesPanel("Go Alloc", [QueryExpr(f"go_memstats_alloc_bytes{selector}", "{{ pod }}")], UNITS.BYTES, legendPlacement="bottom"),
                TimeSeriesPanel("Go GC Per Second", [QueryExpr(f"rate(go_gc_duration_seconds_count{selector}[$__rate_interval])", "{{ pod }}")], UNITS.SHORT, legendPlacement="bottom"),
                TimeSeriesPanel("Go GC Duration", [QueryExpr(f"rate(go_gc_duration_seconds_sum{selector}[$__rate_interval])", "{{ pod }}")], UNITS.SECONDS, legendPlacement="bottom"),
            ],
            [
                TimeSeriesPanel("Threads", [QueryExpr(f"go_threads{selector}", "{{ pod }}")], UNITS.SHORT, w=4, legendPlacement="bottom"),
                TimeSeriesPanel("Heap Objects", [QueryExpr(f"avg(go_memstats_heap_objects{selector}) by (pod)", "{{ pod }}")], UNITS.SHORT, legendPlacement="bottom"),
                # stat_panel_name("Go Info", f'go_info{selector}', "{{ version }}"),
                # stat_panel_value("Last GC time", f'go_memstats_last_gc_time_seconds{selector} * 1000', unit=UNITS.DATE_TIME_FROM_NOW),
            ],
        ],
    )
