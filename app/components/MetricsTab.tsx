"use client";

import { useState, useMemo } from "react";
import { Card, BarChart } from "@tremor/react";
import type { ModelMetric } from "../types";

interface MetricsTabProps {
  metrics: ModelMetric[];
}

const CORE_METRICS: { key: keyof ModelMetric; label: string; format: (v: number) => string }[] = [
  { key: "mape", label: "MAPE (%)", format: (v) => v.toFixed(2) },
  { key: "rmse", label: "RMSE", format: (v) => v.toFixed(2) },
  { key: "mae", label: "MAE", format: (v) => v.toFixed(2) },
  { key: "smape", label: "SMAPE (%)", format: (v) => v.toFixed(2) },
  { key: "r2", label: "R\u00B2", format: (v) => v.toFixed(4) },
  { key: "bias", label: "Bias", format: (v) => v.toFixed(2) },
  { key: "forecast_accuracy", label: "Accuracy (%)", format: (v) => v.toFixed(2) },
  { key: "weighted_mape", label: "W-MAPE (%)", format: (v) => v.toFixed(2) },
];

const KNOWN_KEYS = new Set([
  "forecast_id", "capacity_plan", "volume_stream", "year", "month",
  "start_date", "forecast_horizon", "frequency", "model_name", "metric_type",
  ...CORE_METRICS.map((m) => m.key),
]);

