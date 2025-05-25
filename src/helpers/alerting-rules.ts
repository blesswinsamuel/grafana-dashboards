import * as fs from 'fs/promises'
import * as yaml from 'yaml'

// https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/

export type RuleFile = {
  groups: RuleGroup[]
}

export type Duration = string

export type RuleGroup = {
  // The name of the group. Must be unique within a file.
  name: string
  // How often rules in the group are evaluated.
  interval?: Duration // default = global.evaluation_interval
  // Limit the number of alerts an alerting rule and series a recording
  // rule can produce. 0 is no limit.
  limit?: number // default = 0
  // Offset the rule evaluation timestamp of this particular group by the specified duration into the past.
  query_offset?: Duration // default = global.rule_query_offset

  rules: Rule[]
}

export type Rule = RecordingRule | AlertingRule

export type RecordingRule = {
  // The name of the time series to output to. Must be a valid metric name.
  record: string
  // The PromQL expression to evaluate. Every evaluation cycle this is
  // evaluated at the current time, and the result recorded as a new set of
  // time series with the metric name as given by 'record'.
  expr: string
  // Labels to add or overwrite before storing the result.
  labels: Record<string, string> // [ <labelname>: <labelvalue> ]
}

export type AlertingRule = {
  // The name of the alert. Must be a valid label value.
  alert: string
  // The PromQL expression to evaluate. Every evaluation cycle this is
  // evaluated at the current time, and all resultant time series become
  // pending/firing alerts.
  expr: string
  // Alerts are considered firing once they have been returned for this long.
  // Alerts which have not yet fired for long enough are considered pending.
  for?: Duration // default = 0s
  // How long an alert will continue firing after the condition that triggered it
  // has cleared.
  keep_firing_for?: Duration // default = 0s
  // Labels to add or overwrite for each alert.
  labels: Record<string, string> // [ <labelname>: <tmpl_string> ]
  // Annotations to add to each alert.
  annotations: Record<string, string> // [ <labelname>: <tmpl_string> ]
}

export async function writePrometheusRules(opts: { checkRules?: boolean; ruleFile: RuleFile; filename: string }) {
  await fs.writeFile(opts.filename, yaml.stringify(opts.ruleFile))
  if (opts.checkRules) {
    // TODO: Check the rules using promtool
  }
}
