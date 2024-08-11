import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, averageDurationQuery, overridesMatchByName, tableIndexByName, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Ready status' }, [
    NewPanelRow({ datasource, height: 24 }, [
      NewTablePanel({
        title: 'Ready status',
        targets: [
          { expr: 'sum(certmanager_certificate_ready_status == 1) by (issuer_group, issuer_kind, issuer_name, name, namespace, condition)', refId: 'discard', format: 'table', type: 'instant' },
          { expr: 'max(certmanager_certificate_expiration_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', refId: 'expiration_time', format: 'table', type: 'instant' },
          { expr: 'max(certmanager_certificate_renewal_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', refId: 'renewal_time', format: 'table', type: 'instant' },
        ],
        overrides: overridesMatchByName({
          condition: {
            mappings: [
              {
                options: {
                  False: { color: 'red', index: 1, text: 'Not ready' },
                  True: { color: 'green', index: 0, text: 'Ready' },
                },
                type: 'value',
              },
            ],
          },
          'Expiration time': { unit: Unit.DATE_TIME_FROM_NOW },
          'Renewal time': { unit: Unit.DATE_TIME_FROM_NOW },
        }),
        transformations: [
          { id: 'merge', options: {} },
          {
            id: 'organize',
            options: {
              indexByName: tableIndexByName(['issuer_group', 'issuer_kind', 'issuer_name', 'namespace', 'name', 'condition']),
              excludeByName: { Time: true, 'Value #discard': true },
              renameByName: {
                'Value #expiration_time': 'Expiration time',
                'Value #renewal_time': 'Renewal time',
              },
            },
          },
        ],
      }),
    ]),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'The number of sync() calls made by a controller', targets: [{ expr: 'sum(increase(certmanager_controller_sync_call_count[$__interval])) by (controller)', legendFormat: '{{ controller }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
    NewTimeSeriesPanel({ title: 'The number of requests made by the ACME client', targets: [{ expr: 'sum(increase(certmanager_http_acme_client_request_count[$__interval])) by (host, method, path, scheme, status) > 0', legendFormat: '{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
    // TimeSeriesPanel("The clock time", [QueryExpr("max(certmanager_clock_time_seconds_gauge[$__interval]) * 1000", "")], unit=UNITS.DATE_TIME_FROM_NOW),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Expiration time', targets: [{ expr: 'max(certmanager_certificate_expiration_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', legendFormat: '{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
    NewTimeSeriesPanel({ title: 'Renewal time', targets: [{ expr: 'max(certmanager_certificate_renewal_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', legendFormat: '{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
    NewTimeSeriesPanel({ title: 'Avg HTTP request latencies for the ACME client', targets: [{ expr: averageDurationQuery('certmanager_http_acme_client_request_duration_seconds', '{}', 'host, method, path, scheme, status'), legendFormat: '{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}' }], defaultUnit: Unit.SECONDS }),
  ]),
]

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for cert-manager',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['cert-manager'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Cert Manager',
  uid: 'cert-manager',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' })],
  },
}

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: path.join(__dirname, 'dist', 'cert-manager.json'),
})
