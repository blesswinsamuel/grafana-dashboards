import { DataSourceRef } from '@grafana/grafana-foundation-sdk/dashboard'
import { cadvisorMetricsPanels } from '../src/common-panels/k8s-cadvisor'
import { podMetricsPanels } from '../src/common-panels/k8s-kube-state-metrics'
import { CounterMetric, GaugeMetric, goRuntimeMetricsPanels, newDashboard, NewPanelGroup, NewPanelRow, NewPieChartPanel, NewPrometheusDatasourceVariable, NewQueryVariable, NewTimeSeriesPanel, PanelRowAndGroups, units } from '../src/grafana-helpers'

const datasource: DataSourceRef = {
  uid: '${DS_PROMETHEUS}',
}

// version
// Build info
const buildInfo = new GaugeMetric('postgres_exporter_build_info') // version, revision, branch, goversion, goos, goarch, tags
// Version string as reported by postgres
const version = new GaugeMetric('pg_version') // version, short_version

// internal
// Duration of the last scrape of metrics from PostgreSQL.
const pgScrapeDurationSeconds = new GaugeMetric('pg_exporter_last_scrape_duration_seconds')
// Total number of times PostgreSQL was scraped for metrics.
const pgScrapesTotal = new GaugeMetric('pg_exporter_scrapes_total')
// Whether the last scrape of metrics
const pgScrapeError = new GaugeMetric('pg_exporter_last_scrape_error')
// Whether the last scrape of metrics
const pgUp = new GaugeMetric('pg_up')
// Whether the user queries file was loaded and parsed successfully.
const pgUserQueriesLoadError = new GaugeMetric('pg_exporter_user_queries_load_error') // filename, hashsum

// collector
// postgres_exporter: Duration of a collector scrape.
const scrapeDuration = new GaugeMetric('pg_scrape_collector_duration_seconds') // collector
// postgres_exporter: Whether a collector succeeded.
const scrapeSuccess = new GaugeMetric('pg_scrape_collector_success') // collector

// builtin - pg_stat_database_conflicts
// Number of queries in this database that have been canceled due to dropped tablespaces
const pgStatDatabaseConflictsTablespace = new CounterMetric('pg_stat_database_conflicts_confl_tablespace') // datid, datname
// Number of queries in this database that have been canceled due to lock timeouts
const pgStatDatabaseConflictsLock = new CounterMetric('pg_stat_database_conflicts_confl_lock') // datid, datname
// Number of queries in this database that have been canceled due to old snapshots
const pgStatDatabaseConflictsSnapshot = new CounterMetric('pg_stat_database_conflicts_confl_snapshot') // datid, datname
// Number of queries in this database that have been canceled due to pinned buffers
const pgStatDatabaseConflictsBufferpin = new CounterMetric('pg_stat_database_conflicts_confl_bufferpin') // datid, datname
// Number of queries in this database that have been canceled due to deadlocks
const pgStatDatabaseConflictsDeadlock = new CounterMetric('pg_stat_database_conflicts_confl_deadlock') // datid, datname

// builtin - pg_stat_replication
// WAL position in bytes
const pgCurrentWalLsnBytes = new GaugeMetric('pg_stat_replication_pg_current_wal_lsn_bytes') // application_name, client_addr, state, slot_name
// Lag in bytes between master and slave
const pgXlogLocationDiff = new GaugeMetric('pg_stat_replication_pg_xlog_location_diff') // application_name, client_addr, state, slot_name
// Lag in bytes between master and slave
const pgWalLsnDiff = new GaugeMetric('pg_stat_replication_pg_wal_lsn_diff') // application_name, client_addr, state, slot_name

// builtin - pg_replication_slots
// Flag indicating if the slot is active
const pgReplicationSlotActive = new GaugeMetric('pg_replication_slots_active') // slot_name
// Replication lag in bytes
const pgReplicationSlotLagBytes = new GaugeMetric('pg_replication_slots_pg_wal_lsn_diff') // slot_name

