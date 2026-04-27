"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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

  const comparisonData = filtered.map((m) => ({
    name: m.model_name,
    MAPE: m.mape !== null && m.mape !== undefined ? Number(m.mape) : 0,
    RMSE: m.rmse !== null && m.rmse !== undefined ? Number(m.rmse) : 0,
    MAE: m.mae !== null && m.mae !== undefined ? Number(m.mae) : 0,
  }));

  const accuracyData = filtered.map((m) => ({
    name: m.model_name,
    "Accuracy (%)": m.forecast_accuracy ?? 0,
    "R² (%)": (m.r2 ?? 0) * 100,
  }));

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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: "Score", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="MAPE" fill="#4F46E5" />
            <Bar dataKey="RMSE" fill="#059669" />
            <Bar dataKey="MAE" fill="#D97706" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Forecast Accuracy & R²</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={accuracyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: "%", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Accuracy (%)" fill="#4F46E5" />
            <Bar dataKey="R² (%)" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
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
