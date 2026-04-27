export interface ForecastRow {
  capacity_plan: string;
  model_name: string;
  volume_stream: string;
  year: number;
  month: string;
  date: number;
  frequency: string;
  actual_contacts: number;
  forecasted_contacts: number;
  actual_aht: number;
  forecasted_aht: number;
}

export interface ModelMetric {
  forecast_id: string;
  capacity_plan: string;
  volume_stream: string;
  year: string;
  month: string;
  start_date: number;
  forecast_horizon: number;
  frequency: string;
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

export interface DashboardData {
  forecastData: ForecastRow[];
  modelMetrics: ModelMetric[];
}
