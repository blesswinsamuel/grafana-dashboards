package main

import (
	"github.com/K-Phoen/grabana/dashboard"
	"github.com/K-Phoen/grabana/graph"
	"github.com/K-Phoen/grabana/row"
	"github.com/K-Phoen/grabana/target/prometheus"
	"github.com/K-Phoen/grabana/timeseries"
	"github.com/K-Phoen/grabana/variable/datasource"
)

type QueryExpr struct {
	Expr         string
	LegendFormat string
	RefID        string
}

type TimeSeriesPanelOpts struct {
	Title             string
	Exprs             []QueryExpr
	Unit              string
	Style             string // "area", "line", "bars"
	LegendCalcs       []timeseries.LegendOption
	LegendDisplayMode timeseries.LegendOption
	LegendPlacement   timeseries.LegendOption
}

func (p TimeSeriesPanelOpts) Panel() row.Option {
	options := []timeseries.Option{}
	for _, expr := range p.Exprs {
		options = append(options, timeseries.WithPrometheusTarget(
			expr.Expr,
			prometheus.Legend(expr.LegendFormat),
			prometheus.Ref(expr.RefID),
		))
	}
	if p.Style == "bars" {
		if p.LegendCalcs == nil {
			p.LegendCalcs = []timeseries.LegendOption{timeseries.Total}
			// options = append(options, timeseries.FieldOverride())
		}
	}
	return row.WithTimeSeries(
		"The number of sync() calls made by a controller",
		append([]timeseries.Option{
			timeseries.DataSource("${datasource}"),
			timeseries.Axis(),
			timeseries.WithPrometheusTarget(
				"rate(prometheus_http_requests_total[30s])",
				prometheus.Legend("{{handler}} - {{ code }}"),
			),
			timeseries.Span(12),
			timeseries.Height("400px"),
			timeseries.Legend(append([]timeseries.LegendOption{p.LegendDisplayMode, p.LegendPlacement}, p.LegendCalcs...)...),
			// timeseries.Stack(),
		}, options...)...,
	)
}

func CertManagerDashboard() (dashboard.Builder, error) {
	return dashboard.New(
		"Cert Manager",
		dashboard.UID("cert-manager"),
		dashboard.Tags([]string{"cert-manager"}),
		dashboard.Slug("cert-manager"),
		dashboard.Timezone(dashboard.Browser),
		dashboard.VariableAsDatasource("datasource", datasource.Label("Datasource"), datasource.Type("prometheus")),
		dashboard.Row(
			"Ready status",
			row.WithGraph(
				"HTTP Rate",
				graph.DataSource("prometheus-default"),
				graph.WithPrometheusTarget(
					"rate(prometheus_http_requests_total[30s])",
					prometheus.Legend("{{handler}} - {{ code }}"),
				),
			),
		),
		dashboard.Row(
			"Metrics",
			TimeSeriesPanelOpts{Title: "The number of sync() calls made by a controller", Exprs: []QueryExpr{{Expr: "sum(increase(certmanager_controller_sync_call_count[$__interval])) by (controller)", LegendFormat: "{{ controller }}"}}, Unit: "short", Style: "bars"}.Panel(),
		),
	)
}
