"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import type { ModelMetric } from "../types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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

export default function MetricsTab({ metrics }: MetricsTabProps) {
  const types = useMemo(
    () => [...new Set(metrics.map((m) => m.metric_type))],
    [metrics]
  );
  const [selectedType, setSelectedType] = useState<string>(types[0] || "");

  const filtered = useMemo(
    () => metrics.filter((m) => m.metric_type === selectedType),
    [metrics, selectedType]
  );

  // Detect extra columns beyond core
  const extraKeys = useMemo(() => {
    const coreKeys = new Set(["model_name", "metric_type", ...CORE_METRICS.map((m) => m.key)]);
    const extra = new Set<string>();
    filtered.forEach((m) => {
      Object.keys(m).forEach((k) => {
        if (!coreKeys.has(k) && m[k] !== null && m[k] !== undefined) {
          extra.add(k);
        }
      });
    });
    return [...extra];
  }, [filtered]);

  const bestModel = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, m) =>
      (m.mape ?? Infinity) < (best.mape ?? Infinity) ? m : best
    );
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Type Toggle */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              selectedType === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Metrics Comparison</h3>
        <Plot
          data={["mape", "rmse", "mae"].map((metricKey) => ({
            x: filtered.map((m) => m.model_name),
            y: filtered.map((m) => {
              const val = m[metricKey];
              return val !== null && val !== undefined ? Number(val) : 0;
            }),
            type: "bar" as const,
            name: metricKey.toUpperCase(),
          }))}
          layout={{
            barmode: "group" as const,
            xaxis: { title: "Model" },
            yaxis: { title: "Score" },
            legend: { orientation: "h" as const, y: -0.2 },
            margin: { t: 20, r: 20, b: 100, l: 60 },
            height: 400,
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Accuracy Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Forecast Accuracy & R²</h3>
        <Plot
          data={[
            {
              x: filtered.map((m) => m.model_name),
              y: filtered.map((m) => m.forecast_accuracy ?? 0),
              type: "bar" as const,
              name: "Accuracy (%)",
              marker: { color: "#4F46E5" },
            },
            {
              x: filtered.map((m) => m.model_name),
              y: filtered.map((m) => (m.r2 ?? 0) * 100),
              type: "bar" as const,
              name: "R² (%)",
              marker: { color: "#059669" },
            },
          ]}
          layout={{
            barmode: "group" as const,
            xaxis: { title: "Model" },
            yaxis: { title: "%" },
            legend: { orientation: "h" as const, y: -0.2 },
            margin: { t: 20, r: 20, b: 100, l: 60 },
            height: 350,
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
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
            {filtered.map((m) => (
              <tr
                key={m.model_name}
                className={`hover:bg-gray-50 ${
                  m.model_name === bestModel?.model_name ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {m.model_name}
                  {m.model_name === bestModel?.model_name && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                      Best
                    </span>
                  )}
                </td>
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
