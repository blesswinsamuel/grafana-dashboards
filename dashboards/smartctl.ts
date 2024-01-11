import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import * as path from 'path'
import { NewGoRuntimeMetrics, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, tableIndexByName, writeDashboardAndPostToGrafana } from '../src/grafana-helpers'

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

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Overview' }, [
    NewPanelRow({ datasource, height: 3 }, [
      NewStatPanel({ title: 'Devices count', targets: [{ expr: 'smartctl_devices{instance=~"$instance"}' }], defaultUnit: Unit.SHORT }),
      NewStatPanel({ title: 'Missing devices', targets: [{ expr: 'smartctl_devices{instance=~"$instance"} - sum(smartctl_device{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Exit status', targets: [{ expr: 'sum(smartctl_device_smartctl_exit_status{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Error log entries', targets: [{ expr: 'sum(smartctl_device_num_err_log_entries{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Media errors', targets: [{ expr: 'sum(smartctl_device_media_errors{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'SMART error log count', targets: [{ expr: 'sum(smartctl_device_error_log_count{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
      NewStatPanel({ title: 'Critical warnings', targets: [{ expr: 'sum(smartctl_device_critical_warning{instance=~"$instance"})' }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTablePanel({
        title: 'Device Info',
        targets: [{ expr: 'smartctl_device{instance=~"$instance"}', format: 'table', type: 'instant' }],
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
        title: 'SMART attributes',
        targets: [{ expr: 'smartctl_device_attribute{instance=~"$instance"}', format: 'table', type: 'instant' }],
        transformations: [
          {
            id: 'organize',
            options: {
              excludeByName: { __name__: true, Time: true, instance: true, job: true },
              indexByName: tableIndexByName(['device', 'attribute_id', 'attribute_name', 'attribute_value_type', 'attribute_flags_long', 'attribute_flags_short', 'Value']),
              renameByName: {
                device: 'Device',
                attribute_flags_long: 'Attribute flags (long)',
                attribute_flags_short: 'Attribute flags (short)',
                attribute_id: 'Attribute ID',
                attribute_name: 'Attribute name',
                attribute_value_type: 'Attribute value type',
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
      NewTimeSeriesPanel({ title: 'Temperature', targets: [{ expr: 'smartctl_device_temperature{instance=~"$instance", temperature_type="current"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.CELSIUS }),
      NewTimeSeriesPanel({ title: 'Smartctl exit status', targets: [{ expr: 'smartctl_device_smartctl_exit_status{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'General smartctl status', targets: [{ expr: 'smartctl_device_smart_status{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Power on seconds', targets: [{ expr: 'smartctl_device_power_on_seconds{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SECONDS }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Power cycle count', targets: [{ expr: 'smartctl_device_power_cycle_count{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Write percentage used', targets: [{ expr: 'smartctl_device_percentage_used{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'NVMe capacity bytes', targets: [{ expr: 'smartctl_device_nvme_capacity_bytes{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Number of error log entries', description: 'Contains the number of Error Information log entries over the life of the controller', targets: [{ expr: 'smartctl_device_num_err_log_entries{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Number of media errors', description: 'Contains the number of occurrences where the controller detected an unrecovered data integrity error. Errors such as uncorrectable ECC, CRC checksum failure, or LBA tag mismatch are included in this field', targets: [{ expr: 'smartctl_device_media_errors{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'SMART error log count', targets: [{ expr: 'smartctl_device_error_log_count{instance=~"$instance", error_log_type="summary"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Critical warnings for state of controller', targets: [{ expr: 'smartctl_device_critical_warning{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Interface speed (current)', targets: [{ expr: 'smartctl_device_interface_speed{instance=~"$instance", speed_type="current"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BITS_PER_SEC_SI }),
      NewTimeSeriesPanel({ title: 'Interface speed (max)', targets: [{ expr: 'smartctl_device_interface_speed{instance=~"$instance", speed_type="max"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BITS_PER_SEC_SI }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Capacity Bytes', targets: [{ expr: 'smartctl_device_capacity_bytes{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Capacity Blocks', targets: [{ expr: 'smartctl_device_capacity_blocks{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.SHORT }),
      NewTimeSeriesPanel({ title: 'Bytes written', targets: [{ expr: 'smartctl_device_bytes_written{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Bytes read', targets: [{ expr: 'smartctl_device_bytes_read{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Block size (logical)', targets: [{ expr: 'smartctl_device_block_size{blocks_type="logical", instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Block size (physical)', targets: [{ expr: 'smartctl_device_block_size{blocks_type="physical", instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.BYTES_IEC }),
      NewTimeSeriesPanel({ title: 'Available spare threshold', description: 'When the Available Spare falls below the threshold indicated in this field, an asynchronous event completion may occur. The value is indicated as a normalized percentage (0 to 100%)', targets: [{ expr: 'smartctl_device_available_spare_threshold{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.PERCENT }),
      NewTimeSeriesPanel({ title: 'Available spare', description: 'Normalized percentage (0 to 100%) of the remaining spare capacity available', targets: [{ expr: 'smartctl_device_available_spare{instance=~"$instance"}', legendFormat: '{{ device }}' }], defaultUnit: Unit.PERCENT }),
    ]),
  ]),
  NewGoRuntimeMetrics({ datasource, selector: '{instance=~"$instance"}' }),
]

function cleanupServiceLabel(query: string): string {
  return `label_replace(${query}, "service", "$1", "service", "([^-]+-[^@]+)@.*")`
}

const dashboard: Dashboard = {
  ...defaultDashboard,
  description: 'Dashboard for smartctl',
  graphTooltip: DashboardCursorSync.Crosshair,
  style: 'dark',
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
    list: [NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }), NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(smartctl_version, instance)', includeAll: true, multi: true })],
  },
}

writeDashboardAndPostToGrafana({
  grafanaURL: process.env.GRAFANA_URL,
  dashboard,
  filename: path.join(__dirname, 'dist', 'smartctl.json'),
})
