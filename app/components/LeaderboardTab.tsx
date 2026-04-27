"use client";

import { useState, useMemo } from "react";
import type { ModelMetric } from "../types";

interface LeaderboardTabProps {
  metrics: ModelMetric[];
}

const RANK_METRICS: { key: keyof ModelMetric; label: string; direction: "asc" | "desc" }[] = [
  { key: "mape", label: "MAPE", direction: "asc" },
  { key: "rmse", label: "RMSE", direction: "asc" },
  { key: "mae", label: "MAE", direction: "asc" },
  { key: "forecast_accuracy", label: "Accuracy", direction: "desc" },
  { key: "r2", label: "R\u00B2", direction: "desc" },
  { key: "weighted_mape", label: "W-MAPE", direction: "asc" },
];

export default function LeaderboardTab({ metrics }: LeaderboardTabProps) {
  const types = useMemo(
    () => [...new Set(metrics.map((m) => m.metric_type))],
    [metrics]
  );
  const [selectedType, setSelectedType] = useState<string>(types[0] || "");
  const [rankBy, setRankBy] = useState<keyof ModelMetric>("mape");

  const rankConfig = RANK_METRICS.find((m) => m.key === rankBy);
  const isAsc = rankConfig?.direction === "asc";

  const ranked = useMemo(() => {
    const filtered = metrics.filter(
      (m) => m.metric_type === selectedType && m[rankBy] !== null && m[rankBy] !== undefined
    );
    return filtered.sort((a, b) => {
      const aVal = Number(a[rankBy]) || 0;
      const bVal = Number(b[rankBy]) || 0;
      return isAsc ? aVal - bVal : bVal - aVal;
    });
  }, [metrics, selectedType, rankBy, isAsc]);

  const maxVal = Math.max(...ranked.map((m) => Math.abs(Number(m[rankBy]) || 0)), 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
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
        <div>
          <label className="text-xs font-medium text-gray-500 mr-2">Rank by:</label>
          <select
            value={rankBy as string}
            onChange={(e) => setRankBy(e.target.value as keyof ModelMetric)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {RANK_METRICS.map((m) => (
              <option key={m.key as string} value={m.key as string}>
                {m.label} ({m.direction === "asc" ? "lower is better" : "higher is better"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Model Leaderboard (Ranked by {rankConfig?.label || rankBy.toString()})
        </h3>
        <div className="space-y-3">
          {ranked.map((m, idx) => {
            const val = Number(m[rankBy]) || 0;
            const barWidth = (Math.abs(val) / maxVal) * 100;
            return (
              <div
                key={m.model_name}
                className={`rounded-lg border p-4 ${
                  idx === 0
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0
                          ? "bg-indigo-600 text-white"
                          : idx === 1
                          ? "bg-gray-400 text-white"
                          : idx === 2
                          ? "bg-amber-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900">{m.model_name}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {rankConfig?.label}: {val.toFixed(4)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      idx === 0 ? "bg-indigo-600" : "bg-gray-400"
                    }`}
                    style={{
                      width: `${isAsc ? Math.max(100 - barWidth, 5) : Math.max(barWidth, 5)}%`,
                    }}
                  />
                </div>
                <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                  <span>MAPE: {m.mape?.toFixed(2) ?? "-"}%</span>
                  <span>MAE: {m.mae?.toFixed(2) ?? "-"}</span>
                  <span>R²: {m.r2?.toFixed(4) ?? "-"}</span>
                  <span>Accuracy: {m.forecast_accuracy?.toFixed(1) ?? "-"}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