// builtin - pg_stat_archiver
// Number of WAL files that have been successfully archived
const pgStatArchiverArchivedCount = new CounterMetric('pg_stat_archiver_archived_count')
// Number of failed attempts for archiving WAL files
const pgStatArchiverFailedCount = new CounterMetric('pg_stat_archiver_failed_count')
// Time in seconds since last WAL segment was successfully archived
const pgStatArchiverLastArchiveAge = new GaugeMetric('pg_stat_archiver_last_archive_age_seconds')

// builtin - pg_stat_activity
// number of connections in this state
const pgStatActivityCount = new GaugeMetric('pg_stat_activity_count') // datname, state, usename, application_name
// max duration in seconds any active transaction has been running
const pgStatActivityMaxTxDuration = new GaugeMetric('pg_stat_activity_max_tx_duration_seconds') // datname, state, usename, application_name

// database
// Disk space used by the database
const pgDatabaseSizeBytes = new GaugeMetric('pg_database_size_bytes') // datname
// Connection limit set for the database
const pgDatabaseConnectionLimits = new GaugeMetric('pg_database_connection_limit') // datname

// database wraparound
// Age of the oldest transaction ID that has not been frozen.
const databaseWraparoundAgeDatfrozenxid = new GaugeMetric('pg_database_wraparound_age_datfrozenxid_seconds') // datname
// Age of the oldest multi-transaction ID that has been replaced with a transaction ID.
const databaseWraparoundAgeDatminmxid = new GaugeMetric('pg_database_wraparound_age_datminmxid_seconds') // datname

// locks
// Number of locks
const pgLocksCount = new GaugeMetric('pg_locks_count') // datname, mode

// long running transactions
// Current number of long running transactions
const pgLongRunningTransactions = new GaugeMetric('pg_long_running_transactions')
// The current maximum transaction age in seconds
const pgLongRunningTransactionsOldestTimestampSeconds = new GaugeMetric('pg_long_running_transactions_oldest_timestamp_seconds')

// postmaster
// Time at which postmaster started
const pgPostMasterStartTimeSeconds = new GaugeMetric('pg_postmaster_start_time_seconds')

// process idle
// Idle time of server processes
const pgProcessIdleSeconds = new GaugeMetric('pg_process_idle_seconds') // state, application_name

// replication
// Replication lag behind master in seconds
const pgReplicationLag = new GaugeMetric('pg_replication_lag_seconds')
// Indicates if the server is a replica
const pgReplicationIsReplica = new GaugeMetric('pg_replication_is_replica')

// replication slot
// current wal lsn value
const pgReplicationSlotCurrentWalLsn = new GaugeMetric('pg_replication_slot_current_wal_lsn') // slot_name, slot_type
// last lsn confirmed flushed to the replication slot
const pgReplicationSlotCurrentFlushLsn = new GaugeMetric('pg_replication_slot_confirmed_flush_lsn') // slot_name, slot_type
// whether the replication slot is active or not
const pgReplicationSlotIsActive = new GaugeMetric('pg_replication_slot_is_active') // slot_name, slot_type
// number of bytes that can be written to WAL such that this slot is not in danger of getting in state lost
const pgReplicationSlotSafeWalSizeBytes = new GaugeMetric('pg_replication_slot_safe_wal_size_bytes') // slot_name, slot_type
// availability of WAL files claimed by this slot
const pgReplicationSlotWalStatus = new GaugeMetric('pg_replication_slot_wal_status') // slot_name, slot_type, wal_status

// roles
// Connection limit set for the role
const pgRolesConnectionLimits = new GaugeMetric('pg_roles_connection_limit') // rolname

// stat activity autovacuum
// Start timestamp of the vacuum process in seconds
const statActivityAutovacuumAgeInSeconds = new GaugeMetric('pg_stat_activity_autovacuum_timestamp_seconds') // relname

