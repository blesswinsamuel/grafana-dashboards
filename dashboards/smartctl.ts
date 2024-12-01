import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewGoRuntimeMetrics, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, tableExcludeByName, tableIndexByName, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

// https://github.com/matusnovak/prometheus-smartctl
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

const errorThresholds: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'green', value: null },
    { color: 'red', value: 1 },
  ],
}

function queryWithModelName(query: string, extraSelectors: string = '', func: string = ''): string {
  let r = `${query}{instance=~"$instance", job="$job"${extraSelectors ? ',' + extraSelectors : ''}} * on(device, instance) group_left(model_name) smartctl_device{instance=~"$instance"}`
  if (func) {
    r = `${func}(${r})`
  }
  return `sum by (model_name) (${r})`
}

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({ title: 'Devices count', targets: [{ expr: 'sum(smartctl_devices{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT }),
      NewStatPanel({ title: 'Missing devices', targets: [{ expr: 'sum(smartctl_devices{instance=~"$instance", job="$job"}) - sum(smartctl_device{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Exit status', targets: [{ expr: 'max(smartctl_device_smartctl_exit_status{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Error log entries', targets: [{ expr: 'sum(smartctl_device_num_err_log_entries{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Media errors', targets: [{ expr: 'sum(smartctl_device_media_errors{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'SMART error log count', targets: [{ expr: 'sum(smartctl_device_error_log_count{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Critical warnings', targets: [{ expr: 'sum(smartctl_device_critical_warning{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'SMART failed', targets: [{ expr: 'sum(1 - smartctl_device_smart_status{instance=~"$instance", job="$job"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'Device Info',
        targets: [{ expr: 'smartctl_device{instance=~"$instance", job="$job"}', format: 'table', type: 'instant' }],
        transformations: [
          {
            id: 'organize',
            options: {
              excludeByName: { __name__: true, Time: true, Value: true, instance: true, job: true },
              indexByName: tableIndexByName(['device', 'model_name', 'form_factor', 'serial_number', 'protocol', 'ata_version', 'firmware_version', 'ata_additional_product_id', 'interface', 'model_family', 'sata_version']),
              renameByName: {
                device: 'Device',
                model_name: 'Model name',
                form_factor: 'Form factor',
                serial_number: 'Serial number',
                protocol: 'Protocol',
                ata_version: 'ATA version',
                firmware_version: 'Firmware version',
                ata_additional_product_id: 'ATA additional product ID',
                interface: 'Interface',
                model_family: 'Model family',
                sata_version: 'SATA version',
              },
            },
          },
        ],
      }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'SMART overview',
        targets: [
          { refId: 'DEVICE', expr: 'sum(smartctl_device{instance=~"$instance", job="$job"}) by (instance, device, model_name)', format: 'table', type: 'instant' },
          { refId: 'TEMP', expr: 'sum(smartctl_device_temperature{instance=~"$instance", job="$job", temperature_type="current"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'EXIT', expr: 'sum(smartctl_device_smartctl_exit_status{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'PASSED', expr: 'sum(smartctl_device_smart_status{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'POWON', expr: 'sum(smartctl_device_power_on_seconds{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'PCC', expr: 'sum(smartctl_device_power_cycle_count{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'INTSPEED', expr: 'sum(smartctl_device_interface_speed{instance=~"$instance", job="$job", speed_type="current"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'CAPBYTES', expr: 'sum(smartctl_device_capacity_bytes{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'CAPBLOCKS', expr: 'sum(smartctl_device_capacity_blocks{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'BLKSIZELOG', expr: 'sum(smartctl_device_block_size{blocks_type="logical", instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'BLKSIZEPHY', expr: 'sum(smartctl_device_block_size{blocks_type="physical", instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
          { refId: 'ERRLOGCNT', expr: 'sum(smartctl_device_error_log_count{instance=~"$instance", job="$job"}) by (instance, device)', format: 'table', type: 'instant' },
        ],
        overrides: [
          { matcher: { id: 'byName', options: 'Device' }, properties: [{ id: 'custom.width', value: 70 }] },
          { matcher: { id: 'byName', options: 'Instance' }, properties: [{ id: 'custom.width', value: 320 }] },
          { matcher: { id: 'byName', options: 'Model name' }, properties: [{ id: 'custom.width', value: 220 }] },
          { matcher: { id: 'byName', options: 'Temperature' }, properties: [{ id: 'unit', value: Unit.CELSIUS }] },
          { matcher: { id: 'byName', options: 'Power on seconds' }, properties: [{ id: 'unit', value: Unit.SECONDS }] },
          { matcher: { id: 'byName', options: 'Device interface speed' }, properties: [{ id: 'unit', value: Unit.BITS_PER_SEC_SI }] },
          { matcher: { id: 'byName', options: 'Capacity Bytes' }, properties: [{ id: 'unit', value: Unit.BYTES_IEC }] },
          { matcher: { id: 'byName', options: 'Capacity Blocks' }, properties: [{ id: 'unit', value: Unit.SHORT }] },
          { matcher: { id: 'byName', options: 'Block size (logical)' }, properties: [{ id: 'unit', value: Unit.BYTES_IEC }] },
          { matcher: { id: 'byName', options: 'Block size (physical)' }, properties: [{ id: 'unit', value: Unit.BYTES_IEC }] },
        ],
        transformations: [
          { id: 'merge', options: {} },
          { id: 'filterFieldsByName', options: { include: { pattern: '(device|model_name|instance|Value\\s.*)' } } },
          {
            id: 'organize',
            options: {
              excludeByName: tableExcludeByName(['Time', 'Value #DEVICE']),
              indexByName: {},
              renameByName: {
                instance: 'Instance',
                device: 'Device',
                model_name: 'Model name',
                'Value #TEMP': 'Temperature',
                'Value #EXIT': 'Exit status',
                'Value #PASSED': 'Passed',
                'Value #POWON': 'Power on seconds',
                'Value #PCC': 'Power Cycle Count',
                'Value #INTSPEED': 'Device interface speed',
                'Value #CAPBYTES': 'Capacity Bytes',
                'Value #CAPBLOCKS': 'Capacity Blocks',
                'Value #BLKSIZELOG': 'Block size (logical)',
                'Value #BLKSIZEPHY': 'Block size (physical)',
                'Value #ERRLOGCNT': 'Error log count',
              },
            },
          },
        ],
      }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'SMART attributes',
        targets: [{ expr: 'smartctl_device_attribute{instance=~"$instance", job="$job"} * on(device, instance) group_left(model_name) smartctl_device{instance=~"$instance", job="$job"}', format: 'table', type: 'instant' }],
        transformations: [
          {
            id: 'organize',
            options: {
              excludeByName: { __name__: true, Time: true, job: true },
              indexByName: tableIndexByName(['device', 'model_name', 'attribute_id', 'attribute_name', 'attribute_value_type', 'attribute_flags_long', 'attribute_flags_short', 'Value']),
              renameByName: {
                device: 'Device',
                attribute_flags_long: 'Attribute flags (long)',
                attribute_flags_short: 'Attribute flags (short)',
                attribute_id: 'Attribute ID',
                attribute_name: 'Attribute name',
                attribute_value_type: 'Attribute value type',
                model_name: 'Model Name',
              },
            },
          },
          {
            id: 'groupBy',
            options: {
              fields: {
                Instance: { aggregations: [], operation: 'groupby' },
                Device: { aggregations: [], operation: 'groupby' },
                'Model Name': { aggregations: [], operation: 'groupby' },
                'Attribute ID': { aggregations: [], operation: 'groupby' },
                'Attribute name': { aggregations: [], operation: 'groupby' },
                'Attribute flags (long)': { aggregations: [], operation: 'groupby' },
                'Attribute flags (short)': { aggregations: [], operation: 'groupby' },
                'Attribute value type': { aggregations: ['allValues'], operation: 'aggregate' },
                Value: { aggregations: ['allValues'], operation: 'aggregate' },
              },
            },
          },
        ],
      }),
    ]),
  ]),
  NewPanelGroup({ title: 'Metrics' }, [
    // available labels: entrypoint, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Temperature', targets: [{ expr: queryWithModelName('smartctl_device_temperature', 'temperature_type="current"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.CELSIUS }),
      NewTimeSeriesPanel({ title: 'Smartctl exit status', targets: [{ expr: queryWithModelName('smartctl_device_smartctl_exit_status'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'SMART passed', targets: [{ expr: queryWithModelName('smartctl_device_smart_status'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Power on duration', targets: [{ expr: queryWithModelName('smartctl_device_power_on_seconds', '', 'increase'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SECONDS, type: 'bar', interval: '1h' }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Power cycle count', targets: [{ expr: queryWithModelName('smartctl_device_power_cycle_count'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Write percentage used', targets: [{ expr: queryWithModelName('smartctl_device_percentage_used'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'NVMe capacity bytes', targets: [{ expr: queryWithModelName('smartctl_device_nvme_capacity_bytes'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Number of error log entries', description: 'Contains the number of Error Information log entries over the life of the controller', targets: [{ expr: queryWithModelName('smartctl_device_num_err_log_entries'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Number of media errors', description: 'Contains the number of occurrences where the controller detected an unrecovered data integrity error. Errors such as uncorrectable ECC, CRC checksum failure, or LBA tag mismatch are included in this field', targets: [{ expr: queryWithModelName('smartctl_device_media_errors'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'SMART error log count', targets: [{ expr: queryWithModelName('smartctl_device_error_log_count', 'error_log_type="summary"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Critical warnings for state of controller', targets: [{ expr: queryWithModelName('smartctl_device_critical_warning'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Interface speed (current)', targets: [{ expr: queryWithModelName('smartctl_device_interface_speed', 'speed_type="current"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BITS_PER_SEC_SI }),
      NewTimeSeriesPanel({ title: 'Interface speed (max)', targets: [{ expr: queryWithModelName('smartctl_device_interface_speed', 'speed_type="max"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BITS_PER_SEC_SI }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Capacity Bytes', targets: [{ expr: queryWithModelName('smartctl_device_capacity_bytes'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Capacity Blocks', targets: [{ expr: queryWithModelName('smartctl_device_capacity_blocks'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Bytes written', targets: [{ expr: queryWithModelName('smartctl_device_bytes_written'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Bytes read', targets: [{ expr: queryWithModelName('smartctl_device_bytes_read'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Block size (logical)', targets: [{ expr: queryWithModelName('smartctl_device_block_size', 'blocks_type="logical"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Block size (physical)', targets: [{ expr: queryWithModelName('smartctl_device_block_size', 'blocks_type="physical"'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Available spare threshold', description: 'When the Available Spare falls below the threshold indicated in this field, an asynchronous event completion may occur. The value is indicated as a normalized percentage (0 to 100%)', targets: [{ expr: queryWithModelName('smartctl_device_available_spare_threshold'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.PERCENT }),
      NewTimeSeriesPanel({ title: 'Available spare', description: 'Normalized percentage (0 to 100%) of the remaining spare capacity available', targets: [{ expr: queryWithModelName('smartctl_device_available_spare'), legendFormat: '{{ model_name }}' }], defaultUnit: Unit.PERCENT }),
    ]),
  ]),
  NewGoRuntimeMetrics({ datasource, selector: '{instance=~"$instance", job="$job"}' }),
]

export const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for smartctl',
  graphTooltip: DashboardCursorSync.Crosshair,
  tags: ['smartctl'],
  time: {
    from: 'now-6h',
    to: 'now',
  },
  title: 'Smartctl',
  uid: 'smartctl',
  version: 1,
  panels: autoLayout(panels),
  templating: {
    list: [
      //
      NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
      NewQueryVariable({ datasource, name: 'job', label: 'Job', query: 'label_values(smartctl_version, job)' }),
      NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(smartctl_version{job="$job"}, instance)', includeAll: true, multi: true }),
    ],
  },
}
