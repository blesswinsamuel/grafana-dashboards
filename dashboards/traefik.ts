import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import { autoLayout, averageDurationQuery, CounterMetric, GaugeMetric, goRuntimeMetricsPanels, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTimeSeriesPanel, PanelRowAndGroups, SummaryMetric, Unit } from '../src/grafana-helpers'
import { cadvisorMetricsPanels } from '../src/k8s-cadvisor'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

// https://github.com/traefik/traefik/blob/master/pkg/metrics/prometheus.go

// server meta information.
// Config reloads
const configReloads = new CounterMetric('traefik_config_reloads_total')
// Last config reload success
const lastConfigReloadSuccess = new GaugeMetric('traefik_config_last_reload_success')
// Certificate expiration timestamp
const tlsCertsNotAfterTimestamp = new GaugeMetric('traefik_tls_certs_not_after_timestamp') // cn, serial, sans
// How many open connections exist, by entryPoint and protocol
const openConnections = new GaugeMetric('traefik_open_connections') // entrypoint, protocol

// entry point.
// How many HTTP requests processed on an entrypoint, partitioned by status code, protocol, and method.
const entryPointReqs = new CounterMetric('traefik_entrypoint_requests_total') // entrypoint, code, method, protocol
// How many HTTP requests with TLS processed on an entrypoint, partitioned by TLS Version and TLS cipher Used.
const entryPointReqsTLS = new CounterMetric('traefik_entrypoint_requests_tls_total') // tls_version, tls_cipher, entrypoint
// How long it took to process the request on an entrypoint, partitioned by status code, protocol, and method.
const entryPointReqDurations = new SummaryMetric('traefik_entrypoint_request_duration_seconds') // entrypoint, code, method, protocol
// The total size of requests in bytes handled by an entrypoint, partitioned by status code, protocol, and method.
const entryPointReqsBytesTotal = new CounterMetric('traefik_entrypoint_requests_bytes_total') // entrypoint, code, method, protocol
// The total size of responses in bytes handled by an entrypoint, partitioned by status code, protocol, and method.
const entryPointRespsBytesTotal = new CounterMetric('traefik_entrypoint_responses_bytes_total') // entrypoint, code, method, protocol

// router level.
// How many HTTP requests are processed on a router, partitioned by service, status code, protocol, and method.
const routerReqs = new CounterMetric('traefik_router_requests_total') // router, service, code, method, protocol
// How many HTTP requests with TLS are processed on a router, partitioned by service, TLS Version, and TLS cipher Used.
const routerReqsTLS = new CounterMetric('traefik_router_requests_tls_total') // tls_version, tls_cipher, router, service
// How long it took to process the request on a router, partitioned by service, status code, protocol, and method.
const routerReqDurations = new SummaryMetric('traefik_router_request_duration_seconds') // router, service, code, method, protocol
// The total size of requests in bytes handled by a router, partitioned by service, status code, protocol, and method.
const routerReqsBytesTotal = new CounterMetric('traefik_router_requests_bytes_total') // router, service, code, method, protocol
// The total size of responses in bytes handled by a router, partitioned by service, status code, protocol, and method.
const routerRespsBytesTotal = new CounterMetric('traefik_router_responses_bytes_total') // router, service, code, method, protocol

// service level.
// How many HTTP requests processed on a service, partitioned by status code, protocol, and method.
const serviceReqs = new CounterMetric('traefik_service_requests_total') // service, code, method, protocol
// How many HTTP requests with TLS processed on a service, partitioned by TLS version and TLS cipher.
const serviceReqsTLS = new CounterMetric('traefik_service_requests_tls_total') // tls_version, tls_cipher, service
// How long it took to process the request on a service, partitioned by status code, protocol, and method.
const serviceReqDurations = new SummaryMetric('traefik_service_request_duration_seconds') // service, code, method, protocol
// How many request retries happened on a service.
const serviceRetries = new CounterMetric('traefik_service_retries_total') // service
// service server is up, described by gauge value of 0 or 1.
const serviceServerUp = new GaugeMetric('traefik_service_server_up') // service, url
// The total size of requests in bytes received by a service, partitioned by status code, protocol, and method.
const serviceReqsBytesTotal = new CounterMetric('traefik_service_requests_bytes_total') // service, code, method, protocol
// The total size of responses in bytes returned by a service, partitioned by status code, protocol, and method.
const serviceRespsBytesTotal = new CounterMetric('traefik_service_responses_bytes_total') // service, code, method, protocol