// stat bgwriter
// Number of scheduled checkpoints that have been performed
const statBGWriterCheckpointsTimed = new GaugeMetric('pg_stat_bgwriter_checkpoints_timed_total')
// Number of requested checkpoints that have been performed
const statBGWriterCheckpointsReq = new GaugeMetric('pg_stat_bgwriter_checkpoints_req_total')
// Total amount of time that has been spent in the portion of checkpoint processing where files are written to disk, in milliseconds
const statBGWriterCheckpointsReqTime = new GaugeMetric('pg_stat_bgwriter_checkpoint_write_time_total')
// Total amount of time that has been spent in the portion of checkpoint processing where files are synchronized to disk, in milliseconds
const statBGWriterCheckpointsSyncTime = new GaugeMetric('pg_stat_bgwriter_checkpoint_sync_time_total')
// Number of buffers written during checkpoints
const statBGWriterBuffersCheckpoint = new GaugeMetric('pg_stat_bgwriter_buffers_checkpoint_total')
// Number of buffers written by the background writer
const statBGWriterBuffersClean = new GaugeMetric('pg_stat_bgwriter_buffers_clean_total')
// Number of times the background writer stopped a cleaning scan because it had written too many buffers
const statBGWriterMaxwrittenClean = new GaugeMetric('pg_stat_bgwriter_maxwritten_clean_total')
// Number of buffers written directly by a backend
const statBGWriterBuffersBackend = new GaugeMetric('pg_stat_bgwriter_buffers_backend_total')
// Number of times a backend had to execute its own fsync call (normally the background writer handles those even when the backend does its own write)
const statBGWriterBuffersBackendFsync = new GaugeMetric('pg_stat_bgwriter_buffers_backend_fsync_total')
// Number of buffers allocated
const statBGWriterBuffersAlloc = new GaugeMetric('pg_stat_bgwriter_buffers_alloc_total')
// Time at which these statistics were last reset
const statBGWriterStatsReset = new GaugeMetric('pg_stat_bgwriter_stats_reset_total')

// stat checkpointer
// Number of scheduled checkpoints due to timeout
const statCheckpointerNumTimed = new GaugeMetric('pg_stat_checkpointer_num_timed_total')
// Number of requested checkpoints that have been performed
const statCheckpointerNumRequested = new GaugeMetric('pg_stat_checkpointer_num_requested_total')
// Number of scheduled restartpoints due to timeout or after a failed attempt to perform it
const statCheckpointerRestartpointsTimed = new GaugeMetric('pg_stat_checkpointer_restartpoints_timed_total')
// Number of requested restartpoints
const statCheckpointerRestartpointsReq = new GaugeMetric('pg_stat_checkpointer_restartpoints_req_total')
// Number of restartpoints that have been performed
const statCheckpointerRestartpointsDone = new GaugeMetric('pg_stat_checkpointer_restartpoints_done_total')
// Total amount of time that has been spent in the portion of processing checkpoints and restartpoints where files are written to disk, in milliseconds
const statCheckpointerWriteTime = new GaugeMetric('pg_stat_checkpointer_write_time_total')
// Total amount of time that has been spent in the portion of processing checkpoints and restartpoints where files are synchronized to disk, in milliseconds
const statCheckpointerSyncTime = new GaugeMetric('pg_stat_checkpointer_sync_time_total')
// Number of buffers written during checkpoints and restartpoints
const statCheckpointerBuffersWritten = new GaugeMetric('pg_stat_checkpointer_buffers_written_total')
// Time at which these statistics were last reset
const statCheckpointerStatsReset = new GaugeMetric('pg_stat_checkpointer_stats_reset_total')

