import { DataSourceRef, VizOrientation } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewStatPanel, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'
import { CounterMetric, GaugeMetric, SummaryMetric } from './promql-helpers'

// https://github.com/google/cadvisor/blob/master/docs/storage/prometheus.md

// container metrics
const containerBlkioDeviceUsageTotal = new CounterMetric('container_blkio_device_usage_total', { description: 'Blkio device bytes usage' })
const containerCpuCfsPeriodsTotal = new CounterMetric('container_cpu_cfs_periods_total', { description: 'Number of elapsed enforcement period intervals' })
const containerCpuCfsThrottledPeriodsTotal = new CounterMetric('container_cpu_cfs_throttled_periods_total', { description: 'Number of throttled period intervals' })
const containerCpuCfsThrottledSecondsTotal = new CounterMetric('container_cpu_cfs_throttled_seconds_total', { description: 'Total time duration the container has been throttled' })
const containerCpuLoadAverage10s = new GaugeMetric('container_cpu_load_average_10s', { description: 'Value of container cpu load average over the last 10 seconds' })
const containerCpuSchedstatRunPeriodsTotal = new CounterMetric('container_cpu_schedstat_run_periods_total', { description: 'Number of times processes of the cgroup have run on the cpu' })
const containerCpuSchedstatRunqueueSecondsTotal = new CounterMetric('container_cpu_schedstat_runqueue_seconds_total', { description: 'Time duration processes of the container have been waiting on a runqueue' })
const containerCpuSchedstatRunSecondsTotal = new CounterMetric('container_cpu_schedstat_run_seconds_total', { description: 'Time duration the processes of the container have run on the CPU' })
const containerCpuSystemSecondsTotal = new CounterMetric('container_cpu_system_seconds_total', { description: 'Cumulative system cpu time consumed' })
const containerCpuUsageSecondsTotal = new CounterMetric('container_cpu_usage_seconds_total', { description: 'Cumulative cpu time consumed' })
const containerCpuUserSecondsTotal = new CounterMetric('container_cpu_user_seconds_total', { description: 'Cumulative user cpu time consumed' })
const containerFileDescriptors = new GaugeMetric('container_file_descriptors', { description: 'Number of open file descriptors for the container' })
const containerFsInodesFree = new GaugeMetric('container_fs_inodes_free', { description: 'Number of available Inodes' })
const containerFsInodesTotal = new GaugeMetric('container_fs_inodes_total', { description: 'Total number of Inodes' })
const containerFsIoCurrent = new GaugeMetric('container_fs_io_current', { description: 'Number of I/Os currently in progress' })
const containerFsIoTimeSecondsTotal = new CounterMetric('container_fs_io_time_seconds_total', { description: 'Cumulative count of seconds spent doing I/Os' })
const containerFsIoTimeWeightedSecondsTotal = new CounterMetric('container_fs_io_time_weighted_seconds_total', { description: 'Cumulative weighted I/O time' })
const containerFsLimitBytes = new GaugeMetric('container_fs_limit_bytes', { description: 'Number of bytes that can be consumed by the container on this filesystem' })
const containerFsReadsBytesTotal = new CounterMetric('container_fs_reads_bytes_total', { description: 'Cumulative count of bytes read' })
const containerFsReadSecondsTotal = new CounterMetric('container_fs_read_seconds_total', { description: 'Cumulative count of seconds spent reading' })
const containerFsReadsMergedTotal = new CounterMetric('container_fs_reads_merged_total', { description: 'Cumulative count of reads merged' })
const containerFsReadsTotal = new CounterMetric('container_fs_reads_total', { description: 'Cumulative count of reads completed' })
const containerFsSectorReadsTotal = new CounterMetric('container_fs_sector_reads_total', { description: 'Cumulative count of sector reads completed' })
const containerFsSectorWritesTotal = new CounterMetric('container_fs_sector_writes_total', { description: 'Cumulative count of sector writes completed' })
const containerFsUsageBytes = new GaugeMetric('container_fs_usage_bytes', { description: 'Number of bytes that are consumed by the container on this filesystem' })
const containerFsWritesBytesTotal = new CounterMetric('container_fs_writes_bytes_total', { description: 'Cumulative count of bytes written' })
const containerFsWriteSecondsTotal = new CounterMetric('container_fs_write_seconds_total', { description: 'Cumulative count of seconds spent writing' })
const containerFsWritesMergedTotal = new CounterMetric('container_fs_writes_merged_total', { description: 'Cumulative count of writes merged' })
const containerFsWritesTotal = new CounterMetric('container_fs_writes_total', { description: 'Cumulative count of writes completed' })
const containerHugetlbFailcnt = new CounterMetric('container_hugetlb_failcnt', { description: 'Number of hugepage usage hits limits' })
const containerHugetlbMaxUsageBytes = new GaugeMetric('container_hugetlb_max_usage_bytes', { description: 'Maximum hugepage usages recorded' })
const containerHugetlbUsageBytes = new GaugeMetric('container_hugetlb_usage_bytes', { description: 'Current hugepage usage' })
const containerLlcOccupancyBytes = new GaugeMetric('container_llc_occupancy_bytes', { description: 'Last level cache usage statistics for container counted with RDT Memory Bandwidth Monitoring (MBM).' })
const containerMemoryBandwidthBytes = new GaugeMetric('container_memory_bandwidth_bytes', { description: 'Total memory bandwidth usage statistics for container counted with RDT Memory Bandwidth Monitoring (MBM).' })
const containerMemoryBandwidthLocalBytes = new GaugeMetric('container_memory_bandwidth_local_bytes', { description: 'Local memory bandwidth usage statistics for container counted with RDT Memory Bandwidth Monitoring (MBM).' })
const containerMemoryCache = new GaugeMetric('container_memory_cache', { description: 'Total page cache memory' })
const containerMemoryFailcnt = new CounterMetric('container_memory_failcnt', { description: 'Number of memory usage hits limits' })
const containerMemoryFailuresTotal = new CounterMetric('container_memory_failures_total', { description: 'Cumulative count of memory allocation failures' })
const containerMemoryMappedFile = new GaugeMetric('container_memory_mapped_file', { description: 'Size of memory mapped files' })
const containerMemoryMaxUsageBytes = new GaugeMetric('container_memory_max_usage_bytes', { description: 'Maximum memory usage recorded' })
const containerMemoryMigrate = new GaugeMetric('container_memory_migrate', { description: 'Memory migrate status' })
const containerMemoryNumaPages = new GaugeMetric('container_memory_numa_pages', { description: 'Number of used pages per NUMA node' })
const containerMemoryRss = new GaugeMetric('container_memory_rss', { description: 'Size of RSS' })
const containerMemorySwap = new GaugeMetric('container_memory_swap', { description: 'Container swap usage' })
const containerMemoryUsageBytes = new GaugeMetric('container_memory_usage_bytes', { description: 'Current memory usage, including all memory regardless of when it was accessed' })
const containerMemoryWorkingSetBytes = new GaugeMetric('container_memory_working_set_bytes', { description: 'Current working set' })
const containerNetworkAdvanceTcpStatsTotal = new GaugeMetric('container_network_advance_tcp_stats_total', { description: 'advanced tcp connections statistic for container' })
const containerNetworkReceiveBytesTotal = new CounterMetric('container_network_receive_bytes_total', { description: 'Cumulative count of bytes received' })
const containerNetworkReceiveErrorsTotal = new CounterMetric('container_network_receive_errors_total', { description: 'Cumulative count of errors encountered while receiving' })
const containerNetworkReceivePacketsDroppedTotal = new CounterMetric('container_network_receive_packets_dropped_total', { description: 'Cumulative count of packets dropped while receiving' })
const containerNetworkReceivePacketsTotal = new CounterMetric('container_network_receive_packets_total', { description: 'Cumulative count of packets received' })
const containerNetworkTcp6UsageTotal = new GaugeMetric('container_network_tcp6_usage_total', { description: 'tcp6 connection usage statistic for container' })
const containerNetworkTcpUsageTotal = new GaugeMetric('container_network_tcp_usage_total', { description: 'tcp connection usage statistic for container' })
const containerNetworkTransmitBytesTotal = new CounterMetric('container_network_transmit_bytes_total', { description: 'Cumulative count of bytes transmitted' })
const containerNetworkTransmitErrorsTotal = new CounterMetric('container_network_transmit_errors_total', { description: 'Cumulative count of errors encountered while transmitting' })
const containerNetworkTransmitPacketsDroppedTotal = new CounterMetric('container_network_transmit_packets_dropped_total', { description: 'Cumulative count of packets dropped while transmitting' })
const containerNetworkTransmitPacketsTotal = new CounterMetric('container_network_transmit_packets_total', { description: 'Cumulative count of packets transmitted' })
const containerNetworkUdp6UsageTotal = new GaugeMetric('container_network_udp6_usage_total', { description: 'udp6 connection usage statistic for container' })
const containerNetworkUdpUsageTotal = new GaugeMetric('container_network_udp_usage_total', { description: 'udp connection usage statistic for container' })
const containerOomEventsTotal = new CounterMetric('container_oom_events_total', { description: 'Count of out of memory events observed for the container' })
const containerPerfEventsScalingRatio = new GaugeMetric('container_perf_events_scaling_ratio', { description: 'Scaling ratio for perf event counter (event can be identified by event label and cpu indicates the core for which event was measured). See perf event configuration.' })
const containerPerfEventsTotal = new CounterMetric('container_perf_events_total', { description: 'Scaled counter of perf core event (event can be identified by event label and cpu indicates the core for which event was measured). See perf event configuration.' })
const containerPerfUncoreEventsScalingRatio = new GaugeMetric('container_perf_uncore_events_scaling_ratio', { description: 'Scaling ratio for perf uncore event counter (event can be identified by event label, pmu and socket lables indicate the PMU and the CPU socket for which event was measured). See perf event configuration. Metric exists only for main cgroup (id="/").' })
const containerPerfUncoreEventsTotal = new CounterMetric('container_perf_uncore_events_total', { description: 'Scaled counter of perf uncore event (event can be identified by event label, pmu and socket lables indicate the PMU and the CPU socket for which event was measured). See perf event configuration). Metric exists only for main cgroup (id="/").' })
const containerProcesses = new GaugeMetric('container_processes', { description: 'Number of processes running inside the container' })
const containerSockets = new GaugeMetric('container_sockets', { description: 'Number of open sockets for the container' })
const containerSpecCpuPeriod = new GaugeMetric('container_spec_cpu_period', { description: 'CPU period of the container' })
const containerSpecCpuQuota = new GaugeMetric('container_spec_cpu_quota', { description: 'CPU quota of the container' })
const containerSpecCpuShares = new GaugeMetric('container_spec_cpu_shares', { description: 'CPU share of the container' })
const containerSpecMemoryLimitBytes = new GaugeMetric('container_spec_memory_limit_bytes', { description: 'Memory limit for the container' })
const containerSpecMemoryReservationLimitBytes = new GaugeMetric('container_spec_memory_reservation_limit_bytes', { description: 'Memory reservation limit for the container' })
const containerSpecMemorySwapLimitBytes = new GaugeMetric('container_spec_memory_swap_limit_bytes', { description: 'Memory swap limit for the container' })
const containerStartTimeSeconds = new GaugeMetric('container_start_time_seconds', { description: 'Start time of the container since unix epoch' })
const containerTasksState = new GaugeMetric('container_tasks_state', { description: 'Number of tasks in given state (sleeping, running, stopped, uninterruptible, or ioawaiting)' })
const containerThreads = new GaugeMetric('container_threads', { description: 'Number of threads running inside the container' })
const containerThreadsMax = new GaugeMetric('container_threads_max', { description: 'Maximum number of threads allowed inside the container' })
const containerUlimitsSoft = new GaugeMetric('container_ulimits_soft', { description: 'Soft ulimit values for the container root process. Unlimited if -1, except priority and nice' })

