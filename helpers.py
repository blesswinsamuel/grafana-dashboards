import json
from os import getenv

import grafanalib.core as G
import requests
from grafanalib._gen import DashboardEncoder


def auto_layout(rows):
    def auto_layout_inner(rows, y=0):
        r = []
        for row in rows:
            panels = row
            if isinstance(row, G.RowPanel):
                panels = [row]
                row.gridPos = G.GridPos(h=1, w=24, x=0, y=0)

            maxh = 0
            x = 0
            for panel in panels:
                panel.gridPos.x = x
                panel.gridPos.y = y

                if panel.gridPos.h > maxh:
                    maxh = panel.gridPos.h

                x += panel.gridPos.w
                r += [panel]

            y += maxh

            if isinstance(row, G.RowPanel):
                if row.collapsed:
                    row.panels, y = auto_layout_inner(row.panels, y)
                else:
                    panels, y = auto_layout_inner(row.panels, y)
                    row.panels = []
                    r += panels
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
