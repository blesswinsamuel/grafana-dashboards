# Grafana Dashboards

This repository contains a collection of Grafana dashboards for monitoring various services. Currently, this repository contains dashboards for the following:

- Postgres (using [postgres_exporter](https://github.com/prometheus-community/postgres_exporter))
- Traefik
- Cert Manager
- Smartctl (using [smartctl_exporter](https://github.com/prometheus-community/smartctl_exporter))
- Omada Controller (using [omada_exporter](https://github.com/charlie-haley/omada_exporter))
- ZFS (using [zfs-exporter](https://github.com/pdf/zfs_exporter))

## Development

```
GRAFANA_URL=http://your-grafana-instance bun run dev
```

(setting GRAFANA_URL is optional)
