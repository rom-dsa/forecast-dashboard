import * as XLSX from "xlsx";
import type { DashboardData, ForecastRow, ModelMetric } from "../types";

function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function parseForecastSheet(ws: XLSX.WorkSheet): ForecastRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  return rows.map((r) => ({
    capacity_plan: toString(r["capacity_plan"]),
    model_name: toString(r["model_name"]),
    volume_stream: toString(r["volume_stream"]),
    year: toNumber(r["Year"]),
    month: toString(r["Month"]),
    date: toNumber(r["date"]),
    frequency: toString(r["frequency"]),
    actual_contacts: toNumber(r["actual_contacts"]),
    forecasted_contacts: toNumber(r["forecasted_contacts"]),
    actual_aht: toNumber(r["actual_aht"]),
    forecasted_aht: toNumber(r["forecasted_aht"]),
  }));
}

function parseMetricsSheet(ws: XLSX.WorkSheet): ModelMetric[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  return rows.map((r) => {
    const base: ModelMetric = {
      forecast_id: toString(r["forecast_id"]),
      capacity_plan: toString(r["capacity_plan"]),
      volume_stream: toString(r["volume_stream"]),
      year: toString(r["year"]),
      month: toString(r["month"]),
      start_date: toNumber(r["start_date"]),
      forecast_horizon: toNumber(r["forecast_horizon"]),
      frequency: toString(r["frequency"]),
      model_name: toString(r["model_name"]),
      metric_type: toString(r["metric_type"]),
      mape: r["mape"] !== undefined ? toNumber(r["mape"]) : null,
      rmse: r["rmse"] !== undefined ? toNumber(r["rmse"]) : null,
      mae: r["mae"] !== undefined ? toNumber(r["mae"]) : null,
      smape: r["smape"] !== undefined ? toNumber(r["smape"]) : null,
      r2: r["r2"] !== undefined ? toNumber(r["r2"]) : null,
      bias: r["bias"] !== undefined ? toNumber(r["bias"]) : null,
      forecast_accuracy: r["forecast_accuracy"] !== undefined ? toNumber(r["forecast_accuracy"]) : null,
      weighted_mape: r["weighted_mape"] !== undefined ? toNumber(r["weighted_mape"]) : null,
    };
    // Capture any extra columns for extensibility
    for (const key of Object.keys(r)) {
      if (!(key in base)) {
        base[key] = r[key] !== undefined ? toNumber(r[key]) : null;
      }
    }
    return base;
  });
}

export async function loadDashboardData(url: string): Promise<DashboardData> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const forecastSheet = workbook.Sheets["Forecast_vs_Actual"];
  const metricsSheet = workbook.Sheets["Model_Metrics"];

  return {
    forecastData: forecastSheet ? parseForecastSheet(forecastSheet) : [],
    modelMetrics: metricsSheet ? parseMetricsSheet(metricsSheet) : [],
  };
}