// stat database
// Number of backends currently connected to this database. This is the only column in this view that returns a value reflecting current state; all other columns return the accumulated values since the last reset.
const statDatabaseNumbackends = new GaugeMetric('pg_stat_database_numbackends') // datid, datname
// Number of transactions in this database that have been committed
const statDatabaseXactCommit = new GaugeMetric('pg_stat_database_xact_commit') // datid, datname
// Number of transactions in this database that have been rolled back
const statDatabaseXactRollback = new GaugeMetric('pg_stat_database_xact_rollback') // datid, datname
// Number of disk blocks read in this database
const statDatabaseBlksRead = new GaugeMetric('pg_stat_database_blks_read') // datid, datname
// Number of times disk blocks were found already in the buffer cache, so that a read was not necessary (this only includes hits in the PostgreSQL buffer cache, not the operating system's file system cache)
const statDatabaseBlksHit = new GaugeMetric('pg_stat_database_blks_hit') // datid, datname
// Number of rows returned by queries in this database
const statDatabaseTupReturned = new GaugeMetric('pg_stat_database_tup_returned') // datid, datname
// Number of rows fetched by queries in this database
const statDatabaseTupFetched = new GaugeMetric('pg_stat_database_tup_fetched') // datid, datname
// Number of rows inserted by queries in this database
const statDatabaseTupInserted = new GaugeMetric('pg_stat_database_tup_inserted') // datid, datname
// Number of rows updated by queries in this database
const statDatabaseTupUpdated = new GaugeMetric('pg_stat_database_tup_updated') // datid, datname
// Number of rows deleted by queries in this database
const statDatabaseTupDeleted = new GaugeMetric('pg_stat_database_tup_deleted') // datid, datname
// Number of queries canceled due to conflicts with recovery in this database. (Conflicts occur only on standby servers; see pg_stat_database_conflicts for details.)
const statDatabaseConflicts = new GaugeMetric('pg_stat_database_conflicts') // datid, datname
// Number of temporary files created by queries in this database. All temporary files are counted, regardless of why the temporary file was created (e.g., sorting or hashing), and regardless of the log_temp_files setting.
const statDatabaseTempFiles = new GaugeMetric('pg_stat_database_temp_files') // datid, datname
// Total amount of data written to temporary files by queries in this database. All temporary files are counted, regardless of why the temporary file was created, and regardless of the log_temp_files setting.
const statDatabaseTempBytes = new GaugeMetric('pg_stat_database_temp_bytes') // datid, datname
// Number of deadlocks detected in this database
const statDatabaseDeadlocks = new GaugeMetric('pg_stat_database_deadlocks') // datid, datname
// Time spent reading data file blocks by backends in this database, in milliseconds
const statDatabaseBlkReadTime = new GaugeMetric('pg_stat_database_blk_read_time') // datid, datname
// Time spent writing data file blocks by backends in this database, in milliseconds
const statDatabaseBlkWriteTime = new GaugeMetric('pg_stat_database_blk_write_time') // datid, datname
// Time at which these statistics were last reset
const statDatabaseStatsReset = new GaugeMetric('pg_stat_database_stats_reset') // datid, datname
// Time spent executing SQL statements in this database, in seconds
const statDatabaseActiveTime = new GaugeMetric('pg_stat_database_active_time_seconds_total') // datid, datname

// stat statements
// Number of times executed
const statStatementsCallsTotal = new GaugeMetric('pg_stat_statements_calls_total') // user, datname, queryid
// Total time spent in the statement, in seconds
const statStatementsSecondsTotal = new GaugeMetric('pg_stat_statements_seconds_total') // user, datname, queryid
// Total number of rows retrieved or affected by the statement
const statStatementsRowsTotal = new GaugeMetric('pg_stat_statements_rows_total') // user, datname, queryid
// Total time the statement spent reading blocks, in seconds
const statStatementsBlockReadSecondsTotal = new GaugeMetric('pg_stat_statements_block_read_seconds_total') // user, datname, queryid
// Total time the statement spent writing blocks, in seconds
const statStatementsBlockWriteSecondsTotal = new GaugeMetric('pg_stat_statements_block_write_seconds_total') // user, datname, queryid

