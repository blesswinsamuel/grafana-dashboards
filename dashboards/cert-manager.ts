import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import { CounterMetric, GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, SummaryMetric, Unit, autoLayout, overridesMatchByName, tableIndexByName } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}
const namespace = 'certmanager'
// The clock time given in seconds (from 1970/01/01 UTC).
const clockTimeSecondsGauge = new GaugeMetric(namespace + '_' + 'clock_time_seconds_gauge')
// The date after which the certificate expires. Expressed as a Unix Epoch Time.
const certificateExpiryTimeSeconds = new GaugeMetric(namespace + '_' + 'certificate_expiration_timestamp_seconds') // name, namespace, issuer_name, issuer_kind, issuer_group
// The number of seconds before expiration time the certificate should renew.
const certificateRenewalTimeSeconds = new GaugeMetric(namespace + '_' + 'certificate_renewal_timestamp_seconds') // name, namespace, issuer_name, issuer_kind, issuer_group
// The ready status of the certificate.
const certificateReadyStatus = new GaugeMetric(namespace + '_' + 'certificate_ready_status') // name, namespace, condition, issuer_name, issuer_kind, issuer_group
// The number of requests made by the ACME client.
const acmeClientRequestCount = new CounterMetric(namespace + '_' + 'http' + '_' + 'acme_client_request_count') // scheme, host, path, method, status
// The HTTP request latencies in seconds for the ACME client.
const acmeClientRequestDurationSeconds = new SummaryMetric(namespace + '_' + 'http' + '_' + 'acme_client_request_duration_seconds') // scheme, host, path, method, status
// The HTTP request latencies in seconds for the Venafi client. This metric is currently alpha as we would like to understand whether it helps to measure Venafi call latency. Please leave feedback if you have any.
const venafiClientRequestDurationSeconds = new SummaryMetric(namespace + '_' + 'http' + '_' + 'venafi_client_request_duration_seconds') // api_call
// The number of sync() calls made by a controller.
const controllerSyncCallCount = new CounterMetric(namespace + '_' + 'controller_sync_call_count') // controller
// The number of errors encountered during controller sync().
const controllerSyncErrorCount = new CounterMetric(namespace + '_' + 'controller_sync_error_count') // controller

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Ready status' }, [
    NewPanelRow({ datasource, height: 24 }, [
      NewTablePanel({
        title: 'Ready status',
        targets: [
          certificateReadyStatus.calc('sum', { groupBy: ['issuer_group', 'issuer_kind', 'issuer_name', 'name', 'namespace', 'condition'], refId: 'discard', type: 'instant', append: ' > 0' }),
          certificateExpiryTimeSeconds.calc('max', { groupBy: ['issuer_group', 'issuer_kind', 'issuer_name', 'name', 'namespace'], refId: 'expiration_time', type: 'instant', append: ' * 1000' }),
          certificateRenewalTimeSeconds.calc('max', { groupBy: ['issuer_group', 'issuer_kind', 'issuer_name', 'name', 'namespace'], refId: 'renewal_time', type: 'instant', append: ' * 1000' }),
        ],
        overrides: overridesMatchByName({
          condition: {
            mappings: [{ options: { False: { color: 'red', index: 1, text: 'Not ready' }, True: { color: 'green', index: 0, text: 'Ready' } }, type: 'value' }],
            'custom.cellOptions': { type: 'color-background' },
          },
          'Value #expiration_time': { unit: Unit.DATE_TIME_FROM_NOW },
          'Value #renewal_time': { unit: Unit.DATE_TIME_FROM_NOW },
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
    NewTimeSeriesPanel({ title: 'The number of sync() calls made by a controller' }, controllerSyncCallCount.increase({ groupBy: ['controller'] })),
    NewTimeSeriesPanel({ title: 'The number of requests made by the ACME client' }, acmeClientRequestCount.increase({ groupBy: ['host', 'method', 'path', 'scheme', 'status'], append: ' > 0' })),
    // TimeSeriesPanel("The clock time", [QueryExpr("max(certmanager_clock_time_seconds_gauge[$__interval]) * 1000", "")], unit=UNITS.DATE_TIME_FROM_NOW),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Expiration time', defaultUnit: Unit.DATE_TIME_FROM_NOW }, certificateExpiryTimeSeconds.calc('max', { groupBy: ['issuer_group', 'issuer_kind', 'issuer_name', 'name', 'namespace'], append: ' * 1000' })),
    NewTimeSeriesPanel({ title: 'Renewal time', defaultUnit: Unit.DATE_TIME_FROM_NOW }, certificateRenewalTimeSeconds.calc('max', { groupBy: ['issuer_group', 'issuer_kind', 'issuer_name', 'name', 'namespace'], append: ' * 1000' })),
    NewTimeSeriesPanel({ title: 'Avg HTTP request latencies for the ACME client', defaultUnit: Unit.SECONDS }, acmeClientRequestDurationSeconds.avg({ groupBy: ['host', 'method', 'path', 'scheme', 'status'] })),
  ]),
]

export const dashboard: Dashboard = {
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
