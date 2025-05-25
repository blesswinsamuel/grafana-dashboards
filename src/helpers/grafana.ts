import { Dashboard } from '@grafana/grafana-foundation-sdk/dashboard'
import * as fsSync from 'fs'
import * as fs from 'fs/promises'

type GrafanaDashboardOpts = {
  grafanaURL?: string
  grafanaUsername?: string
  grafanaPassword?: string
  grafanaSession?: string
  grafanaApiToken?: string
  dashboard: Dashboard
  folderUid?: string
  prefix?: string
  filename: string
}

export async function writeDashboardAndPostToGrafana(opts: GrafanaDashboardOpts) {
  const { grafanaURL = process.env.GRAFANA_URL, grafanaSession = process.env.GRAFANA_SESSION, grafanaApiToken = process.env.GRAFANA_API_TOKEN, grafanaUsername = process.env.GRAFANA_USERNAME, grafanaPassword = process.env.GRAFANA_PASSWORD, dashboard, prefix } = opts
  // create parent folder if it doesn't exist
  if (opts.filename.includes('/')) {
    const folder = opts.filename.split('/').slice(0, -1).join('/')
    if (folder !== '' && !fsSync.existsSync(folder)) {
      console.log('Creating parent folder', folder)
      await fs.mkdir(folder, { recursive: true })
    }
  }
  if (fsSync.existsSync(opts.filename)) {
    const existingDashboard = JSON.parse(await fs.readFile(opts.filename, 'utf-8'))
    if (JSON.stringify(existingDashboard) === JSON.stringify(dashboard)) {
      // console.info(`Dashboard ${opts.filename} is already up to date`)
      return
    }
  }
  await fs.writeFile(opts.filename, JSON.stringify(dashboard, null, 2))
  if (grafanaURL) {
    console.info(`${new Date().toISOString()}: Writing dashboard ${opts.filename} to Grafana at ${grafanaURL}`)
    dashboard['uid'] = `${prefix ? `${prefix}-` : ''}${dashboard['uid']}`
    dashboard['uid'] = dashboard['uid'].substring(0, 40)
    dashboard['title'] = `${prefix ? `[${prefix}] ` : ''}${dashboard['title']}`
    // dashboard['version'] = Math.floor(Math.random() * 1000)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (grafanaUsername && grafanaPassword) {
      headers['Authorization'] = 'Basic ' + btoa(grafanaUsername + ':' + grafanaPassword)
    }
    if (grafanaApiToken) {
      headers['Authorization'] = `Bearer ${grafanaApiToken}`
    }
    if (grafanaSession) {
      headers['Cookie'] = `grafana_session=${grafanaSession}`
    }
    const fetchOpts: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        dashboard: dashboard,
        folderUid: opts.folderUid,
        overwrite: true,
        message: 'Updated by script',
      }),
      headers,
    }
    const response = await fetch(`${grafanaURL}/api/dashboards/db`, fetchOpts)

    console.log(response.status, response.statusText)
    const body = await response.json()
    console.log(body)
  }
}