// stat user tables
// Number of sequential scans initiated on this table
const statUserTablesSeqScan = new GaugeMetric('pg_stat_user_tables_seq_scan') // datname, schemaname, relname
// Number of live rows fetched by sequential scans
const statUserTablesSeqTupRead = new GaugeMetric('pg_stat_user_tables_seq_tup_read') // datname, schemaname, relname
// Number of index scans initiated on this table
const statUserTablesIdxScan = new GaugeMetric('pg_stat_user_tables_idx_scan') // datname, schemaname, relname
// Number of live rows fetched by index scans
const statUserTablesIdxTupFetch = new GaugeMetric('pg_stat_user_tables_idx_tup_fetch') // datname, schemaname, relname
// Number of rows inserted
const statUserTablesNTupIns = new GaugeMetric('pg_stat_user_tables_n_tup_ins') // datname, schemaname, relname
// Number of rows updated
const statUserTablesNTupUpd = new GaugeMetric('pg_stat_user_tables_n_tup_upd') // datname, schemaname, relname
// Number of rows deleted
const statUserTablesNTupDel = new GaugeMetric('pg_stat_user_tables_n_tup_del') // datname, schemaname, relname
// Number of rows HOT updated (i.e., with no separate index update required)
const statUserTablesNTupHotUpd = new GaugeMetric('pg_stat_user_tables_n_tup_hot_upd') // datname, schemaname, relname
// Estimated number of live rows
const statUserTablesNLiveTup = new GaugeMetric('pg_stat_user_tables_n_live_tup') // datname, schemaname, relname
// Estimated number of dead rows
const statUserTablesNDeadTup = new GaugeMetric('pg_stat_user_tables_n_dead_tup') // datname, schemaname, relname
// Estimated number of rows changed since last analyze
const statUserTablesNModSinceAnalyze = new GaugeMetric('pg_stat_user_tables_n_mod_since_analyze') // datname, schemaname, relname
// Last time at which this table was manually vacuumed (not counting VACUUM FULL)
const statUserTablesLastVacuum = new GaugeMetric('pg_stat_user_tables_last_vacuum') // datname, schemaname, relname
// Last time at which this table was vacuumed by the autovacuum daemon
const statUserTablesLastAutovacuum = new GaugeMetric('pg_stat_user_tables_last_autovacuum') // datname, schemaname, relname
// Last time at which this table was manually analyzed
const statUserTablesLastAnalyze = new GaugeMetric('pg_stat_user_tables_last_analyze') // datname, schemaname, relname
// Last time at which this table was analyzed by the autovacuum daemon
const statUserTablesLastAutoanalyze = new GaugeMetric('pg_stat_user_tables_last_autoanalyze') // datname, schemaname, relname
// Number of times this table has been manually vacuumed (not counting VACUUM FULL)
const statUserTablesVacuumCount = new GaugeMetric('pg_stat_user_tables_vacuum_count') // datname, schemaname, relname
// Number of times this table has been vacuumed by the autovacuum daemon
const statUserTablesAutovacuumCount = new GaugeMetric('pg_stat_user_tables_autovacuum_count') // datname, schemaname, relname
// Number of times this table has been manually analyzed
const statUserTablesAnalyzeCount = new GaugeMetric('pg_stat_user_tables_analyze_count') // datname, schemaname, relname
// Number of times this table has been analyzed by the autovacuum daemon
const statUserTablesAutoanalyzeCount = new GaugeMetric('pg_stat_user_tables_autoanalyze_count') // datname, schemaname, relname
// Total disk space used by this table, in bytes, including all indexes and TOAST data
const statUserTablesTotalSizeBytes = new GaugeMetric('pg_stat_user_tables_size_bytes') // datname, schemaname, relname

