import { Dashboard, DashboardCursorSync, DataSourceRef, ThresholdsConfig, ThresholdsMode, defaultDashboard } from '@grafana/schema'
import { GaugeMetric, NewPanelGroup, NewPanelRow, NewPrometheusDatasource as NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, Unit, autoLayout, goRuntimeMetricsPanels, tableExcludeByName, tableIndexByName } from '../src/grafana-helpers'

// https://github.com/matusnovak/prometheus-smartctl
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/
// https://github.com/prometheus-community/smartctl_exporter/blob/master/metrics.go

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

// smarctl version
const metricSmartctlVersion = new GaugeMetric('smartctl_version') // json_format_version, smartctl_version, svn_revision, build_info
// device info
const metricDeviceModel = new GaugeMetric('smartctl_device') // device, interface, protocol, model_family, model_name, serial_number, ata_additional_product_id, firmware_version, ata_version, sata_version, form_factor, scsi_vendor, scsi_product, scsi_revision, scsi_version
// Number of devices configured or dynamically discovered
const metricDeviceCount = new GaugeMetric('smartctl_devices')
// Device capacity in blocks
const metricDeviceCapacityBlocks = new GaugeMetric('smartctl_device_capacity_blocks') // device
// Device capacity in bytes
const metricDeviceCapacityBytes = new GaugeMetric('smartctl_device_capacity_bytes') // device
// NVMe device total capacity bytes
const metricDeviceTotalCapacityBytes = new GaugeMetric('smartctl_device_nvme_capacity_bytes') // device
// Device block size
const metricDeviceBlockSize = new GaugeMetric('smartctl_device_block_size') // device, blocks_type
// Device interface speed, bits per second
const metricDeviceInterfaceSpeed = new GaugeMetric('smartctl_device_interface_speed') // device, speed_type
// Device attributes
const metricDeviceAttribute = new GaugeMetric('smartctl_device_attribute') // device, attribute_name, attribute_flags_short, attribute_flags_long, attribute_value_type, attribute_id
// Device power on seconds
const metricDevicePowerOnSeconds = new GaugeMetric('smartctl_device_power_on_seconds') // device
// Device rotation rate
const metricDeviceRotationRate = new GaugeMetric('smartctl_device_rotation_rate') // device
// Device temperature celsius
const metricDeviceTemperature = new GaugeMetric('smartctl_device_temperature') // device, temperature_type
// Device power cycle count
const metricDevicePowerCycleCount = new GaugeMetric('smartctl_device_power_cycle_count') // device
// Device write percentage used
const metricDevicePercentageUsed = new GaugeMetric('smartctl_device_percentage_used') // device
// Normalized percentage (0 to 100%) of the remaining spare capacity available
const metricDeviceAvailableSpare = new GaugeMetric('smartctl_device_available_spare') // device
// When the Available Spare falls below the threshold indicated in this field, an asynchronous event completion may occur. The value is indicated as a normalized percentage (0 to 100%)
const metricDeviceAvailableSpareThreshold = new GaugeMetric('smartctl_device_available_spare_threshold') // device
// This field indicates critical warnings for the state of the controller
const metricDeviceCriticalWarning = new GaugeMetric('smartctl_device_critical_warning') // device
// Contains the number of occurrences where the controller detected an unrecovered data integrity error. Errors such as uncorrectable ECC, CRC checksum failure, or LBA tag mismatch are included in this field
const metricDeviceMediaErrors = new GaugeMetric('smartctl_device_media_errors') // device
// Contains the number of Error Information log entries over the life of the controller
const metricDeviceNumErrLogEntries = new GaugeMetric('smartctl_device_num_err_log_entries') // device
//
const metricDeviceBytesRead = new GaugeMetric('smartctl_device_bytes_read') // device
//
const metricDeviceBytesWritten = new GaugeMetric('smartctl_device_bytes_written') // device
// Device SMART status
const metricDeviceSmartStatus = new GaugeMetric('smartctl_device_smart_status') // device
// Exit status of smartctl on device
const metricDeviceExitStatus = new GaugeMetric('smartctl_device_smartctl_exit_status') // device
// Device state (0=active, 1=standby, 2=sleep, 3=dst, 4=offline, 5=sct)
const metricDeviceState = new GaugeMetric('smartctl_device_state') // device
// Device statistics
const metricDeviceStatistics = new GaugeMetric('smartctl_device_statistics') // device, statistic_table, statistic_name, statistic_flags_short, statistic_flags_long
// Device SMART error log count
const metricDeviceErrorLogCount = new GaugeMetric('smartctl_device_error_log_count') // device, error_log_type
// Device SMART self test log count
const metricDeviceSelfTestLogCount = new GaugeMetric('smartctl_device_self_test_log_count') // device, self_test_log_type
// Device SMART self test log error count
const metricDeviceSelfTestLogErrorCount = new GaugeMetric('smartctl_device_self_test_log_error_count') // device, self_test_log_type
// Device SMART Error Recovery Control Seconds
const metricDeviceERCSeconds = new GaugeMetric('smartctl_device_erc_seconds') // device, op_type
// Device SCSI grown defect list counter
const metricSCSIGrownDefectList = new GaugeMetric('smartctl_scsi_grown_defect_list') // device
// Read Errors Corrected by ReReads/ReWrites
const metricReadErrorsCorrectedByRereadsRewrites = new GaugeMetric('smartctl_read_errors_corrected_by_rereads_rewrites') // device
// Read Errors Corrected by ECC Fast
const metricReadErrorsCorrectedByEccFast = new GaugeMetric('smartctl_read_errors_corrected_by_eccfast') // device
// Read Errors Corrected by ECC Delayed
const metricReadErrorsCorrectedByEccDelayed = new GaugeMetric('smartctl_read_errors_corrected_by_eccdelayed') // device
// Read Total Uncorrected Errors
const metricReadTotalUncorrectedErrors = new GaugeMetric('smartctl_read_total_uncorrected_errors') // device
// Write Errors Corrected by ReReads/ReWrites
const metricWriteErrorsCorrectedByRereadsRewrites = new GaugeMetric('smartctl_write_errors_corrected_by_rereads_rewrites') // device
// Write Errors Corrected by ECC Fast
const metricWriteErrorsCorrectedByEccFast = new GaugeMetric('smartctl_write_errors_corrected_by_eccfast') // device
// Write Errors Corrected by ECC Delayed
const metricWriteErrorsCorrectedByEccDelayed = new GaugeMetric('smartctl_write_errors_corrected_by_eccdelayed') // device
// Write Total Uncorrected Errors
const metricWriteTotalUncorrectedErrors = new GaugeMetric('smartctl_write_total_uncorrected_errors') // device

