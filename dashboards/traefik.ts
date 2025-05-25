import { CounterMetric, GaugeMetric, goRuntimeMetricsPanels, newDashboard, NewLokiDatasourceVariable, NewLokiLogsPanel, NewPanelGroup, NewPanelRow, NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTimeSeriesPanel, PanelRowAndGroups, SummaryMetric, units } from '../src/grafana-helpers'
import { cadvisorMetricsPanels } from '../src/common-panels/k8s-cadvisor'
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'

const datasource: dashboard.DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const lokiDatasource: dashboard.DataSourceRef = {
  uid: '${DS_LOKI}',
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

const serviceMetricsPanels = (opts: { title?: string; groupBy: string[]; extraSelectors?: string[]; append?: string }) => {
  const { title = 'Service Metrics', extraSelectors = [], append, groupBy } = opts
  return NewPanelGroup({ title: `${title} (by ${opts.groupBy.join(', ')})` }, [
    // available labels: service, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      // by service
      NewTimeSeriesPanel({ title: `Request Count by ${opts.groupBy.join(', ')}` }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"', ...extraSelectors], groupBy, append }).target()),
      NewTimeSeriesPanel({ title: `Request Bytes by ${opts.groupBy.join(', ')}` }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"', ...extraSelectors], groupBy, append }).target()),
      NewTimeSeriesPanel({ title: `Response Bytes by ${opts.groupBy.join(', ')}` }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"', ...extraSelectors], groupBy, append }).target()),
      NewTimeSeriesPanel({ title: `Avg request duration by ${opts.groupBy.join(', ')}` }, serviceReqDurations.avg({ selectors: [selectors, 'service=~"$service"', ...extraSelectors], groupBy, append }).target()),
    ]),
  ])
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({ title: 'Request Count' }, serviceReqs.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Request Bytes' }, serviceReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Response Bytes' }, serviceRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], interval: '$__range' }).target()),
      NewStatPanel({ title: 'Config reloads' }, configReloads.calc('sum', 'increase', { selectors, interval: '$__range' }).target()),
      NewStatPanel({ title: 'Last successful config reload', unit: units.DateTimeFromNow }, lastConfigReloadSuccess.calc('max', { selectors, append: '* 1000' }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Open connections' }, openConnections.calc('sum', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint', 'protocol'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Entrypoint Metrics' }, [
    // available labels: entrypoint, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      // by entrypoint
      NewTimeSeriesPanel({ title: 'Request Count' }, entryPointReqs.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Request Bytes' }, entryPointReqsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Response Bytes' }, entryPointRespsBytesTotal.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
      NewTimeSeriesPanel({ title: 'Avg request duration' }, entryPointReqDurations.avg({ selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint'] }).target()),
    ]),
  ]),
  serviceMetricsPanels({ groupBy: ['service'] }),
  serviceMetricsPanels({ groupBy: ['protocol'] }),
  serviceMetricsPanels({ groupBy: ['method'] }),
  serviceMetricsPanels({ groupBy: ['code'] }),
  serviceMetricsPanels({ title: 'Service Metrics (errors)', groupBy: ['code', 'protocol', 'method', 'service'], extraSelectors: ['code=~"(4|5).."'], append: ' > 0' }),
  // NewPanelGroup({ title: 'Service Metrics (by code) (errors)' }, [
  //   // NewPanelRow({ datasource, height: 8 }, [
  //   //   //
  //   //   NewTimeSeriesPanel({ title: 'Service Retries' }, serviceRetries.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service'] }).target()),
  //   //   NewTimeSeriesPanel({ title: 'Service Server Up' }, serviceServerUp.calc('max', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service', 'url'] }).target()),
  //   // ]),
  // ]),
  NewPanelGroup({ title: 'TLS Metrics' }, [
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'TLS requests by entrypoint' }, entryPointReqsTLS.calc('sum', 'increase', { selectors: [selectors, 'entrypoint=~"$entrypoint"'], groupBy: ['entrypoint', 'tls_cipher', 'version'] }).target()),
      NewTimeSeriesPanel({ title: 'TLS requests by service' }, serviceReqsTLS.calc('sum', 'increase', { selectors: [selectors, 'service=~"$service"'], groupBy: ['service', 'tls_cipher', 'version'] }).target()),
      NewTimeSeriesPanel({ title: 'TLS certs expiration timestamp', unit: units.DateTimeFromNow }, tlsCertsNotAfterTimestamp.calc('max', { selectors: [selectors], groupBy: ['cn', 'sans', 'serial'], append: ' * 1000' }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Logs' }, [
    // {container_name="traefik"} | json | DownstreamStatus >= 400
    // ClientAddr RequestAddr RequestPath DownstreamStatus RouterName
    // 'ServiceAddr', 'ServiceName', 'ServiceURL', 'level', 'Duration', 'OriginDuration'
    NewPanelRow({ datasource: lokiDatasource, height: 16 }, [NewLokiLogsPanel({ title: 'Downstream errors (4xx)' }, { expr: `{container_name="traefik"} | json | DownstreamStatus >= 400 and DownstreamStatus < 500 | line_format "{{.ClientAddr}} - {{.RequestProtocol}} - {{.RequestScheme}}://{{.RequestAddr}}{{.RequestPath}} - {{.RouterName}} - {{.DownstreamStatus}} - {{.OriginStatus}}"` })]),
    NewPanelRow({ datasource: lokiDatasource, height: 16 }, [NewLokiLogsPanel({ title: 'Downstream errors (5xx)' }, { expr: `{container_name="traefik"} | json | DownstreamStatus >= 500 | line_format "{{.ClientAddr}} - {{.RequestProtocol}} - {{.RequestScheme}}://{{.RequestAddr}}{{.RequestPath}} - {{.RouterName}} - {{.DownstreamStatus}} - {{.OriginStatus}}"` })]),
    // NewPanelRow({ datasource: lokiDatasource, height: 16 }, [NewLokiLogsPanel({ title: 'Downstream errors (0)' }, { expr: `{container_name="traefik"} | json | DownstreamStatus == 0 | line_format "{{.ClientAddr}} - {{.RequestProtocol}} - {{.RequestScheme}}://{{.RequestAddr}}{{.RequestPath}} - {{.RouterName}} - {{.DownstreamStatus}} - {{.OriginStatus}}"` })]),
  ]),
  goRuntimeMetricsPanels({ datasource, selectors, collapsed: true }),
  cadvisorMetricsPanels({ datasource, selectors: [`namespace=~"$namespace"`, `pod=~"$pod"`], collapsed: true }), //`container="traefik"`
]

export type LokiLogsPanelOpts = {
  title: string
  query: string
  limit: number
}

export const traefikDashboard = newDashboard({
  variables: [
    NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
    NewLokiDatasourceVariable({ name: 'DS_LOKI', label: 'Loki' }),
    NewQueryVariable({ datasource, name: 'namespace', label: 'Namespace', query: 'label_values(traefik_config_reloads_total, namespace)', includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(traefik_config_reloads_total{namespace=~"$namespace"}, instance)', includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'pod', label: 'Pod', query: 'label_values(traefik_config_reloads_total{namespace=~"$namespace", instance=~"$instance"}, pod)', includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'entrypoint', label: 'Entrypoint', query: 'label_values(traefik_entrypoint_requests_total{instance=~"$instance"}, entrypoint)', includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'service', label: 'Service', query: 'label_values(traefik_service_requests_total{instance=~"$instance"}, service)', includeAll: true, multi: true }),
  ],
  panels,
})