const selectors = `namespace=~"$namespace", instance=~"$instance"`
const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({ title: 'Request Count', defaultUnit: Unit.SHORT }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Request Bytes', defaultUnit: Unit.BYTES_SI }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Response Bytes', defaultUnit: Unit.BYTES_SI }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Config reloads', defaultUnit: Unit.SHORT }, configReloads.calc('sum', 'increase', { selectors, interval: '$__range' }).target()),
      NewStatPanel({ title: 'Last successful config reload', defaultUnit: Unit.DATE_TIME_FROM_NOW }, lastConfigReloadSuccess.calc('max', { selectors, append: '* 1000' }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Open connections', defaultUnit: Unit.SHORT }, openConnections.calc('sum', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint', 'protocol'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Entrypoint Metrics' }, [
    // available labels: entrypoint, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      // by entrypoint
      NewTimeSeriesPanel({ title: 'Request Count', defaultUnit: Unit.SHORT }, entryPointReqs.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes', defaultUnit: Unit.BYTES_SI }, entryPointReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes', defaultUnit: Unit.BYTES_SI }, entryPointRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration', defaultUnit: Unit.SECONDS }, entryPointReqDurations.avg({ selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Service Metrics' }, [
    // available labels: service, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      // by service
      NewTimeSeriesPanel({ title: 'Request Count by service', defaultUnit: Unit.SHORT }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes by service', defaultUnit: Unit.BYTES_SI }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes by service', defaultUnit: Unit.BYTES_SI }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration by service', defaultUnit: Unit.SECONDS }, serviceReqDurations.avg({ selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by protocol
      NewTimeSeriesPanel({ title: 'Request Count by protocol', defaultUnit: Unit.SHORT }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['protocol'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes by protocol', defaultUnit: Unit.BYTES_SI }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['protocol'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes by protocol', defaultUnit: Unit.BYTES_SI }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['protocol'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration by protocol', defaultUnit: Unit.SECONDS }, serviceReqDurations.avg({ selectors: [selectors, 'service=~"$service"'], groupBy: ['protocol'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by method
      NewTimeSeriesPanel({ title: 'Request Count by method', defaultUnit: Unit.SHORT }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['method'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes by method', defaultUnit: Unit.BYTES_SI }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['method'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes by method', defaultUnit: Unit.BYTES_SI }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['method'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration by method', defaultUnit: Unit.SECONDS }, serviceReqDurations.avg({ selectors: [selectors, 'service=~"$service"'], groupBy: ['method'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by code
      NewTimeSeriesPanel({ title: 'Request Count by code', defaultUnit: Unit.SHORT }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['code'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes by code', defaultUnit: Unit.BYTES_SI }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['code'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes by code', defaultUnit: Unit.BYTES_SI }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['code'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration by code', defaultUnit: Unit.SECONDS }, serviceReqDurations.avg({ selectors: [selectors, 'service=~"$service"'], groupBy: ['code'] }).target()),
    ]),
    // NewPanelRow({ datasource, height: 8 }, [
    //   //
    //   NewTimeSeriesPanel({ title: 'Service Retries', defaultUnit: Unit.SHORT }, serviceRetries.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
    //   NewTimeSeriesPanel({ title: 'Service Server Up', defaultUnit: Unit.SHORT }, serviceServerUp.calc('max', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service', 'url'] }).target()),
    // ]),
  ]),
  NewPanelGroup({ title: 'TLS Metrics' }, [
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'TLS requests by entrypoint', defaultUnit: Unit.SHORT }, entryPointReqsTLS.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint', 'tls_cipher', 'version'] }).target()),
      NewTimeSeriesPanel({ title: 'TLS requests by service', defaultUnit: Unit.SHORT }, serviceReqsTLS.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service', 'tls_cipher', 'version'] }).target()),
      NewTimeSeriesPanel({ title: 'TLS certs expiration timestamp', defaultUnit: Unit.DATE_TIME_FROM_NOW }, tlsCertsNotAfterTimestamp.calc('max', { selectors: [selectors], groupBy: ['cn', 'sans', 'serial'], append: ' * 1000' }).target()),
    ]),
  ]),
  goRuntimeMetricsPanels({ datasource, selectors, collapsed: true }),
  cadvisorMetricsPanels({ datasource, selectors: [`namespace=~"$namespace"`, `pod=~"$pod"`], collapsed: true }), //`container="traefik"`
]

export const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for traefik',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['traefik'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Traefik',
  uid: 'traefik',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [
      NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
      NewQueryVariable({ datasource, name: 'namespace', label: 'Namespace', query: 'label_values(traefik_config_reloads_total, namespace)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(traefik_config_reloads_total{namespace=~"$namespace"}, instance)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'pod', label: 'Pod', query: 'label_values(traefik_config_reloads_total{namespace=~"$namespace", instance=~"$instance"}, pod)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'entrypoint', label: 'Entrypoint', query: 'label_values(traefik_entrypoint_requests_total{instance=~"$instance"}, entrypoint)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'service', label: 'Service', query: 'label_values(traefik_service_requests_total{instance=~"$instance"}, service)', includeAll: true, multi: true }),
    ],
  },
}