const errorThresholds: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'green', value: null },
    { color: 'red', value: 1 },
  ],
}

const overviewStats = NewPanelRow({ datasource, height: 3 }, [
  NewStatPanel({ title: 'Devices count', targets: [{ expr: `sum(${metricDeviceCount.metric}{instance=~"$instance", job="$job"})` }], defaultUnit: Unit.SHORT }),
  NewStatPanel({ title: 'Missing devices', targets: [{ expr: `sum(${metricDeviceCount.metric}{instance=~"$instance", job="$job"}) - sum(${metricDeviceModel.metric}{instance=~"$instance", job="$job"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'Exit status', targets: [{ expr: `max(${metricDeviceExitStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'Error log entries', targets: [{ expr: `sum(${metricDeviceNumErrLogEntries.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'Media errors', targets: [{ expr: `sum(${metricDeviceMediaErrors.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'SMART error log count', targets: [{ expr: `sum(${metricDeviceErrorLogCount.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'Critical warnings', targets: [{ expr: `sum(${metricDeviceCriticalWarning.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
  NewStatPanel({ title: 'SMART failed', targets: [{ expr: `sum(1 - ${metricDeviceSmartStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], defaultUnit: Unit.SHORT, thresholds: errorThresholds }),
])

const deviceInfoTablePanel = NewPanelRow({ datasource, height: 14 }, [
  NewTablePanel({
    title: 'Device Info',
    tableConfig: {
      queries: {
        value: { target: metricDeviceModel.raw({ selectors: `instance=~"$instance", job="$job", serial_number=~"$serial_number"`, type: 'instant' }).target() },
        device: { name: 'Device' },
        model_name: { name: 'Model name' },
        form_factor: { name: 'Form factor' },
        serial_number: { name: 'Serial number' },
        protocol: { name: 'Protocol' },
        ata_version: { name: 'ATA version' },
        firmware_version: { name: 'Firmware version' },
        ata_additional_product_id: { name: 'ATA additional product ID' },
        interface: { name: 'Interface' },
        model_family: { name: 'Model family' },
        sata_version: { name: 'SATA version' },
      },
      excludeColumns: ['__name__', 'Time', 'Value', 'instance', 'job'],
    },
  }),
])

const smartOverviewTablePanel = NewPanelRow({ datasource, height: 14 }, [
  NewTablePanel({
    title: 'SMART overview',
    tableConfig: {
      queries: {
        device: { name: 'Device', width: 70 },
        instance: { name: 'Instance', width: 320 },
        model_name: { name: 'Model name', width: 220 },
        DEVICE: { target: metricDeviceModel.calc('sum', { selectors: `instance=~"$instance", job="$job", serial_number=~"$serial_number"`, type: 'instant', groupBy: ['instance', 'device', 'model_name'] }).target() },
        TEMP: { name: 'Temperature', unit: Unit.CELSIUS, target: { expr: `sum(${metricDeviceTemperature.metric}{instance=~"$instance", job="$job", temperature_type="current"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        EXIT: { name: 'Exit status', target: { expr: `sum(${metricDeviceExitStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        PASSED: { name: 'Passed', target: { expr: `sum(${metricDeviceSmartStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        POWON: { name: 'Power on seconds', unit: Unit.SECONDS, target: { expr: `sum(${metricDevicePowerOnSeconds.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        PCC: { name: 'Power Cycle Count', target: { expr: `sum(${metricDevicePowerCycleCount.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        INTSPEED: { name: 'Device interface speed', unit: Unit.BITS_PER_SEC_SI, target: { expr: `sum(${metricDeviceInterfaceSpeed.metric}{instance=~"$instance", job="$job", speed_type="current"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        CAPBYTES: { name: 'Capacity Bytes', unit: Unit.BYTES_IEC, target: { expr: `sum(${metricDeviceCapacityBytes.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        CAPBLOCKS: { name: 'Capacity Blocks', unit: Unit.SHORT, target: { expr: `sum(${metricDeviceCapacityBlocks.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        BLKSIZELOG: { name: 'Block size (logical)', unit: Unit.BYTES_IEC, target: { expr: `sum(${metricDeviceBlockSize.metric}{blocks_type="logical", instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        BLKSIZEPHY: { name: 'Block size (physical)', unit: Unit.BYTES_IEC, target: { expr: `sum(${metricDeviceBlockSize.metric}{blocks_type="physical", instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
        ERRLOGCNT: { name: 'Error log count', target: { expr: `sum(${metricDeviceErrorLogCount.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"}) by (instance, device)`, format: 'table', type: 'instant' } },
      },
      excludeColumns: ['Time', 'Value #DEVICE'],
    },
  }),
])

const smartAttributesTablePanel = NewPanelRow({ datasource, height: 8 }, [
  NewTablePanel({
    title: 'SMART attributes',
    targets: [{ expr: `${metricDeviceAttribute.metric}{instance=~"$instance", job="$job"} * on(device, instance) group_left(model_name) ${metricDeviceModel.metric}{instance=~"$instance", job="$job", serial_number=~"$serial_number"}`, format: 'table', type: 'instant' }],
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
])

const queryWithModelNameLegendFormat = '{{ model_name }} ({{ instance }}/{{ device }})'

function queryWithModelName(metric: GaugeMetric, extraSelectors: string = '', func: string = '') {
  let r = `${metric.metric}{instance=~"$instance", job="$job"${extraSelectors ? ',' + extraSelectors : ''}} * on(device, instance) group_left(model_name) ${metricDeviceModel.metric}{instance=~"$instance", job="$job", serial_number=~"$serial_number"}`
  if (func) {
    r = `${func}(${r})`
  }
  return [{ expr: `sum by (model_name, device, instance) (${r})`, legendFormat: queryWithModelNameLegendFormat }]
}

const timeSeriesGroup = NewPanelGroup({ title: 'Metrics' }, [
  // available labels: entrypoint, code, method, protocol
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Temperature', targets: queryWithModelName(metricDeviceTemperature, 'temperature_type="current"'), defaultUnit: Unit.CELSIUS }),
    NewTimeSeriesPanel({ title: 'Smartctl exit status', targets: queryWithModelName(metricDeviceExitStatus), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'SMART passed', targets: queryWithModelName(metricDeviceSmartStatus), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'Power on duration', targets: queryWithModelName(metricDevicePowerOnSeconds, '', 'increase'), defaultUnit: Unit.SECONDS, type: 'bar', interval: '1h' }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Power cycle count', targets: queryWithModelName(metricDevicePowerCycleCount), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'Write percentage used', targets: queryWithModelName(metricDevicePercentageUsed), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'NVMe capacity bytes', targets: queryWithModelName(metricDeviceTotalCapacityBytes), defaultUnit: Unit.BYTES_IEC }),
    NewTimeSeriesPanel({ title: 'Number of error log entries', description: 'Contains the number of Error Information log entries over the life of the controller', targets: queryWithModelName(metricDeviceNumErrLogEntries), defaultUnit: Unit.SHORT }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Number of media errors', description: 'Contains the number of occurrences where the controller detected an unrecovered data integrity error. Errors such as uncorrectable ECC, CRC checksum failure, or LBA tag mismatch are included in this field', targets: queryWithModelName(metricDeviceMediaErrors), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'SMART error log count', targets: queryWithModelName(metricDeviceErrorLogCount, 'error_log_type="summary"'), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'Critical warnings for state of controller', targets: queryWithModelName(metricDeviceCriticalWarning), defaultUnit: Unit.SHORT }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    //
    NewTimeSeriesPanel({ title: 'Interface speed (current)', targets: queryWithModelName(metricDeviceInterfaceSpeed, 'speed_type="current"'), defaultUnit: Unit.BITS_PER_SEC_SI }),
    NewTimeSeriesPanel({ title: 'Interface speed (max)', targets: queryWithModelName(metricDeviceInterfaceSpeed, 'speed_type="max"'), defaultUnit: Unit.BITS_PER_SEC_SI }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Capacity Bytes', targets: queryWithModelName(metricDeviceCapacityBytes), defaultUnit: Unit.BYTES_IEC }),
    NewTimeSeriesPanel({ title: 'Capacity Blocks', targets: queryWithModelName(metricDeviceCapacityBlocks), defaultUnit: Unit.SHORT }),
    NewTimeSeriesPanel({ title: 'Bytes written', targets: queryWithModelName(metricDeviceBytesWritten), defaultUnit: Unit.BYTES_IEC }),
    NewTimeSeriesPanel({ title: 'Bytes read', targets: queryWithModelName(metricDeviceBytesRead), defaultUnit: Unit.BYTES_IEC }),
  ]),
  NewPanelRow({ datasource, height: 8 }, [
    NewTimeSeriesPanel({ title: 'Block size (logical)', targets: queryWithModelName(metricDeviceBlockSize, 'blocks_type="logical"'), defaultUnit: Unit.BYTES_IEC }),
    NewTimeSeriesPanel({ title: 'Block size (physical)', targets: queryWithModelName(metricDeviceBlockSize, 'blocks_type="physical"'), defaultUnit: Unit.BYTES_IEC }),
    NewTimeSeriesPanel({ title: 'Available spare threshold', description: 'When the Available Spare falls below the threshold indicated in this field, an asynchronous event completion may occur. The value is indicated as a normalized percentage (0 to 100%)', targets: queryWithModelName(metricDeviceAvailableSpareThreshold), defaultUnit: Unit.PERCENT }),
    NewTimeSeriesPanel({ title: 'Available spare', description: 'Normalized percentage (0 to 100%) of the remaining spare capacity available', targets: queryWithModelName(metricDeviceAvailableSpare), defaultUnit: Unit.PERCENT }),
  ]),
])

const panels: PanelRowAndGroups = [
  //
  NewPanelGroup({ title: 'Overview' }, [
    //
    overviewStats,
    deviceInfoTablePanel,
    smartOverviewTablePanel,
    smartAttributesTablePanel,
  ]),
  timeSeriesGroup,
  goRuntimeMetricsPanels({ datasource, selectors: 'instance=~"$instance", job="$job"', collapsed: true }),
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
      NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
      NewQueryVariable({ datasource, name: 'job', label: 'Job', query: `label_values(${metricSmartctlVersion.metric}, job)` }),
      NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: `label_values(${metricSmartctlVersion.metric}{job="$job"}, instance)`, includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'interface', label: 'Device Interface', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance"}, interface)`, includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'model_name', label: 'Model Name', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance", interface=~"$interface"}, model_name)`, includeAll: true, multi: true }),
      NewQueryVariable({ datasource, name: 'serial_number', label: 'Serial Number', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance", interface=~"$interface", model_name=~"$model_name"}, serial_number)`, includeAll: true, multi: true }),
    ],
  },
}
