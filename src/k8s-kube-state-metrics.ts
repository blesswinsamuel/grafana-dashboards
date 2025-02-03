import { DataSourceRef, VizOrientation } from '@grafana/schema'
import { NewPanelGroup, NewPanelRow, NewStatPanel, NewTablePanel, NewTimeSeriesPanel, PanelGroup, Unit } from './grafana-helpers'
import { CounterMetric, GaugeMetric, SummaryMetric } from './promql-helpers'

// https://github.com/kubernetes/kube-state-metrics/tree/main/docs/metrics/workload

// cronjob metrics
const cronjobAnnotations = new GaugeMetric('kube_cronjob_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['cronjob', 'namespace', 'annotation_CRONJOB_ANNOTATION'] })
const cronjobInfo = new GaugeMetric('kube_cronjob_info', { labels: ['cronjob', 'namespace', 'schedule', 'concurrency_policy', 'timezone'] })
const cronjobLabels = new GaugeMetric('kube_cronjob_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['cronjob', 'namespace', 'label_CRONJOB_LABEL'] })
const cronjobCreated = new GaugeMetric('kube_cronjob_created', { labels: ['cronjob', 'namespace'] })
const cronjobNextScheduleTime = new GaugeMetric('kube_cronjob_next_schedule_time', { labels: ['cronjob', 'namespace'] })
const cronjobStatusActive = new GaugeMetric('kube_cronjob_status_active', { labels: ['cronjob', 'namespace'] })
const cronjobStatusLastScheduleTime = new GaugeMetric('kube_cronjob_status_last_schedule_time', { labels: ['cronjob', 'namespace'] })
const cronjobStatusLastSuccessfulTime = new GaugeMetric('kube_cronjob_status_last_successful_time', { labels: ['cronjob', 'namespace'] })
const cronjobSpecSuspend = new GaugeMetric('kube_cronjob_spec_suspend', { labels: ['cronjob', 'namespace'] })
const cronjobSpecStartingDeadlineSeconds = new GaugeMetric('kube_cronjob_spec_starting_deadline_seconds', { labels: ['cronjob', 'namespace'] })
const cronjobMetadataResourceVersion = new GaugeMetric('kube_cronjob_metadata_resource_version', { labels: ['cronjob', 'namespace'] })
const cronjobSpecSuccessfulJobHistoryLimit = new GaugeMetric('kube_cronjob_spec_successful_job_history_limit', { labels: ['cronjob', 'namespace'] })
const cronjobSpecFailedJobHistoryLimit = new GaugeMetric('kube_cronjob_spec_failed_job_history_limit', { labels: ['cronjob', 'namespace'] })

// daemonset metrics
const daemonsetAnnotations = new GaugeMetric('kube_daemonset_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['daemonset', 'namespace', 'annotation_DAEMONSET_ANNOTATION'] })
const daemonsetCreated = new GaugeMetric('kube_daemonset_created', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusCurrentNumberScheduled = new GaugeMetric('kube_daemonset_status_current_number_scheduled', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusDesiredNumberScheduled = new GaugeMetric('kube_daemonset_status_desired_number_scheduled', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusNumberAvailable = new GaugeMetric('kube_daemonset_status_number_available', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusNumberMisscheduled = new GaugeMetric('kube_daemonset_status_number_misscheduled', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusNumberReady = new GaugeMetric('kube_daemonset_status_number_ready', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusNumberUnavailable = new GaugeMetric('kube_daemonset_status_number_unavailable', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusObservedGeneration = new GaugeMetric('kube_daemonset_status_observed_generation', { labels: ['daemonset', 'namespace'] })
const daemonsetStatusUpdatedNumberScheduled = new GaugeMetric('kube_daemonset_status_updated_number_scheduled', { labels: ['daemonset', 'namespace'] })
const daemonsetMetadataGeneration = new GaugeMetric('kube_daemonset_metadata_generation', { labels: ['daemonset', 'namespace'] })
const daemonsetLabels = new GaugeMetric('kube_daemonset_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['daemonset', 'namespace', 'label_DAEMONSET_LABEL'] })

// deployment metrics
const deploymentAnnotations = new GaugeMetric('kube_deployment_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['deployment', 'namespace', 'annotation_DEPLOYMENT_ANNOTATION'] })
const deploymentStatusReplicas = new GaugeMetric('kube_deployment_status_replicas', { labels: ['deployment', 'namespace'] })
const deploymentStatusReplicasReady = new GaugeMetric('kube_deployment_status_replicas_ready', { labels: ['deployment', 'namespace'] })
const deploymentStatusReplicasAvailable = new GaugeMetric('kube_deployment_status_replicas_available', { labels: ['deployment', 'namespace'] })
const deploymentStatusReplicasUnavailable = new GaugeMetric('kube_deployment_status_replicas_unavailable', { labels: ['deployment', 'namespace'] })
const deploymentStatusReplicasUpdated = new GaugeMetric('kube_deployment_status_replicas_updated', { labels: ['deployment', 'namespace'] })
const deploymentStatusObservedGeneration = new GaugeMetric('kube_deployment_status_observed_generation', { labels: ['deployment', 'namespace'] })
const deploymentStatusCondition = new GaugeMetric('kube_deployment_status_condition', { labels: ['deployment', 'namespace', 'condition', 'status'] })
const deploymentSpecReplicas = new GaugeMetric('kube_deployment_spec_replicas', { labels: ['deployment', 'namespace'] })
const deploymentSpecPaused = new GaugeMetric('kube_deployment_spec_paused', { labels: ['deployment', 'namespace'] })
const deploymentSpecStrategyRollingUpdateMaxUnavailable = new GaugeMetric('kube_deployment_spec_strategy_rollingupdate_max_unavailable', { labels: ['deployment', 'namespace'] })
const deploymentSpecStrategyRollingUpdateMaxSurge = new GaugeMetric('kube_deployment_spec_strategy_rollingupdate_max_surge', { labels: ['deployment', 'namespace'] })
const deploymentMetadataGeneration = new GaugeMetric('kube_deployment_metadata_generation', { labels: ['deployment', 'namespace'] })
const deploymentLabels = new GaugeMetric('kube_deployment_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['deployment', 'namespace', 'label_DEPLOYMENT_LABEL'] })
const deploymentCreated = new GaugeMetric('kube_deployment_created', { labels: ['deployment', 'namespace'] })

// hpa metrics
const horizontalpodautoscalerInfo = new GaugeMetric('kube_horizontalpodautoscaler_info', { labels: ['horizontalpodautoscaler', 'namespace', 'scaletargetref_api_version', 'scaletargetref_kind', 'scaletargetref_name'] })
const horizontalpodautoscalerAnnotations = new GaugeMetric('kube_horizontalpodautoscaler_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['horizontalpodautoscaler', 'namespace', 'annotation_HORIZONTALPODAUTOSCALER_ANNOTATION'] })
const horizontalpodautoscalerLabels = new GaugeMetric('kube_horizontalpodautoscaler_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['horizontalpodautoscaler', 'namespace', 'label_HORIZONTALPODAUTOSCALER_LABEL'] })
const horizontalpodautoscalerMetadataGeneration = new GaugeMetric('kube_horizontalpodautoscaler_metadata_generation', { labels: ['horizontalpodautoscaler', 'namespace'] })
const horizontalpodautoscalerSpecMaxReplicas = new GaugeMetric('kube_horizontalpodautoscaler_spec_max_replicas', { labels: ['horizontalpodautoscaler', 'namespace'] })
const horizontalpodautoscalerSpecMinReplicas = new GaugeMetric('kube_horizontalpodautoscaler_spec_min_replicas', { labels: ['horizontalpodautoscaler', 'namespace'] })
const horizontalpodautoscalerSpecTargetMetric = new GaugeMetric('kube_horizontalpodautoscaler_spec_target_metric', { labels: ['horizontalpodautoscaler', 'namespace', 'metric_name', 'metric_target_type'] })
const horizontalpodautoscalerStatusTargetMetric = new GaugeMetric('kube_horizontalpodautoscaler_status_target_metric', { labels: ['horizontalpodautoscaler', 'namespace', 'metric_name', 'metric_target_type'] })
const horizontalpodautoscalerStatusCondition = new GaugeMetric('kube_horizontalpodautoscaler_status_condition', { labels: ['horizontalpodautoscaler', 'namespace', 'condition', 'status'] })
const horizontalpodautoscalerStatusCurrentReplicas = new GaugeMetric('kube_horizontalpodautoscaler_status_current_replicas', { labels: ['horizontalpodautoscaler', 'namespace'] })
const horizontalpodautoscalerStatusDesiredReplicas = new GaugeMetric('kube_horizontalpodautoscaler_status_desired_replicas', { labels: ['horizontalpodautoscaler', 'namespace'] })

// job metrics
const jobAnnotations = new GaugeMetric('kube_job_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['job', 'namespace', 'annotation_JOB_ANNOTATION'] })
const jobInfo = new GaugeMetric('kube_job_info', { labels: ['job', 'namespace'] })
const jobLabels = new GaugeMetric('kube_job_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['job', 'namespace', 'label_JOB_LABEL'] })
const jobOwner = new GaugeMetric('kube_job_owner', { labels: ['job', 'namespace', 'owner_kind', 'owner_name', 'owner_is_controller'] })
const jobSpecParallelism = new GaugeMetric('kube_job_spec_parallelism', { labels: ['job', 'namespace'] })
const jobSpecCompletions = new GaugeMetric('kube_job_spec_completions', { labels: ['job', 'namespace'] })
const jobSpecActiveDeadlineSeconds = new GaugeMetric('kube_job_spec_active_deadline_seconds', { labels: ['job', 'namespace'] })
const jobStatusActive = new GaugeMetric('kube_job_status_active', { labels: ['job', 'namespace'] })
const jobStatusSucceeded = new GaugeMetric('kube_job_status_succeeded', { labels: ['job', 'namespace'] })
const jobStatusFailed = new GaugeMetric('kube_job_status_failed', { labels: ['job', 'namespace', 'reason'] })
const jobStatusStartTime = new GaugeMetric('kube_job_status_start_time', { labels: ['job', 'namespace'] })
const jobStatusCompletionTime = new GaugeMetric('kube_job_status_completion_time', { labels: ['job', 'namespace'] })
const jobComplete = new GaugeMetric('kube_job_complete', { labels: ['job', 'namespace', 'condition'] })
const jobFailed = new GaugeMetric('kube_job_failed', { labels: ['job', 'namespace', 'condition'] })
const jobCreated = new GaugeMetric('kube_job_created', { labels: ['job', 'namespace'] })
const jobStatusSuspended = new GaugeMetric('kube_job_status_suspended', { labels: ['job', 'namespace'] })

// pod metrics
const podAnnotations = new GaugeMetric('kube_pod_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['pod', 'namespace', 'annotation_POD_ANNOTATION'] })
const podInfo = new GaugeMetric('kube_pod_info', { labels: ['pod', 'namespace', 'host_ip', 'pod_ip', 'node', 'created_by_kind', 'created_by_name', 'uid', 'priority_class', 'host_network'] })
const podIPs = new GaugeMetric('kube_pod_ips', { labels: ['pod', 'namespace', 'ip', 'ip_family', 'uid'] })
const podStartTime = new GaugeMetric('kube_pod_start_time', { labels: ['pod', 'namespace', 'uid'] })
const podCompletionTime = new GaugeMetric('kube_pod_completion_time', { labels: ['pod', 'namespace', 'uid'] })
const podOwner = new GaugeMetric('kube_pod_owner', { labels: ['pod', 'namespace', 'owner_kind', 'owner_name', 'owner_is_controller', 'uid'] })
const podLabels = new GaugeMetric('kube_pod_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['pod', 'namespace', 'label_POD_LABEL', 'uid'] })
const podNodeSelectors = new GaugeMetric('kube_pod_nodeselectors', { labels: ['pod', 'namespace', 'nodeselector_NODE_SELECTOR', 'uid'] })
const podStatusPhase = new GaugeMetric('kube_pod_status_phase', { labels: ['pod', 'namespace', 'phase', 'uid'] })
const podStatusQosClass = new GaugeMetric('kube_pod_status_qos_class', { labels: ['pod', 'namespace', 'qos_class', 'uid'] })
const podStatusReady = new GaugeMetric('kube_pod_status_ready', { labels: ['pod', 'namespace', 'condition', 'uid'] })
const podStatusScheduled = new GaugeMetric('kube_pod_status_scheduled', { labels: ['pod', 'namespace', 'condition', 'uid'] })
const podContainerInfo = new GaugeMetric('kube_pod_container_info', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusWaiting = new GaugeMetric('kube_pod_container_status_waiting', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusWaitingReason = new GaugeMetric('kube_pod_container_status_waiting_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podContainerStatusRunning = new GaugeMetric('kube_pod_container_status_running', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStateStarted = new GaugeMetric('kube_pod_container_state_started', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusTerminated = new GaugeMetric('kube_pod_container_status_terminated', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusTerminatedReason = new GaugeMetric('kube_pod_container_status_terminated_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podContainerStatusLastTerminatedReason = new GaugeMetric('kube_pod_container_status_last_terminated_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podContainerStatusLastTerminatedExitCode = new GaugeMetric('kube_pod_container_status_last_terminated_exitcode', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusLastTerminatedTimestamp = new GaugeMetric('kube_pod_container_status_last_terminated_timestamp', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podContainerStatusReady = new GaugeMetric('kube_pod_container_status_ready', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podStatusInitializedTime = new GaugeMetric('kube_pod_status_initialized_time', { labels: ['pod', 'namespace', 'uid'] })
const podStatusReadyTime = new GaugeMetric('kube_pod_status_ready_time', { labels: ['pod', 'namespace', 'uid'] })
const podStatusContainerReadyTime = new GaugeMetric('kube_pod_status_container_ready_time', { labels: ['pod', 'namespace', 'uid'] })
const podContainerStatusRestartsTotal = new CounterMetric('kube_pod_container_status_restarts_total', { labels: ['container', 'namespace', 'pod', 'uid'] })
const podContainerResourceRequests = new GaugeMetric('kube_pod_container_resource_requests', { labels: ['resource', 'unit', 'container', 'pod', 'namespace', 'node', 'uid'] })
const podContainerResourceLimits = new GaugeMetric('kube_pod_container_resource_limits', { labels: ['resource', 'unit', 'container', 'pod', 'namespace', 'node', 'uid'] })
const podOverheadCPUCores = new GaugeMetric('kube_pod_overhead_cpu_cores', { labels: ['pod', 'namespace', 'uid'] })
const podOverheadMemoryBytes = new GaugeMetric('kube_pod_overhead_memory_bytes', { labels: ['pod', 'namespace', 'uid'] })
const podRuntimeclassNameInfo = new GaugeMetric('kube_pod_runtimeclass_name_info', { labels: ['pod', 'namespace', 'uid'] })
const podCreated = new GaugeMetric('kube_pod_created', { labels: ['pod', 'namespace', 'uid'] })
const podStatusDeletionTimestamp = new GaugeMetric('kube_pod_deletion_timestamp', { labels: ['pod', 'namespace', 'uid'] })
const podRestartPolicy = new GaugeMetric('kube_pod_restart_policy', { labels: ['pod', 'namespace', 'type', 'uid'] })
const podInitContainerInfo = new GaugeMetric('kube_pod_init_container_info', { labels: ['container', 'pod', 'namespace', 'image', 'image_id', 'image_spec', 'container_id', 'uid', 'restart_policy'] })
const podInitContainerStatusWaiting = new GaugeMetric('kube_pod_init_container_status_waiting', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podInitContainerStatusWaitingReason = new GaugeMetric('kube_pod_init_container_status_waiting_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podInitContainerStatusRunning = new GaugeMetric('kube_pod_init_container_status_running', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podInitContainerStatusTerminated = new GaugeMetric('kube_pod_init_container_status_terminated', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podInitContainerStatusTerminatedReason = new GaugeMetric('kube_pod_init_container_status_terminated_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podInitContainerStatusLastTerminatedReason = new GaugeMetric('kube_pod_init_container_status_last_terminated_reason', { labels: ['container', 'pod', 'namespace', 'reason', 'uid'] })
const podInitContainerStatusReady = new GaugeMetric('kube_pod_init_container_status_ready', { labels: ['container', 'pod', 'namespace', 'uid'] })
const podInitContainerStatusRestartsTotal = new CounterMetric('kube_pod_init_container_status_restarts_total', { labels: ['container', 'namespace', 'pod', 'uid'] })
const podInitContainerResourceLimits = new GaugeMetric('kube_pod_init_container_resource_limits', { labels: ['resource', 'unit', 'container', 'pod', 'namespace', 'node', 'uid'] })
const podInitContainerResourceRequests = new GaugeMetric('kube_pod_init_container_resource_requests', { labels: ['resource', 'unit', 'container', 'pod', 'namespace', 'node', 'uid'] })
const podSpecVolumesPersistentvolumeclaimsInfo = new GaugeMetric('kube_pod_spec_volumes_persistentvolumeclaims_info', { labels: ['pod', 'namespace', 'volume', 'persistentvolumeclaim', 'uid'] })
const podSpecVolumesPersistentvolumeclaimsReadonly = new GaugeMetric('kube_pod_spec_volumes_persistentvolumeclaims_readonly', { labels: ['pod', 'namespace', 'volume', 'persistentvolumeclaim', 'uid'] })
const podStatusReason = new GaugeMetric('kube_pod_status_reason', { labels: ['pod', 'namespace', 'reason', 'uid'] })
const podStatusScheduledTime = new GaugeMetric('kube_pod_status_scheduled_time', { labels: ['pod', 'namespace', 'uid'] })
const podStatusUnschedulable = new GaugeMetric('kube_pod_status_unschedulable', { labels: ['pod', 'namespace', 'uid'] })
const podTolerations = new GaugeMetric('kube_pod_tolerations', { labels: ['pod', 'namespace', 'uid', 'key', 'operator', 'value', 'effect', 'toleration_seconds'] })
const podServiceAccount = new GaugeMetric('kube_pod_service_account', { labels: ['pod', 'namespace', 'uid', 'service_account'] })
const podScheduler = new GaugeMetric('kube_pod_scheduler', { labels: ['pod', 'namespace', 'uid', 'name'] })

// replicaset metrics
const replicasetAnnotations = new GaugeMetric('kube_replicaset_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['replicaset', 'namespace', 'annotation_REPLICASET_ANNOTATION'] })
const replicasetStatusReplicas = new GaugeMetric('kube_replicaset_status_replicas', { labels: ['replicaset', 'namespace'] })
const replicasetStatusFullyLabeledReplicas = new GaugeMetric('kube_replicaset_status_fully_labeled_replicas', { labels: ['replicaset', 'namespace'] })
const replicasetStatusReadyReplicas = new GaugeMetric('kube_replicaset_status_ready_replicas', { labels: ['replicaset', 'namespace'] })
const replicasetStatusObservedGeneration = new GaugeMetric('kube_replicaset_status_observed_generation', { labels: ['replicaset', 'namespace'] })
const replicasetSpecReplicas = new GaugeMetric('kube_replicaset_spec_replicas', { labels: ['replicaset', 'namespace'] })
const replicasetMetadataGeneration = new GaugeMetric('kube_replicaset_metadata_generation', { labels: ['replicaset', 'namespace'] })
const replicasetLabels = new GaugeMetric('kube_replicaset_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['replicaset', 'namespace', 'label_REPLICASET_LABEL'] })
const replicasetCreated = new GaugeMetric('kube_replicaset_created', { labels: ['replicaset', 'namespace'] })
const replicasetOwner = new GaugeMetric('kube_replicaset_owner', { labels: ['replicaset', 'namespace', 'owner_kind', 'owner_name', 'owner_is_controller'] })

// replicationcontroller metrics
const replicationcontrollerAnnotations = new GaugeMetric('kube_replicationcontroller_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['replicationcontroller', 'namespace', 'annotation_REPLICATIONCONTROLLER_ANNOTATION'] })
const replicationcontrollerStatusReplicas = new GaugeMetric('kube_replicationcontroller_status_replicas', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerStatusFullyLabeledReplicas = new GaugeMetric('kube_replicationcontroller_status_fully_labeled_replicas', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerStatusReadyReplicas = new GaugeMetric('kube_replicationcontroller_status_ready_replicas', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerStatusAvailableReplicas = new GaugeMetric('kube_replicationcontroller_status_available_replicas', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerStatusObservedGeneration = new GaugeMetric('kube_replicationcontroller_status_observed_generation', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerSpecReplicas = new GaugeMetric('kube_replicationcontroller_spec_replicas', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerMetadataGeneration = new GaugeMetric('kube_replicationcontroller_metadata_generation', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerCreated = new GaugeMetric('kube_replicationcontroller_created', { labels: ['replicationcontroller', 'namespace'] })
const replicationcontrollerOwner = new GaugeMetric('kube_replicationcontroller_owner', { labels: ['replicationcontroller', 'namespace', 'owner_kind', 'owner_name', 'owner_is_controller'] })

// statefulset metrics
const statefulsetAnnotations = new GaugeMetric('kube_statefulset_annotations', { description: 'Kubernetes annotations converted to Prometheus labels controlled via --metric-annotations-allowlist', labels: ['statefulset', 'namespace', 'annotation_STATEFULSET_ANNOTATION'] })
const statefulsetStatusReplicas = new GaugeMetric('kube_statefulset_status_replicas', { labels: ['statefulset', 'namespace'] })
const statefulsetStatusReplicasCurrent = new GaugeMetric('kube_statefulset_status_replicas_current', { labels: ['statefulset', 'namespace'] })
const statefulsetStatusReplicasReady = new GaugeMetric('kube_statefulset_status_replicas_ready', { labels: ['statefulset', 'namespace'] })
const statefulsetStatusReplicasAvailable = new GaugeMetric('kube_statefulset_status_replicas_available', { labels: ['statefulset', 'namespace'] })
const statefulsetStatusReplicasUpdated = new GaugeMetric('kube_statefulset_status_replicas_updated', { labels: ['statefulset', 'namespace'] })
const statefulsetStatusObservedGeneration = new GaugeMetric('kube_statefulset_status_observed_generation', { labels: ['statefulset', 'namespace'] })
const statefulsetReplicas = new GaugeMetric('kube_statefulset_replicas', { labels: ['statefulset', 'namespace'] })
const statefulsetOrdinalsStart = new GaugeMetric('kube_statefulset_ordinals_start', { labels: ['statefulset', 'namespace'] })
const statefulsetMetadataGeneration = new GaugeMetric('kube_statefulset_metadata_generation', { labels: ['statefulset', 'namespace'] })
const statefulsetPersistentvolumeclaimRetentionPolicy = new GaugeMetric('kube_statefulset_persistentvolumeclaim_retention_policy', { labels: ['statefulset', 'namespace', 'when_deleted', 'when_scaled'] })
const statefulsetCreated = new GaugeMetric('kube_statefulset_created', { labels: ['statefulset', 'namespace'] })
const statefulsetLabels = new GaugeMetric('kube_statefulset_labels', { description: 'Kubernetes labels converted to Prometheus labels controlled via --metric-labels-allowlist', labels: ['statefulset', 'namespace', 'label_STATEFULSET_LABEL'] })
const statefulsetStatusCurrentRevision = new GaugeMetric('kube_statefulset_status_current_revision', { labels: ['statefulset', 'namespace', 'revision'] })
const statefulsetStatusUpdateRevision = new GaugeMetric('kube_statefulset_status_update_revision', { labels: ['statefulset', 'namespace', 'revision'] })

export function podMetricsPanels({ datasource, title, selectors = [], collapsed }: { datasource?: DataSourceRef; title?: string; selectors?: string | string[]; collapsed?: boolean }): PanelGroup {
  const groupBy = ['namespace', 'pod']
  return NewPanelGroup({ title: title ?? 'Kubernetes Pod Metrics', collapsed }, [
    NewPanelRow({ datasource, height: 14 }, [
      NewTablePanel({
        title: 'Pod Info',
        tableConfig: {
          queries: {
            created_by_kind: { name: 'Created By' },
            created_by_name: { name: 'Created By Name' },
            host_ip: { name: 'Host IP' },
            host_network: { name: 'Host Network' },
            namespace: { name: 'Namespace' },
            node: { name: 'Node' },
            pod: { name: 'Pod' },
            pod_ip: { name: 'Pod IP' },
            uid: { name: 'UID' },

            'Pod Info': { target: podInfo.calc('max', { selectors, groupBy: podInfo.labels(), type: 'instant' }) },
            'Pod Start Time': { target: podStartTime.calc('max', { selectors, groupBy: podStartTime.labels(), type: 'instant' }) },
            'Pod Completion Time': { target: podCompletionTime.calc('max', { selectors, groupBy: podCompletionTime.labels(), type: 'instant' }) },
          },
          excludeColumns: ['Time', 'Value #Pod Info'],
        },
      }),
    ]),
  ])
}
