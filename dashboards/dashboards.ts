import { postgresDashboard } from './postgres'
import { omadaControllerDashboard, omadaControllerRules } from './omada-controller'
import { smartctlDashboard } from './smartctl'
import { traefikDashboard } from './traefik'
import { certManagerDashboard } from './cert-manager'
import { zfsDashboard } from './zfs'
import { writeDashboardAndPostToGrafana, writePrometheusRules } from '../src/grafana-helpers'
import path from 'path'
import { Dashboard, DashboardBuilder, DashboardCursorSync } from '@grafana/grafana-foundation-sdk/dashboard'

type DashboardItem = {
  dashboard: DashboardBuilder
  title: string
  tags: string[]
  time?: { from: string; to: string }
}

const dashboards: Record<string, DashboardItem> = {
  postgres: { title: 'Postgres', tags: ['postgres'], dashboard: postgresDashboard },
  'omada-controller': { title: 'Omada Controller', tags: ['omada-controller'], dashboard: omadaControllerDashboard },
  smartctl: { title: 'Smartctl', tags: ['smartctl'], dashboard: smartctlDashboard },
  traefik: { title: 'Traefik', tags: ['traefik'], dashboard: traefikDashboard },
  'cert-manager': { title: 'Cert Manager', tags: ['cert-manager'], dashboard: certManagerDashboard },
  zfs: { title: 'ZFS', tags: ['zfs'], dashboard: zfsDashboard },
}

const rules = {
  'omada-controller': omadaControllerRules,
}

async function main() {
  const promises: Array<Promise<void>> = []
  for (const [name, dashboardItem] of Object.entries(dashboards)) {
    const { dashboard } = dashboardItem
    const d = dashboard.build()
    d.graphTooltip = d.graphTooltip || DashboardCursorSync.Crosshair
    d.title = d.title || dashboardItem.title
    d.tags = d.tags || dashboardItem.tags
    // d.version = 1
    d.uid = d.uid || name.substring(0, 40)
    d.time = d.time || dashboardItem.time || { from: 'now-24h', to: 'now' }

    console.log(`${new Date().toISOString()}: Writing dashboard ${name}`)
    const promise = writeDashboardAndPostToGrafana({
      dashboard: d,
      prefix: 'debug',
      // addDebugNamePrefix: false,
      filename: path.join(__dirname, 'dist', 'dashboards', `${name}.json`),
    })
    promises.push(promise)
  }
  await Promise.all(promises)

  // for (const [name, ruleGroups] of Object.entries(rules)) {
  //   console.log(`${new Date().toISOString()}: Writing rules ${name}`)
  //   await writePrometheusRules({
  //     ruleFile: { groups: ruleGroups },
  //     filename: path.join(__dirname, 'dist', 'alerts', 'omada-controller.yaml'),
  //   })
  // }
  console.log('Done')
}

//@ts-ignore
await main()