// stat wal receiver
// First write-ahead log location used when WAL receiver is started represented as a decimal
const statWalReceiverReceiveStartLsn = new GaugeMetric('pg_stat_wal_receiver_receive_start_lsn') // upstream_host, slot_name, status
// First timeline number used when WAL receiver is started
const statWalReceiverReceiveStartTli = new GaugeMetric('pg_stat_wal_receiver_receive_start_tli') // upstream_host, slot_name, status
// Last write-ahead log location already received and flushed to disk, the initial value of this field being the first log location used when WAL receiver is started represented as a decimal
const statWalReceiverFlushedLSN = new GaugeMetric('pg_stat_wal_receiver_flushed_lsn') // upstream_host, slot_name, status
// Timeline number of last write-ahead log location received and flushed to disk
const statWalReceiverReceivedTli = new GaugeMetric('pg_stat_wal_receiver_received_tli') // upstream_host, slot_name, status
// Send time of last message received from origin WAL sender
const statWalReceiverLastMsgSendTime = new GaugeMetric('pg_stat_wal_receiver_last_msg_send_time_seconds') // upstream_host, slot_name, status
// Send time of last message received from origin WAL sender
const statWalReceiverLastMsgReceiptTime = new GaugeMetric('pg_stat_wal_receiver_last_msg_receipt_time_seconds') // upstream_host, slot_name, status
// Last write-ahead log location reported to origin WAL sender as integer
const statWalReceiverLatestEndLsn = new GaugeMetric('pg_stat_wal_receiver_latest_end_lsn') // upstream_host, slot_name, status
// Time of last write-ahead log location reported to origin WAL sender
const statWalReceiverLatestEndTime = new GaugeMetric('pg_stat_wal_receiver_latest_end_time_seconds') // upstream_host, slot_name, status
// Node ID of the upstream node
const statWalReceiverUpstreamNode = new GaugeMetric('pg_stat_wal_receiver_upstream_node') // upstream_host, slot_name, status

// statio user indexes
// Number of disk blocks read from this index
const statioUserIndexesIdxBlksRead = new GaugeMetric('pg_statio_user_indexes_idx_blks_read') // schemaname, relname, indexrelname
// Number of buffer hits in this index
const statioUserIndexesIdxBlksHit = new GaugeMetric('pg_statio_user_indexes_idx_blks_hit') // schemaname, relname, indexrelname

// statio user tables
// Number of disk blocks read from this table
const statioUserTablesHeapBlksRead = new GaugeMetric('pg_statio_user_tables_heap_blks_read') // datname, schemaname, relname
// Number of buffer hits in this table
const statioUserTablesHeapBlksHit = new GaugeMetric('pg_statio_user_tables_heap_blks_hit') // datname, schemaname, relname
// Number of disk blocks read from all indexes on this table
const statioUserTablesIdxBlksRead = new GaugeMetric('pg_statio_user_tables_idx_blks_read') // datname, schemaname, relname
// Number of buffer hits in all indexes on this table
const statioUserTablesIdxBlksHit = new GaugeMetric('pg_statio_user_tables_idx_blks_hit') // datname, schemaname, relname
// Number of disk blocks read from this table's TOAST table (if any)
const statioUserTablesToastBlksRead = new GaugeMetric('pg_statio_user_tables_toast_blks_read') // datname, schemaname, relname
// Number of buffer hits in this table's TOAST table (if any)
const statioUserTablesToastBlksHit = new GaugeMetric('pg_statio_user_tables_toast_blks_hit') // datname, schemaname, relname
// Number of disk blocks read from this table's TOAST table indexes (if any)
const statioUserTablesTidxBlksRead = new GaugeMetric('pg_statio_user_tables_tidx_blks_read') // datname, schemaname, relname
// Number of buffer hits in this table's TOAST table indexes (if any)
const statioUserTablesTidxBlksHit = new GaugeMetric('pg_statio_user_tables_tidx_blks_hit') // datname, schemaname, relname