// machine metrics
const machineCpuCacheCapacityBytes = new GaugeMetric('machine_cpu_cache_capacity_bytes', { description: 'Cache size in bytes assigned to NUMA node and CPU core' })
const machineCpuCores = new GaugeMetric('machine_cpu_cores', { description: 'Number of logical CPU cores' })
const machineCpuPhysicalCores = new GaugeMetric('machine_cpu_physical_cores', { description: 'Number of physical CPU cores' })
const machineCpuSockets = new GaugeMetric('machine_cpu_sockets', { description: 'Number of CPU sockets' })
const machineDimmCapacityBytes = new GaugeMetric('machine_dimm_capacity_bytes', { description: 'Total RAM DIMM capacity (all types memory modules) value labeled by dimm type, information is retrieved from sysfs edac per-DIMM API (/sys/devices/system/edac/mc/) introduced in kernel 3.6' })
const machineDimmCount = new GaugeMetric('machine_dimm_count', { description: 'Number of RAM DIMM (all types memory modules) value labeled by dimm type, information is retrieved from sysfs edac per-DIMM API (/sys/devices/system/edac/mc/) introduced in kernel 3.6' })
const machineMemoryBytes = new GaugeMetric('machine_memory_bytes', { description: 'Amount of memory installed on the machine' })
const machineSwapBytes = new GaugeMetric('machine_swap_bytes', { description: 'Amount of swap memory available on the machine' })
const machineNodeDistance = new GaugeMetric('machine_node_distance', { description: 'Distance between NUMA node and target NUMA node' })
const machineNodeHugepagesCount = new GaugeMetric('machine_node_hugepages_count', { description: 'Numer of hugepages assigned to NUMA node' })
const machineNodeMemoryCapacityBytes = new GaugeMetric('machine_node_memory_capacity_bytes', { description: 'Amount of memory assigned to NUMA node' })
const machineNvmAvgPowerBudgetWatts = new GaugeMetric('machine_nvm_avg_power_budget_watts', { description: 'NVM power budget' })
const machineNvmCapacity = new GaugeMetric('machine_nvm_capacity', { description: 'NVM capacity value labeled by NVM mode (memory mode or app direct mode)' })
const machineThreadSiblingsCount = new GaugeMetric('machine_thread_siblings_count', { description: 'Number of CPU thread siblings' })

