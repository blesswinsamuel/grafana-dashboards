import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard'
import { common, GaugeMetric, goRuntimeMetricsPanels, newDashboard, NewPanelGroup, NewPanelRow, NewPrometheusDatasourceVariable, NewQueryVariable, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelRowAndGroups, promql, table, tableExcludeByName, tableIndexByName, units, withPanels } from '../src/grafana-helpers'
import { PrometheusTarget, Target } from '../src/helpers/panels/target'
import { WrapFn } from '../src/helpers/promql'

// https://github.com/matusnovak/prometheus-smartctl
// https://grafana.com/grafana/dashboards/10664-smart-disk-data/
// https://github.com/prometheus-community/smartctl_exporter/blob/master/metrics.go

const datasource: dashboard.DataSourceRef = {
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
const metricDeviceNVMeCapacityBytes = new GaugeMetric('smartctl_device_nvme_capacity_bytes') // device
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

const errorThresholds = {
  mode: dashboard.ThresholdsMode.Absolute,
  steps: [
    { color: 'green', value: null },
    { color: 'red', value: 1 },
  ],
}
const selectors = [`instance=~"$instance"`, `job="$job"`]
const selectorsWithSerialNo = [...selectors, `serial_number=~"$serial_number"`]

const overviewStats = NewPanelRow({ datasource, height: 3 }, [
  NewStatPanel({ title: 'Devices count', targets: [{ expr: `sum(${metricDeviceCount.metric}{instance=~"$instance", job="$job"})` }] }),
  NewStatPanel({ title: 'Missing devices', targets: [{ expr: `sum(${metricDeviceCount.metric}{instance=~"$instance", job="$job"}) - sum(${metricDeviceModel.metric}{instance=~"$instance", job="$job"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'Exit status', targets: [{ expr: `max(${metricDeviceExitStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'Error log entries', targets: [{ expr: `sum(${metricDeviceNumErrLogEntries.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'Media errors', targets: [{ expr: `sum(${metricDeviceMediaErrors.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'SMART error log count', targets: [{ expr: `sum(${metricDeviceErrorLogCount.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'Critical warnings', targets: [{ expr: `sum(${metricDeviceCriticalWarning.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
  NewStatPanel({ title: 'SMART failed', targets: [{ expr: `sum(1 - ${metricDeviceSmartStatus.metric}{instance=~"$instance", job="$job"} * on (device, instance) ${metricDeviceModel.metric}{serial_number=~"$serial_number"})` }], thresholds: errorThresholds }),
])

const deviceInfoTablePanel = () => {
  return NewPanelRow({ datasource, height: 14 }, [
    NewTablePanel({
      title: 'Device Info',
      queries: {
        value: { target: metricDeviceModel.raw({ selectors: selectorsWithSerialNo, type: 'instant' }).target({ format: 'table', type: 'instant' }) },
        instance: { name: 'Instance' },
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
      excludeColumns: ['__name__', 'Time', 'Value', 'job'],
      sortBy: [{ col: 'Instance' }],
    }),
  ])
}

const smartOverviewTablePanel = () => {
  const getTarget = (metric: GaugeMetric, extraSelectors: string = ''): Target => {
    return {
      expr: promql.sum(
        promql.mul(
          metric.raw({ selectors: [...selectors, extraSelectors] }),
          metricDeviceModel.raw({ selectors: selectorsWithSerialNo }),
        ).on(['device', 'instance']),
      ).by(['instance', 'device']),
      format: 'table',
      type: 'instant',
    }
  }

  return NewPanelRow({ datasource, height: 14 }, [
    NewTablePanel({
      title: 'SMART overview',
      queries: {
        instance: { name: 'Instance', width: 320 },
        device: { name: 'Device', width: 70 },
        model_name: { name: 'Model name', width: 220 },
        DEVICE: { target: metricDeviceModel.calc('sum', { selectors: selectorsWithSerialNo, type: 'instant', groupBy: ['instance', 'device', 'model_name'] }).target() },
        Temperature: { unit: units.Celsius, target: getTarget(metricDeviceTemperature, 'temperature_type="current"') },
        'Exit status': { target: getTarget(metricDeviceExitStatus) },
        Passed: { name: 'Passed', target: getTarget(metricDeviceSmartStatus) },
        'Power on seconds': { unit: units.Seconds, target: getTarget(metricDevicePowerOnSeconds) },
        'Power Cycle Count': { target: getTarget(metricDevicePowerCycleCount) },
        'Device interface speed': { unit: units.BitsPerSecondSI, target: getTarget(metricDeviceInterfaceSpeed, 'speed_type="current"') },
        'Capacity Bytes': { unit: units.BytesIEC, target: getTarget(metricDeviceCapacityBytes) },
        'Capacity Blocks': { unit: units.Short, target: getTarget(metricDeviceCapacityBlocks) },
        'Block size (logical)': { unit: units.BytesIEC, target: getTarget(metricDeviceBlockSize, 'blocks_type="logical"') },
        'Block size (physical)': { unit: units.BytesIEC, target: getTarget(metricDeviceBlockSize, 'blocks_type="physical"') },
        'Error log count': { target: getTarget(metricDeviceErrorLogCount) },
      },
      excludeColumns: ['Time', 'Value #DEVICE'],
      sortBy: [{ col: 'Instance' }],
    }),
  ])
}

const smartAttributesTablePanel = () => {
  return NewPanelRow({ datasource, height: 8 }, [
    NewTablePanel({
      title: 'SMART attributes',
      targets: [{
        expr: promql.mul(
          metricDeviceAttribute.raw({ selectors }),
          metricDeviceModel.raw({ selectors: selectorsWithSerialNo }),
        ).on(['device', 'instance']).groupLeft(['model_name']),
        format: 'table',
        type: 'instant',
      }],
      queries: {
        instance: { name: 'Instance', width: 320 },
        device: { name: 'Device', width: 70 },
        model_name: { name: 'Model Name', width: 220 },
        attribute_id: { name: 'Attribute ID' },
        attribute_name: { name: 'Attribute Name' },
        attribute_value_type: { name: 'Attribute value type' },
        attribute_flags_long: { name: 'Attribute flags (long)' },
        attribute_flags_short: { name: 'Attribute flags (short)' },
        Value: { name: 'Value' },
      },
      transformations: [
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
      sortBy: [{ col: 'Instance' }],
    }),
  ])
}

const timeSeriesGroup = () => {
  const queryWithModelNameLegendFormat = '{{ model_name }} ({{ instance }}/{{ device }})'
  const getTarget = (metric: GaugeMetric, extraSelectors: string = '', deviceModelExtraSelectors: string = ''): PrometheusTarget => {
    return {
      expr: promql.sum(
        promql.mul(
          metric.raw({ selectors: [...selectors, extraSelectors] }),
          metricDeviceModel.raw({ selectors: [...selectorsWithSerialNo, deviceModelExtraSelectors] }),
        ).on(['device', 'instance']).groupLeft(['model_name']),
      ).by(['model_name', 'device', 'instance']),
      legendFormat: queryWithModelNameLegendFormat,
    }
  }

  return NewPanelGroup({ title: 'Metrics' }, [
    // available labels: entrypoint, code, method, protocol
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Temperature', unit: units.Celsius }, getTarget(metricDeviceTemperature, 'temperature_type="current"')),
      NewTimeSeriesPanel({ title: 'Smartctl exit status' }, getTarget(metricDeviceExitStatus)),
      NewTimeSeriesPanel({ title: 'SMART passed' }, getTarget(metricDeviceSmartStatus)),
      NewTimeSeriesPanel({ title: 'Power on duration', unit: units.Seconds }, getTarget(metricDevicePowerOnSeconds)),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Power cycle count' }, getTarget(metricDevicePowerCycleCount)),
      NewTimeSeriesPanel({ title: 'Write percentage used' }, getTarget(metricDevicePercentageUsed)),
      NewTimeSeriesPanel({ title: 'NVMe capacity bytes', unit: units.BytesIEC }, {
        expr: promql.or(
          getTarget(metricDeviceNVMeCapacityBytes).expr as promql.Builder<promql.Expr>,
          getTarget(metricDeviceCapacityBytes, '', 'protocol="NVMe"').expr as promql.Builder<promql.Expr>,
        ),
        legendFormat: queryWithModelNameLegendFormat,
      }),
      NewTimeSeriesPanel({ title: 'Number of error log entries', description: 'Contains the number of Error Information log entries over the life of the controller' }, getTarget(metricDeviceNumErrLogEntries)),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({
        title: 'Number of media errors',
        description: 'Contains the number of occurrences where the controller detected an unrecovered data integrity error. Errors such as uncorrectable ECC, CRC checksum failure, or LBA tag mismatch are included in this field',
      }, getTarget(metricDeviceMediaErrors)),
      NewTimeSeriesPanel({ title: 'SMART error log count' }, getTarget(metricDeviceErrorLogCount, 'error_log_type="summary"')),
      NewTimeSeriesPanel({ title: 'Critical warnings for state of controller' }, getTarget(metricDeviceCriticalWarning)),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Interface speed (current)', unit: units.BitsPerSecondSI }, getTarget(metricDeviceInterfaceSpeed, 'speed_type="current"')),
      NewTimeSeriesPanel({ title: 'Interface speed (max)', unit: units.BitsPerSecondSI }, getTarget(metricDeviceInterfaceSpeed, 'speed_type="max"')),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Capacity Bytes', unit: units.BytesIEC }, getTarget(metricDeviceCapacityBytes)),
      NewTimeSeriesPanel({ title: 'Capacity Blocks', unit: units.Short }, getTarget(metricDeviceCapacityBlocks)),
      NewTimeSeriesPanel({ title: 'Bytes written', unit: units.BytesIEC }, getTarget(metricDeviceBytesWritten)),
      NewTimeSeriesPanel({ title: 'Bytes read', unit: units.BytesIEC }, getTarget(metricDeviceBytesRead)),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Block size (logical)', unit: units.BytesIEC }, getTarget(metricDeviceBlockSize, 'blocks_type="logical"')),
      NewTimeSeriesPanel({ title: 'Block size (physical)', unit: units.BytesIEC }, getTarget(metricDeviceBlockSize, 'blocks_type="physical"')),
      NewTimeSeriesPanel({
        title: 'Available spare threshold',
        description: 'When the Available Spare falls below the threshold indicated in this field, an asynchronous event completion may occur. The value is indicated as a normalized percentage (0 to 100%)',
        unit: units.Percent,
      }, getTarget(metricDeviceAvailableSpareThreshold)),
      NewTimeSeriesPanel({ title: 'Available spare', description: 'Normalized percentage (0 to 100%) of the remaining spare capacity available', unit: units.Percent }, getTarget(metricDeviceAvailableSpare)),
    ]),
  ])
}

const panels: PanelRowAndGroups = [
  //
  NewPanelGroup({ title: 'Overview' }, [
    //
    overviewStats,
    deviceInfoTablePanel(),
    smartOverviewTablePanel(),
    smartAttributesTablePanel(),
  ]),
  timeSeriesGroup(),
  goRuntimeMetricsPanels({ datasource, selectors, collapsed: true }),
]

export const smartctlDashboard = newDashboard({
  variables: [
    NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
    NewQueryVariable({ datasource, name: 'job', label: 'Job', query: `label_values(${metricSmartctlVersion.metric}, job)` }),
    NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: `label_values(${metricSmartctlVersion.metric}{job="$job"}, instance)`, includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'interface', label: 'Device Interface', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance"}, interface)`, includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'model_name', label: 'Model Name', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance", interface=~"$interface"}, model_name)`, includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'serial_number', label: 'Serial Number', query: `label_values(${metricDeviceModel.metric}{job="$job", instance=~"$instance", interface=~"$interface", model_name=~"$model_name"}, serial_number)`, includeAll: true, multi: true }),
  ],
  panels,
})