// wal
// Number of WAL segments
const pgWALSegments = new GaugeMetric('pg_wal_segments')
// Total size of WAL segments
const pgWALSize = new GaugeMetric('pg_wal_size_bytes')

// xlog location
// Postgres LSN (log sequence number) being generated on primary or replayed on replica (truncated to low 52 bits)
const xlogLocationBytes = new GaugeMetric('pg_xlog_location_bytes')

const selectors = `instance=~"$instance", namespace=~"$namespace"`

const panels: PanelRowAndGroups = [
  NewPanelGroup({ title: 'Database Size' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewPieChartPanel({ title: 'Database Size', unit: units.BytesSI }, pgDatabaseSizeBytes.calc('sum', { selectors, groupBy: ['datname'] }).target()),
      NewTimeSeriesPanel({ title: 'Database Size', unit: units.BytesSI }, pgDatabaseSizeBytes.calc('sum', { selectors, groupBy: ['datname'] }).target()),
      NewTimeSeriesPanel({ title: 'Locks Count' }, pgLocksCount.calc('sum', { selectors, groupBy: ['datname', 'mode'], append: ' > 0' }).target()),
      NewTimeSeriesPanel({ title: 'Number of backends connected' }, statDatabaseNumbackends.calc('sum', { selectors: [selectors, `datname!=""`], groupBy: ['datname'] }).target()),
    ]),
  ]),
  NewPanelGroup({ title: 'Activity count' }, [
    NewPanelRow({ datasource, height: 8 }, [
      NewTimeSeriesPanel({ title: 'Active' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="active"`], groupBy: ['datname'], append: ' > 0' }).target()),
      NewTimeSeriesPanel({ title: 'Disabled' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="disabled"`], groupBy: ['datname'], append: ' > 0' }).target()),
      NewTimeSeriesPanel({ title: 'Fastpath function call' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="fastpath function call"`], groupBy: ['datname'], append: ' > 0' }).target()),
      NewTimeSeriesPanel({ title: 'Idle' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="idle"`], groupBy: ['datname'], append: ' > 0' }).target()),
    ]),
    NewPanelRow({ datasource, height: 8 }, [
      //
      NewTimeSeriesPanel({ title: 'Idle in transaction' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="idle in transaction"`], groupBy: ['datname'], append: ' > 0' }).target()),
      NewTimeSeriesPanel({ title: 'Idle in transaction (aborted)' }, pgStatActivityCount.calc('sum', { selectors: [selectors, `state="idle in transaction (aborted)"`], groupBy: ['datname'], append: ' > 0' }).target()),
    ]),
  ]),
  cadvisorMetricsPanels({ datasource, selectors: [`namespace=~"$namespace"`, `pod=~"$pod"`], collapsed: true }),
  podMetricsPanels({ datasource, selectors: [`namespace=~"$namespace"`, `pod=~"$pod"`], collapsed: false }),
  goRuntimeMetricsPanels({ datasource, title: 'Resource Usage (postgres-exporter)', buildInfoMetric: 'postgres_exporter_build_info', selectors, collapsed: true }),
]

export const postgresDashboard = newDashboard({
  variables: [
    NewPrometheusDatasourceVariable({ name: 'DS_PROMETHEUS', label: 'Prometheus' }),
    NewQueryVariable({ datasource, name: 'namespace', label: 'Namespace', query: 'label_values(postgres_exporter_build_info, namespace)' }),
    NewQueryVariable({ datasource, name: 'instance', label: 'Instance', query: 'label_values(postgres_exporter_build_info{namespace=~"$namespace"}, instance)', includeAll: true, multi: true }),
    NewQueryVariable({ datasource, name: 'pod', label: 'Pod', query: 'label_values(postgres_exporter_build_info{namespace=~"$namespace", instance=~"$instance"}, pod)', includeAll: true, multi: true }),
  ],
  panels: panels,
})