export function cadvisorMetricsPanels({ datasource, title, selectors = [], groupBy = ['pod', 'instance'], collapsed }: { datasource?: DataSourceRef; title?: string; groupBy?: string[]; selectors?: string | string[]; collapsed?: boolean }): PanelGroup {
  return NewPanelGroup({ title: title ?? 'cAdvisor Metrics', collapsed }, [
    NewPanelRow({ datasource, height: 3 }, [
      //
      NewStatPanel({ title: 'Container Start Time (max)', defaultUnit: Unit.DATE_TIME_FROM_NOW }, containerStartTimeSeconds.calc('max', { selectors, type: 'instant', append: ' * 1000' })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'CPU Usage', defaultUnit: Unit.SHORT }, containerCpuUsageSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Usage' }, containerMemoryUsageBytes.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Working Set' }, containerMemoryWorkingSetBytes.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Cache', defaultUnit: Unit.BYTES_SI }, containerMemoryCache.calc('sum', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Threads' }, containerThreads.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Processes' }, containerProcesses.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'File Descriptors' }, containerFileDescriptors.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Sockets' }, containerSockets.calc('sum', { selectors, groupBy })),
    ]),
    // cpu
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'CPU Load Average 10s' }, containerCpuLoadAverage10s.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'CPU Usage User' }, containerCpuUserSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'CPU Usage System' }, containerCpuSystemSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'CPU Usage Throttled' }, containerCpuCfsThrottledSecondsTotal.calc('sum', 'rate', { selectors, groupBy })),
    ]),
    // memory
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Memory Failures' }, containerMemoryFailuresTotal.calc('sum', 'increase', { selectors, groupBy: [...groupBy, 'failure_type'] })),
      NewTimeSeriesPanel({ title: 'OOM Events' }, containerOomEventsTotal.calc('sum', 'increase', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Swap' }, containerMemorySwap.calc('sum', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Memory Failcnt' }, containerMemoryFailcnt.calc('sum', 'increase', { selectors, groupBy })),
    ]),
    // network
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Network Receive Bytes' }, containerNetworkReceiveBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Transmit Bytes' }, containerNetworkTransmitBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Receive Errors' }, containerNetworkReceiveErrorsTotal.calc('sum', 'increase', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Transmit Errors' }, containerNetworkTransmitErrorsTotal.calc('sum', 'increase', { selectors, groupBy })),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Network Receive Packets' }, containerNetworkReceivePacketsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Transmit Packets' }, containerNetworkTransmitPacketsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Receive Packets Dropped' }, containerNetworkReceivePacketsDroppedTotal.calc('sum', 'increase', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'Network Transmit Packets Dropped' }, containerNetworkTransmitPacketsDroppedTotal.calc('sum', 'increase', { selectors, groupBy })),
    ]),
    // fs
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'FS Reads Bytes' }, containerFsReadsBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'FS Writes Bytes' }, containerFsWritesBytesTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'FS Read rate' }, containerFsReadsTotal.calc('sum', 'rate', { selectors, groupBy })),
      NewTimeSeriesPanel({ title: 'FS Write rate' }, containerFsWritesTotal.calc('sum', 'rate', { selectors, groupBy })),
    ]),
  ])
}
