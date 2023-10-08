import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewGoRuntimeMetrics, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, averageDurationQuery, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({ title: 'Request Count', targets: [{ expr: 'sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))' }], defaultUnit: Unit.SHORT }),
      NewStatPanel({ title: 'Request Bytes', targets: [{ expr: 'sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))' }], defaultUnit: Unit.BYTES_SI }),
      NewStatPanel({ title: 'Response Bytes', targets: [{ expr: 'sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__range]))' }], defaultUnit: Unit.BYTES_SI }),
      NewStatPanel({ title: 'Config reloads', targets: [{ expr: 'sum(increase(traefik_config_reloads_total{namespace=~"$namespace", instance=~"$instance"}[$__range]))' }], defaultUnit: Unit.SHORT }),
      NewStatPanel({ title: 'Config reloads failures', targets: [{ expr: 'sum(increase(traefik_config_reloads_failure_total{namespace=~"$namespace", instance=~"$instance"}[$__range]))' }], defaultUnit: Unit.SHORT }),
      NewStatPanel({ title: 'Last successful config reload', targets: [{ expr: 'max(traefik_config_last_reload_success{namespace=~"$namespace", instance=~"$instance"}[$__range]) * 1000' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
      NewStatPanel({ title: 'Last failed config reload', targets: [{ expr: 'max(traefik_config_last_reload_failure{namespace=~"$namespace", instance=~"$instance"}[$__range]) * 1000' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
    ]),
  ]),
  NewPanelGroup({ title: 'Entrypoint Metrics' }, [
    // available labels: entrypoint, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Open connections by protocol', targets: [{ expr: 'sum(traefik_entrypoint_open_connections{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval]) by (entrypoint, protocol)', legendFormat: '{{ entrypoint }} - {{ protocol }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Open connections by method', targets: [{ expr: 'sum(traefik_entrypoint_open_connections{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval]) by (entrypoint, method)', legendFormat: '{{ entrypoint }} - {{ method }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by entrypoint
      NewTimeSeriesPanel({ title: 'Request Count', targets: [{ expr: 'sum(increase(traefik_entrypoint_requests_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', legendFormat: '{{ entrypoint }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Request Bytes', targets: [{ expr: 'sum(increase(traefik_entrypoint_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', legendFormat: '{{ entrypoint }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Response Bytes', targets: [{ expr: 'sum(increase(traefik_entrypoint_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}[$__interval])) by (entrypoint)', legendFormat: '{{ entrypoint }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Avg request duration', targets: [{ expr: cleanupServiceLabel(averageDurationQuery('traefik_entrypoint_request_duration_seconds', '{namespace=~"$namespace", instance=~"$instance", entrypoint=~"$entrypoint"}', 'entrypoint')), legendFormat: '{{ entrypoint }}' }], defaultUnit: Unit.SECONDS }),
    ]),
  ]),
  NewPanelGroup({ title: 'Service Metrics' }, [
    // available labels: service, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      // by entrypoint
      NewTimeSeriesPanel({ title: 'Open connections by service', targets: [{ expr: 'sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (service)', legendFormat: '{{ service }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Open connections by protocol', targets: [{ expr: 'sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (protocol)', legendFormat: '{{ protocol }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Open connections by method', targets: [{ expr: 'sum(traefik_service_open_connections{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval]) by (method)', legendFormat: '{{ method }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by service
      NewTimeSeriesPanel({ title: 'Request Count by service', targets: [{ expr: 'sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)', legendFormat: '{{ service }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Request Bytes by service', targets: [{ expr: 'sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)', legendFormat: '{{ service }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Response Bytes by service', targets: [{ expr: 'sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (service)', legendFormat: '{{ service }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Avg request duration by service', targets: [{ expr: cleanupServiceLabel(averageDurationQuery('traefik_service_request_duration_seconds', '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', 'service')), legendFormat: '{{ service }}' }], defaultUnit: Unit.SECONDS }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by protocol
      NewTimeSeriesPanel({ title: 'Request Count by protocol', targets: [{ expr: 'sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)', legendFormat: '{{ protocol }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Request Bytes by protocol', targets: [{ expr: 'sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)', legendFormat: '{{ protocol }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Response Bytes by protocol', targets: [{ expr: 'sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (protocol)', legendFormat: '{{ protocol }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Avg request duration by protocol', targets: [{ expr: cleanupServiceLabel(averageDurationQuery('traefik_service_request_duration_seconds', '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', 'protocol')), legendFormat: '{{ protocol }}' }], defaultUnit: Unit.SECONDS }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by method
      NewTimeSeriesPanel({ title: 'Request Count by method', targets: [{ expr: 'sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)', legendFormat: '{{ method }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Request Bytes by method', targets: [{ expr: 'sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)', legendFormat: '{{ method }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Response Bytes by method', targets: [{ expr: 'sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (method)', legendFormat: '{{ method }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Avg request duration by method', targets: [{ expr: cleanupServiceLabel(averageDurationQuery('traefik_service_request_duration_seconds', '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', 'method')), legendFormat: '{{ method }}' }], defaultUnit: Unit.SECONDS }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      // by code
      NewTimeSeriesPanel({ title: 'Request Count by code', targets: [{ expr: 'sum(increase(traefik_service_requests_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)', legendFormat: '{{ code }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Request Bytes by code', targets: [{ expr: 'sum(increase(traefik_service_requests_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)', legendFormat: '{{ code }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Response Bytes by code', targets: [{ expr: 'sum(increase(traefik_service_responses_bytes_total{namespace=~"$namespace", instance=~"$instance", service=~"$service"}[$__interval])) by (code)', legendFormat: '{{ code }}' }], defaultUnit: Unit.BYTES_SI, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'Avg request duration by code', targets: [{ expr: cleanupServiceLabel(averageDurationQuery('traefik_service_request_duration_seconds', '{namespace=~"$namespace", instance=~"$instance", service=~"$service"}', 'code')), legendFormat: '{{ code }}' }], defaultUnit: Unit.SECONDS }),
    ]),
  ]),
  NewPanelGroup({ title: 'TLS Metrics' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'TLS requests', targets: [{ expr: 'sum(increase(traefik_service_requests_tls_total{namespace=~"$namespace", instance=~"$instance"}[$__interval])) by (service, tls_cipher, version)', legendFormat: '{{ service }} - {{ tls_cipher }} (version: "{{ version }}")' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      NewTimeSeriesPanel({ title: 'TLS certs expiration timestamp', targets: [{ expr: 'max(traefik_tls_certs_not_after{namespace=~"$namespace", instance=~"$instance"}) by (cn, sans, serial) * 1000', legendFormat: '{{ cn }} - {{ sans }} - {{ serial }}' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
    ]),
  ]),
  NewGoRuntimeMetrics({ datasource, selector: '{namespace=~"$namespace", instance=~"$instance"}' }),
]

function cleanupServiceLabel(query: string): string {
  return `label_replace(${query}, "service", "$1", "service", "([^-]+-[^@]+)@.*")`
}

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for traefik',
  graphTooltip: DashboardCursorSync.Crosshair,
  style: 'dark',
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
      NewQueryVariable({ datasource, name: 'namespace', label: 'Namespace', query: 'label_values(traefik_config_last_reload_success, namespace)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(traefik_config_last_reload_success{namespace=~"$namespace"}, instance)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'entrypoint', label: 'Entrypoint', query: 'label_values(traefik_entrypoint_open_connections{namespace=~"$namespace"}, entrypoint)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'service', label: 'Service', query: 'label_values(traefik_service_open_connections{namespace=~"$namespace"}, service)', includeAll: true, multi: true }),
    ],
  },
}

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: path.join(__dirname, 'dist', 'traefik.json'),
})
