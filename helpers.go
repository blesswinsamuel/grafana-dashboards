package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/K-Phoen/grabana/dashboard"
	"github.com/K-Phoen/sdk"
)

func UpdateDashboard(builder dashboard.Builder, filename string) error {
	dashboardJSON, err := builder.MarshalIndentJSON()
	if err != nil {
		return err
	}
	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := f.Write(dashboardJSON); err != nil {
		return err
	}
	log.Println("Dashboard saved to", filename)

	grafanaURL := os.Getenv("GRAFANA_URL")
	if grafanaURL != "" {
		internal := builder.Internal()
		internal.UID += "-debug"
		internal.Title += " (debug)"
		dashboardJSON, err := json.Marshal(struct {
			Dashboard *sdk.Board `json:"dashboard"`
			// FolderID  uint       `json:"folderId"`
			Overwrite bool `json:"overwrite"`
		}{
			Dashboard: builder.Internal(),
			// FolderID:  folder.ID,
			Overwrite: true,
		})
		if err != nil {
			return err
		}
		log.Println("Uploading dashboard to Grafana")
		req, err := http.NewRequest("POST", grafanaURL+"/api/dashboards/db", bytes.NewReader(dashboardJSON))
		if err != nil {
			return err
		}
		req.Header.Add("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode != 200 {
			return fmt.Errorf("unexpected status code: %d. Body: %s", resp.StatusCode, resp.Body)
		}
	}
	return nil
}

func main() {
	dashboardBuilders := map[string]func() (dashboard.Builder, error){
		"cert-manager": CertManagerDashboard,
	}
	dashboardName := os.Args[1]
	dashboardBuilder, ok := dashboardBuilders[dashboardName]
	if !ok {
		panic("unknown dashboard: " + dashboardName)
	}
	builder, err := dashboardBuilder()
	if err != nil {
		panic(err)
	}
	if err := UpdateDashboard(builder, "dist/"+dashboardName+".json"); err != nil {
		panic(err)
	}
}
