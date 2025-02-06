import { Dashboard, DashboardCursorSync, DataSourceRef, defaultDashboard } from '@grafana/schema'
import { RuleGroup } from '../src/alerts'
import { CounterMetric, GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

// https://github.com/charlie-haley/omada_exporter/#-metrics
// The current download activity for the client in bytes.
const clientDownloadActivityBytes = new CounterMetric('omada_client_download_activity_bytes') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id switch_port
// The signal quality for the wireless client in percent.
const clientSignalPct = new GaugeMetric('omada_client_signal_pct') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// The signal to noise ratio for the wireless client in dBm.
const clientSnrDbm = new GaugeMetric('omada_client_snr_dbm') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// The RSSI for the wireless client in dBm.
const clientRssiDbm = new GaugeMetric('omada_client_rssi_dbm') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// Total bytes received by wireless client.
const clientTrafficDownBytes = new CounterMetric('omada_client_traffic_down_bytes') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// Total bytes sent by wireless client.
const clientTrafficUpBytes = new CounterMetric('omada_client_traffic_up_bytes') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// TX rate of wireless client.
const clientTxRate = new GaugeMetric('omada_client_tx_rate') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// RX rate of wireless client.
const clientRxRate = new GaugeMetric('omada_client_rx_rate') // client vendor ip mac host_name site site_id connection_mode wifi_mode ap_name ssid vlan_id
// Total number of connected clients.
const clientConnectedTotal = new GaugeMetric('omada_client_connected_total') // site site_id connection_mode wifi_mode
// Uptime of the controller.
const controllerUptimeSeconds = new GaugeMetric('omada_controller_uptime_seconds') // controller_name model controller_version firmware_version mac site site_id
// Storage used on the controller.
const controllerStorageUsedBytes = new GaugeMetric('omada_controller_storage_used_bytes') // storage_name controller_name model controller_version firmware_version mac site site_id
// Total storage available for the controller.
const controllerStorageAvailableBytes = new GaugeMetric('omada_controller_storage_available_bytes') // storage_name controller_name model controller_version firmware_version mac site site_id
// Uptime of the device.
const deviceUptimeSeconds = new GaugeMetric('omada_device_uptime_seconds') // device model version ip mac site site_id device_type
// Percentage of device CPU used.
const deviceCpuPercentage = new GaugeMetric('omada_device_cpu_percentage') // device model version ip mac site site_id device_type
// Percentage of device Memory used.
const deviceMemPercentage = new GaugeMetric('omada_device_mem_percentage') // device model version ip mac site site_id device_type
// A boolean on whether the device needs an upgrade.
const deviceNeedUpgrade = new GaugeMetric('omada_device_need_upgrade') // device model version ip mac site site_id device_type
// The tx rate of the device.
const deviceTxRate = new GaugeMetric('omada_device_tx_rate') // device model version ip mac site site_id device_type
// The rx rate of the device.
const deviceRxRate = new GaugeMetric('omada_device_rx_rate') // device model version ip mac site site_id device_type
// The remaining amount of PoE power for the device in watts.
const devicePoeRemainWatts = new GaugeMetric('omada_device_poe_remain_watts') // device model version ip mac site site_id device_type
// Device download traffic.
const deviceDownload = new CounterMetric('omada_device_download') // device model version ip mac site site_id device_type
// Device upload traffic.
const deviceUpload = new CounterMetric('omada_device_upload') // device model version ip mac site site_id device_type
// The current PoE usage of the port in watts.
const portPowerWatts = new GaugeMetric('omada_port_power_watts') // device device_mac client vendor switch_port name switch_mac switch_id vlan_id profile site site_id
// A boolean representing the link status of the port.
const portLinkStatus = new GaugeMetric('omada_port_link_status') // device device_mac client vendor switch_port name switch_mac switch_id vlan_id profile site site_id
// Port link speed in mbps. This is the capability of the connection, not the active throughput.
const portLinkSpeedMbps = new GaugeMetric('omada_port_link_speed_mbps') // device device_mac client vendor switch_port name switch_mac switch_id vlan_id profile site site_id
// Bytes recieved on a port.
const portLinkRx = new CounterMetric('omada_port_link_rx') // device device_mac client vendor switch_port name switch_mac switch_id vlan_id profile site site_id
// Bytes transmitted on a port.
const portLinkTx = new CounterMetric('omada_port_link_tx') // device device_mac client vendor switch_port name switch_mac switch_id vlan_id profile site site_id

const selectors = `site=~"$site"`

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Omada Controller' }, [
    NewPanelRow({ datasource, height: 4 }, [
      //
      NewStatPanel({ title: 'Total PoE Used', defaultUnit: Unit.WATT, reduceCalc: 'lastNotNull' }, portPowerWatts.calc('sum', { selectors }).target()),
      NewStatPanel({ title: 'Controller Uptime', defaultUnit: Unit.SECONDS }, controllerUptimeSeconds.calc('max', { selectors, type: 'instant' }).target()),
      NewStatPanel({ title: 'Active Switch Ports', reduceCalc: 'lastNotNull' }, portLinkStatus.calc('sum', { selectors }).target()),
      NewStatPanel({ title: 'Connected Clients', reduceCalc: 'lastNotNull' }, clientConnectedTotal.calc('sum', { selectors }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Devices' }, [
    NewPanelRow({ datasource, height: 10 }, [
      //
      NewTimeSeriesPanel({ title: 'CPU Usage %', defaultUnit: Unit.PERCENT, max: 100 }, deviceCpuPercentage.calc('sum', { selectors, groupBy: ['device', 'device_type', 'ip'] }).target()),
      NewTimeSeriesPanel({ title: 'Memory Usage %', defaultUnit: Unit.PERCENT, max: 100 }, deviceMemPercentage.calc('sum', { selectors, groupBy: ['device', 'device_type', 'ip'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({
        title: 'Rx/Tx Rate',
        targets: [
          //
          deviceRxRate.calc('sum', { selectors, groupBy: ['device', 'device_type', 'ip'] }).target({ refId: 'RX', legendFormat: 'Rx - {{ device }} {{ device_type }} {{ ip }}' }),
          deviceTxRate.calc('sum', { selectors, prepend: '-', groupBy: ['device', 'device_type', 'ip'] }).target({ refId: 'TX', legendFormat: 'Tx - {{ device }} {{ device_type }} {{ ip }}' }),
        ],
        defaultUnit: Unit.BYTES_PER_SEC_SI,
        legendCalcs: ['mean', 'last'],
      }),
      NewTimeSeriesPanel({ title: 'Uptime', defaultUnit: Unit.SECONDS }, deviceUptimeSeconds.calc('max', { selectors, groupBy: ['device', 'device_type', 'ip'] }).target()),
      NewTimeSeriesPanel({ title: 'PoE remaining', defaultUnit: Unit.WATT }, devicePoeRemainWatts.calc('max', { selectors, groupBy: ['device', 'device_type', 'ip'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Clients' }, [
    NewPanelRow({ datasource, height: 10 }, [
      //
      NewTimeSeriesPanel({ title: 'Clients Connected', defaultUnit: Unit.SHORT }, clientConnectedTotal.calc('sum', { selectors, groupBy: ['connection_mode', 'wifi_mode'] }).target()),
      NewTimeSeriesPanel({ title: 'Signal Percentage', defaultUnit: Unit.PERCENT, max: 100 }, clientSignalPct.calc('sum', { selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({ title: 'RSSI dBm', defaultUnit: Unit.DBM, legendCalcs: ['mean', 'min', 'last'] }, clientRssiDbm.calc('sum', { selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
      NewTimeSeriesPanel({ title: 'SNR dBm', defaultUnit: Unit.DBM, legendCalcs: ['mean', 'min', 'last'] }, clientSnrDbm.calc('sum', { selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      NewTimeSeriesPanel({ title: 'Upload Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, clientTrafficUpBytes.rate({ selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
      NewTimeSeriesPanel({ title: 'Download Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, clientTrafficDownBytes.rate({ selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
    ]),
    NewPanelRow({ datasource, height: 10 }, [
      //
      NewTimeSeriesPanel({ title: 'Rx Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, clientRxRate.calc('sum', { selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
      NewTimeSeriesPanel({ title: 'Tx Rate', defaultUnit: Unit.BYTES_PER_SEC_SI }, clientTxRate.calc('sum', { selectors: [selectors, `ip!=""`], groupBy: ['client', 'ap_name', 'connection_mode', 'ssid', 'vlan_id', 'wifi_mode'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Omada Ports' }, [
    NewPanelRow({ datasource, height: 24 }, [
      //
      NewTablePanel({
        //
        title: 'Port Link Status',
        tableConfig: {
          queries: {
            switch_port: { name: 'Switch Port' },
            name: { name: 'Name' },
            client: { name: 'Client' },
            vlan_id: { name: 'Vlan ID' },
            profile: { name: 'Profile' },
            device: { name: 'Device' },
            STATUS: {
              target: portLinkStatus.calc('sum', { selectors, groupBy: ['client', 'device', 'name', 'profile', 'site', 'switch_port', 'vlan_id'], type: 'instant' }).target(),
              name: 'Status',
              overrides: {
                mappings: [{ options: { '1': { color: 'green', index: 1, text: 'ON' }, '0': { color: 'red', index: 0, text: 'OFF' } }, type: 'value' }],
                'custom.cellOptions': { type: 'color-background', mode: 'gradient', applyToRow: false, wrapText: false },
              },
            },
            SPEED: { name: 'Speed', target: portLinkSpeedMbps.calc('sum', { selectors, groupBy: ['client', 'device', 'name', 'profile', 'site', 'switch_port', 'vlan_id'], type: 'instant' }).target(), unit: Unit.MIBITS },
            RX: { name: 'Rx', target: portLinkRx.increase({ selectors, groupBy: ['switch_port'], type: 'instant' }).target(), unit: Unit.BYTES_SI },
            TX: { name: 'Tx', target: portLinkTx.increase({ selectors, groupBy: ['switch_port'], type: 'instant' }).target(), unit: Unit.BYTES_SI },
            POWER: { name: 'Power', target: portPowerWatts.calc('sum', { selectors, groupBy: ['client', 'device', 'name', 'profile', 'site', 'switch_port', 'vlan_id'], type: 'instant' }).target(), unit: Unit.WATT },
          },
          excludeColumns: ['Time', 'site'],
          extraTransformations: [
            { id: 'convertFieldType', options: { conversions: [{ targetField: 'Switch Port', destinationType: 'number' }] } },
            { id: 'sortBy', options: { sort: [{ field: 'Switch Port' }] } },
          ],
        },
      }),
    ]),
  ]),
]

export const dashboard: Dashboard = {
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

export const rules: RuleGroup[] = [
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
