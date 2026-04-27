export interface ForecastRow {
  date: string;
  interval: string;
  queue: string;
  channel: string;
  actual_contacts: number;
  forecasted_contacts: number;
  actual_aht: number;
  forecasted_aht: number;
}

export interface ModelMetric {
  model_name: string;
  metric_type: string;
  mape: number | null;
  rmse: number | null;
  mae: number | null;
  smape: number | null;
  r2: number | null;
  bias: number | null;
  forecast_accuracy: number | null;
  weighted_mape: number | null;
  [key: string]: string | number | null | undefined;
}

export interface CapacityPlanRow {
  month: string;
  queue: string;
  site: string;
  required_fte: number;
  planned_fte: number;
  actual_fte: number;
  variance_fte: number;
  shrinkage_pct: number;
  attrition_rate_pct: number;
}

export interface DashboardData {
  forecastData: ForecastRow[];
  modelMetrics: ModelMetric[];
  capacityPlan: CapacityPlanRow[];
}
