import { BigValueGraphMode, Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, averageDurationQuery, overridesMatchByName, tableIndexByName, writePrometheusRules, writeDashboardAndPostToGrafana, NewQueryVariable, NewStatPanel } from '../src/grafana-helpers'
import { RuleGroup } from '../src/alerts'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Omada Controller' }, [
    NewPanelRow({ datasource, height: 4 }, [
      //
      NewStatPanel({ title: 'Total PoE Used', targets: [{ expr: 'sum(omada_port_power_watts{site=~"$site"})' }], defaultUnit: Unit.WATT, reduceCalc: 'lastNotNull' }),
      NewStatPanel({ title: 'Controller Uptime', targets: [{ expr: 'omada_controller_uptime_seconds{site=~"$site"}', type: 'instant' }], defaultUnit: Unit.SECONDS }),
      NewStatPanel({ title: 'Active Switch Ports', targets: [{ expr: 'sum(omada_port_link_status{site=~"$site"})' }], reduceCalc: 'lastNotNull' }),
      NewStatPanel({ title: 'Connected Clients', targets: [{ expr: 'sum(omada_client_connected_total{site=~"$site"})' }], reduceCalc: 'lastNotNull' }),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Devices' }, [
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({ title: 'CPU Usage %', targets: [{ expr: 'sum(omada_device_cpu_percentage{site=~"$site"}) by (ip, device, device_type, mac, model, site)', legendFormat: '{{ device }} {{ device_type }} {{ ip }}' }], defaultUnit: Unit.PERCENT, max: 100 }),
      NewTimeSeriesPanel({ title: 'Memory Usage %', targets: [{ expr: 'sum(omada_device_mem_percentage{site=~"$site"}) by (ip, device, device_type, mac, model, site)', legendFormat: '{{ device }} {{ device_type }} {{ ip }}' }], defaultUnit: Unit.PERCENT, max: 100 }),
      // NewTimeSeriesPanel({ title: 'The number of requests made by the ACME client', targets: [{ expr: 'sum(increase(certmanager_http_acme_client_request_count[$__interval])) by (host, method, path, scheme, status) > 0', legendFormat: '{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}' }], defaultUnit: Unit.SHORT, type: 'bar' }),
      // TimeSeriesPanel("The clock time", [QueryExpr("max(certmanager_clock_time_seconds_gauge[$__interval]) * 1000", "")], unit=UNITS.DATE_TIME_FROM_NOW),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({
        title: 'Rx/Tx Rate',
        targets: [
          { expr: 'sum(omada_device_rx_rate{site=~"$site"}) by (ip, device, device_type, mac, model, site)', refId: 'RX', legendFormat: 'Rx - {{ device }} {{ device_type }} {{ ip }}' },
          { expr: '-sum(omada_device_tx_rate{site=~"$site"}) by (ip, device, device_type, mac, model, site)', refId: 'TX', legendFormat: 'Tx - {{ device }} {{ device_type }} {{ ip }}' },
        ],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
        legendCalcs: ['mean', 'last'],
      }),
      NewTimeSeriesPanel({ title: 'Uptime', targets: [{ expr: 'sum(omada_device_uptime_seconds{site=~"$site"}) by (ip, device, device_type, mac, model, site)', legendFormat: '{{ device }} {{ device_type }} {{ ip }}' }], defaultUnit: Unit.SECONDS }),
      NewTimeSeriesPanel({ title: 'PoE remaining', targets: [{ expr: 'sum(omada_device_poe_remain_watts{site=~"$site"}) by (ip, device, device_type, mac, model, site)', legendFormat: '{{ device }} {{ device_type }} {{ ip }}' }], defaultUnit: Unit.WATT }),
      //   NewTimeSeriesPanel({ title: 'Expiration time', targets: [{ expr: 'max(certmanager_certificate_expiration_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', legendFormat: '{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
      //   NewTimeSeriesPanel({ title: 'Renewal time', targets: [{ expr: 'max(certmanager_certificate_renewal_timestamp_seconds[$__interval]) by (issuer_group, issuer_kind, issuer_name, name, namespace) * 1000', legendFormat: '{{ issuer_group }} {{ issuer_kind }} {{ issuer_name }} {{ name }} {{ namespace }}' }], defaultUnit: Unit.DATE_TIME_FROM_NOW }),
      //   NewTimeSeriesPanel({ title: 'Avg HTTP request latencies for the ACME client', targets: [{ expr: averageDurationQuery('certmanager_http_acme_client_request_duration_seconds', '{}', 'host, method, path, scheme, status'), legendFormat: '{{ host }} {{ method }} {{ path }} {{ scheme }} {{ status }}' }], defaultUnit: Unit.SECONDS }),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Clients' }, [
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({ title: 'Clients Connected', targets: [{ expr: 'sum(omada_client_connected_total{site=~"$site"}) by (connection_mode, wifi_mode)', legendFormat: '{{ connection_mode }} {{ wifi_mode }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Signal Percentage', targets: [{ expr: 'sum(omada_client_signal_pct{site=~"$site", ip!=""}) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }], defaultUnit: Unit.PERCENT, max: 100 }),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({ title: 'RSSI dBm', targets: [{ expr: 'sum(omada_client_rssi_dbm{site=~"$site", ip!=""}) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }], defaultUnit: Unit.DBM, legendCalcs: ['mean', 'min', 'last'] }),
      NewTimeSeriesPanel({ title: 'SNR dBm', targets: [{ expr: 'sum(omada_client_snr_dbm{site=~"$site", ip!=""}) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }], defaultUnit: Unit.DBM, legendCalcs: ['mean', 'min', 'last'] }),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({
        title: 'Upload Rate',
        targets: [{ expr: 'sum(rate(omada_client_traffic_up_bytes{site=~"$site", ip!=""}[$__rate_interval])) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Download Rate',
        targets: [{ expr: 'sum(rate(omada_client_traffic_down_bytes{site=~"$site", ip!=""}[$__rate_interval])) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
      }),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({
        title: 'Rx Rate',
        targets: [{ expr: 'sum(omada_client_rx_rate{site=~"$site", ip!=""}) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
      }),
      NewTimeSeriesPanel({
        title: 'Tx Rate',
        targets: [{ expr: 'sum(omada_client_tx_rate{site=~"$site", ip!=""}) by (client, ap_name, connection_mode, ip, ssid, vlan_id, wifi_mode)', legendFormat: '{{ client }} {{ ap_name }} {{ connection_mode }} {{ ssid }} {{ vlan_id }} {{ wifi_mode }}' }],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
      }),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Ports' }, [
    NewPanelRow({ datasource, height: 24 }, [
      //
      NewTablePanel({
        //
        title: 'Port Link Status',
        targets: [
          { expr: 'sum(omada_port_link_status{site=~"$site"}) by (client, device, name, profile, site, switch_port, vlan_id)', type: 'instant', format: 'table', refId: 'STATUS' },
          { expr: 'sum(increase(omada_port_link_rx{site=~"$site"}[$__range])) by (switch_port)', type: 'instant', format: 'table', refId: 'RX' },
          { expr: 'sum(increase(omada_port_link_tx{site=~"$site"}[$__range])) by (switch_port)', type: 'instant', format: 'table', refId: 'TX' },
          { expr: 'sum(omada_port_link_speed_mbps{site=~"$site"}) by (client, device, name, profile, site, switch_port, vlan_id)', type: 'instant', format: 'table', refId: 'SPEED' },
          { expr: 'sum(omada_port_power_watts{site=~"$site"}) by (client, device, name, profile, site, switch_port, vlan_id)', type: 'instant', format: 'table', refId: 'POWER' },
        ],
        overrides: overridesMatchByName({
          status: {
            mappings: [{ options: { '1': { color: 'green', index: 1, text: 'ON' }, '0': { color: 'red', index: 0, text: 'OFF' } }, type: 'value' }],
            'custom.cellOptions': { type: 'color-background', mode: 'gradient', applyToRow: false, wrapText: false },
          },
          speed: { unit: Unit.MIBITS },
          rx: { unit: Unit.BYTES_SI },
          tx: { unit: Unit.BYTES_SI },
          power: { unit: Unit.WATT },
        }),
        transformations: [
          { id: 'merge', options: {} },
          {
            id: 'organize',
            options: {
              indexByName: tableIndexByName(['switch_port', 'name', 'client', 'vlan_id', 'profile', 'device', 'status']),
              excludeByName: { Time: true, site: true },
              renameByName: {
                'Value #STATUS': 'status',
                'Value #SPEED': 'speed',
                'Value #RX': 'rx',
                'Value #TX': 'tx',
                'Value #POWER': 'power',
              },
            },
          },
          { id: 'convertFieldType', options: { conversions: [{ targetField: 'switch_port', destinationType: 'number' }] } },
          { id: 'sortBy', options: { sort: [{ field: 'switch_port' }] } },
        ],
      }),
    ]),
  ]),
]

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for omada-controller',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['omada-controller'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Omada Controller',
  uid: 'omada-controller',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [
      //
      NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
      NewQueryVariable({ datasource, name: 'site', label: 'Site', query: 'label_values(omada_device_uptime_seconds, site)', includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'device', label: 'Device', query: 'label_values(omada_device_uptime_seconds{site="$Site"}, device)', includeAll: true, multi: true, hide: true }),
    ],
  },
}

const rules: RuleGroup[] = [
  {
    name: 'omada-controller',
    rules: [
      {
        alert: 'OmadaDeviceDisconnected',
        expr: 'sum(increase(omada_device_uptime_seconds[1m])) by (ip, device, device_type, mac, model, site) == 0',
        for: '5m',
        labels: { severity: 'critical' },
        annotations: {
          summary: 'Device {{ $labels.device }} ({{ $labels.mac }}) is disconnected',
          description: 'Device {{ $labels.device }} ({{ $labels.mac }}) is disconnected from the controller',
        },
      },
      {
        alert: 'OmadaDeviceHighCpuUsage',
        expr: 'max(omada_device_cpu_usage_percent) by (ip, device, device_type, mac, model, site) > 90',
        for: '10m',
        labels: { severity: 'warning' },
        annotations: {
          summary: 'Device {{ $labels.device }} ({{ $labels.mac }}) has high CPU usage',
          description: 'Device {{ $labels.device }} ({{ $labels.mac }}) has high CPU usage',
        },
      },
      {
        alert: 'OmadaDeviceHighMemoryUsage',
        expr: 'max(omada_device_mem_percentage) by (ip, device, device_type, mac, model, site) > 90',
        for: '10m',
        labels: { severity: 'warning' },
        annotations: {
          summary: 'Device {{ $labels.device }} ({{ $labels.mac }}) has high memory usage',
          description: 'Device {{ $labels.device }} ({{ $labels.mac }}) has high memory usage',
        },
      },
    ],
  },
]

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: path.join(__dirname, 'dist', 'dashboards', 'omada-controller.json'),
})

writePrometheusRules({ ruleFile: { groups: rules }, filename: path.join(__dirname, 'dist', 'alerts', 'omada-controller.yaml') })
