import { dashboard as postgresDashboard } from './postgres'
import { dashboard as omadaControllerDashboard, rules as omadaControllerRules } from './omada-controller'
import { dashboard as smarctlDashboard } from './smartctl'
import { dashboard as traefikDashboard } from './traefik'
import { dashboard as certManagerDashboard } from './cert-manager'
import { dashboard as zfsDashboard } from './zfs'
import { writeDashboardAndPostToGrafana, writePrometheusRules } from '../src/grafana-helpers'
import path = require('path')

const dashboards = {
  postgres: postgresDashboard,
  'omada-controller': omadaControllerDashboard,
  smartctl: smarctlDashboard,
  traefik: traefikDashboard,
  'cert-manager': certManagerDashboard,
  zfs: zfsDashboard,
}

const rules = {
  'omada-controller': omadaControllerRules,
}

async function main() {
  for (const [name, dashboard] of Object.entries(dashboards)) {
    console.log(`${new Date().toISOString()}: Writing dashboard ${name}`)
    await writeDashboardAndPostToGrafana({
      dashboard,
      // addDebugNamePrefix: false,
      filename: path.join(__dirname, 'dist', 'dashboards', `${name}.json`),
    })
  }

  for (const [name, ruleGroups] of Object.entries(rules)) {
    console.log(`${new Date().toISOString()}: Writing rules ${name}`)
    await writePrometheusRules({
      ruleFile: { groups: ruleGroups },
      filename: path.join(__dirname, 'dist', 'alerts', 'omada-controller.yaml'),
    })
  }
}

//@ts-ignore
await main()