export default function MetricsTab({ metrics }: MetricsTabProps) {
  const capacityPlans = useMemo(
    () => [...new Set(metrics.map((m) => m.capacity_plan))],
    [metrics]
  );
  const metricTypes = useMemo(
    () => [...new Set(metrics.map((m) => m.metric_type))],
    [metrics]
  );
  const volumeStreams = useMemo(
    () => [...new Set(metrics.map((m) => m.volume_stream))],
    [metrics]
  );
  const forecastIds = useMemo(
    () => [...new Set(metrics.map((m) => m.forecast_id))],
    [metrics]
  );
  const modelNames = useMemo(
    () => [...new Set(metrics.map((m) => m.model_name))],
    [metrics]
  );

  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>(metricTypes[0] || "");
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [selectedForecastId, setSelectedForecastId] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [rankMetric, setRankMetric] = useState<string>("mape");

  const filtered = useMemo(
    () =>
      metrics.filter(
        (m) =>
          (selectedPlan === "all" || m.capacity_plan === selectedPlan) &&
          m.metric_type === selectedType &&
          (selectedStream === "all" || m.volume_stream === selectedStream) &&
          (selectedForecastId === "all" || m.forecast_id === selectedForecastId) &&
          (selectedModel === "all" || m.model_name === selectedModel)
      ),
    [metrics, selectedPlan, selectedType, selectedStream, selectedForecastId, selectedModel]
  );

  const extraKeys = useMemo(() => {
    const extra = new Set<string>();
    filtered.forEach((m) => {
      Object.keys(m).forEach((k) => {
        if (!KNOWN_KEYS.has(k) && m[k] !== null && m[k] !== undefined) {
          extra.add(k);
        }
      });
    });
    return [...extra];
  }, [filtered]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[rankMetric] != null ? Number(a[rankMetric]) : Infinity;
      const bVal = b[rankMetric] != null ? Number(b[rankMetric]) : Infinity;
      if (rankMetric === "forecast_accuracy" || rankMetric === "r2") {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }, [filtered, rankMetric]);

  const bestModel = sortedFiltered[0] || null;

  const comparisonData = sortedFiltered.map((m) => ({
    name: `${m.model_name}${selectedPlan === "all" ? ` (${m.capacity_plan.slice(0, 3)})` : ""}`,
    MAPE: m.mape !== null && m.mape !== undefined ? Number(m.mape) : 0,
    RMSE: m.rmse !== null && m.rmse !== undefined ? Number(m.rmse) : 0,
    MAE: m.mae !== null && m.mae !== undefined ? Number(m.mae) : 0,
  }));

  const accuracyData = sortedFiltered.map((m) => ({
    name: `${m.model_name}${selectedPlan === "all" ? ` (${m.capacity_plan.slice(0, 3)})` : ""}`,
    "Accuracy (%)": m.forecast_accuracy ?? 0,
    "R\u00B2 (%)": Math.round((m.r2 ?? 0) * 10000) / 100,
  }));

  const selectClass = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Capacity Plan</label>
            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className={selectClass}>
              <option value="all">All Plans</option>
              {capacityPlans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Metric Type</label>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-0.5">
              {metricTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    selectedType === t
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Volume Stream</label>
            <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className={selectClass}>
              <option value="all">All Streams</option>
              {volumeStreams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Forecast ID</label>
            <select value={selectedForecastId} onChange={(e) => setSelectedForecastId(e.target.value)} className={selectClass}>
              <option value="all">All Forecasts</option>
              {forecastIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className={selectClass}>
              <option value="all">All Models</option>
              {modelNames.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rank By</label>
            <select value={rankMetric} onChange={(e) => setRankMetric(e.target.value)} className={selectClass}>
              <option value="mape">MAPE (lower is better)</option>
              <option value="rmse">RMSE (lower is better)</option>
              <option value="mae">MAE (lower is better)</option>
              <option value="smape">SMAPE (lower is better)</option>
              <option value="forecast_accuracy">Accuracy (higher is better)</option>
              <option value="r2">R² (higher is better)</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-6 text-sm border-t border-gray-100 pt-3">
          <div>
            <span className="text-xs text-gray-500">Models Shown</span>
            <p className="font-bold text-gray-900">{filtered.length}</p>
          </div>
          {bestModel && (
            <>
              <div>
                <span className="text-xs text-gray-500">Best Model</span>
                <p className="font-bold text-indigo-600">{bestModel.model_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Best MAPE</span>
                <p className="font-bold text-gray-900">{bestModel.mape != null ? `${bestModel.mape.toFixed(2)}%` : "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Best Accuracy</span>
                <p className="font-bold text-gray-900">{bestModel.forecast_accuracy != null ? `${bestModel.forecast_accuracy.toFixed(1)}%` : "N/A"}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comparison Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Error Metrics Comparison{selectedPlan !== "all" ? ` — ${selectedPlan}` : ""}
        </h3>
        <p className="text-sm text-tremor-content mt-1">{selectedType} metrics</p>
        <BarChart
          className="mt-4 h-96"
          data={comparisonData}
          index="name"
          categories={["MAPE", "RMSE", "MAE"]}
          colors={["indigo", "emerald", "amber"]}
          yAxisWidth={60}
        />
      </Card>

      {/* Accuracy Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Forecast Accuracy & R²
        </h3>
        <BarChart
          className="mt-4 h-80"
          data={accuracyData}
          index="name"
          categories={["Accuracy (%)", "R\u00B2 (%)"]}
          colors={["indigo", "emerald"]}
          yAxisWidth={60}
        />
      </Card>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Stream</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Forecast ID</th>
              {CORE_METRICS.map((m) => (
                <th key={m.key as string} className="text-right px-4 py-3 font-medium text-gray-600">
                  {m.label}
                </th>
              ))}
              {extraKeys.map((k) => (
                <th key={k} className="text-right px-4 py-3 font-medium text-gray-600">
                  {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedFiltered.map((m, idx) => (
              <tr
                key={`${m.forecast_id}-${m.model_name}-${m.metric_type}`}
                className={`hover:bg-gray-50 ${idx === 0 ? "bg-indigo-50" : ""}`}
              >
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {m.model_name}
                  {idx === 0 && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                      Best
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{m.capacity_plan}</td>
                <td className="px-4 py-3 text-gray-600">{m.volume_stream}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.forecast_id}</td>
                {CORE_METRICS.map((metric) => {
                  const val = m[metric.key];
                  return (
                    <td key={metric.key as string} className="text-right px-4 py-3">
                      {val !== null && val !== undefined ? metric.format(Number(val)) : "-"}
                    </td>
                  );
                })}
                {extraKeys.map((k) => (
                  <td key={k} className="text-right px-4 py-3">
                    {m[k] !== null && m[k] !== undefined ? Number(m[k]).toFixed(2) : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
