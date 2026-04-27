"use client";

import type { DashboardData, ModelMetric } from "../types";
import {
  TrendingUp,
  Target,
  Award,
  BarChart3,
  Layers,
  Activity,
} from "lucide-react";

interface OverviewTabProps {
  data: DashboardData;
}

function getBestModel(metrics: ModelMetric[], type: string): ModelMetric | null {
  const filtered = metrics.filter((m) => m.metric_type === type && m.mape !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((best, m) =>
    (m.mape ?? Infinity) < (best.mape ?? Infinity) ? m : best
  );
}

function getAvgMetric(metrics: ModelMetric[], type: string, field: keyof ModelMetric): number | null {
  const filtered = metrics.filter((m) => m.metric_type === type && m[field] !== null && m[field] !== undefined);
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, m) => acc + (Number(m[field]) || 0), 0);
  return sum / filtered.length;
}

export default function OverviewTab({ data }: OverviewTabProps) {
  const bestContacts = getBestModel(data.modelMetrics, "contacts");
  const bestAHT = getBestModel(data.modelMetrics, "aht");
  const avgMape = getAvgMetric(data.modelMetrics, "contacts", "mape");
  const avgAccuracy = getAvgMetric(data.modelMetrics, "contacts", "forecast_accuracy");
  const avgAHTAccuracy = getAvgMetric(data.modelMetrics, "aht", "forecast_accuracy");

  const capacityPlans = [...new Set(data.forecastData.map((r) => r.capacity_plan))];
  const volumeStreams = [...new Set(data.forecastData.map((r) => r.volume_stream))];
  const totalModels = [...new Set(data.modelMetrics.map((m) => m.model_name))].length;
  const forecastModels = [...new Set(data.forecastData.map((r) => r.model_name))];

  const cards = [
    {
      label: "Best Model (Contacts)",
      value: bestContacts?.model_name ?? "N/A",
      sub: bestContacts ? `MAPE: ${bestContacts.mape?.toFixed(2)}%` : "",
      icon: Award,
      color: "bg-indigo-500",
    },
    {
      label: "Best Model (AHT)",
      value: bestAHT?.model_name ?? "N/A",
      sub: bestAHT ? `MAPE: ${bestAHT.mape?.toFixed(2)}%` : "",
      icon: Target,
      color: "bg-purple-500",
    },
    {
      label: "Avg Forecast Accuracy (Contacts)",
      value: avgAccuracy !== null ? `${avgAccuracy.toFixed(1)}%` : "N/A",
      sub: avgMape !== null ? `Avg MAPE: ${avgMape.toFixed(2)}%` : "",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Avg Forecast Accuracy (AHT)",
      value: avgAHTAccuracy !== null ? `${avgAHTAccuracy.toFixed(1)}%` : "N/A",
      sub: `${totalModels} models evaluated`,
      icon: Activity,
      color: "bg-cyan-500",
    },
    {
      label: "Capacity Plans",
      value: capacityPlans.length,
      sub: capacityPlans.join(", "),
      icon: Layers,
      color: "bg-blue-500",
    },
    {
      label: "Volume Streams",
      value: volumeStreams.length,
      sub: `${forecastModels.length} forecast models`,
      icon: BarChart3,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                )}
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-lg opacity-80 flex items-center justify-center`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Models by MAPE — Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Models by MAPE (Contacts)</h3>
          <div className="space-y-3">
            {data.modelMetrics
              .filter((m) => m.metric_type === "contacts" && m.mape !== null)
              .sort((a, b) => (a.mape ?? Infinity) - (b.mape ?? Infinity))
              .slice(0, 5)
              .map((m, idx) => (
                <div
                  key={`${m.model_name}-${m.capacity_plan}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{m.model_name}</span>
                      <p className="text-xs text-gray-400">{m.capacity_plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-gray-600">
                      {m.mape?.toFixed(2)}%
                    </span>
                    <p className="text-xs text-gray-400">
                      Acc: {m.forecast_accuracy?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Models by MAPE — AHT */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Models by MAPE (AHT)</h3>
          <div className="space-y-3">
            {data.modelMetrics
              .filter((m) => m.metric_type === "aht" && m.mape !== null)
              .sort((a, b) => (a.mape ?? Infinity) - (b.mape ?? Infinity))
              .slice(0, 5)
              .map((m, idx) => (
                <div
                  key={`${m.model_name}-${m.capacity_plan}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{m.model_name}</span>
                      <p className="text-xs text-gray-400">{m.capacity_plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-gray-600">
                      {m.mape?.toFixed(2)}%
                    </span>
                    <p className="text-xs text-gray-400">
                      Acc: {m.forecast_accuracy?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Per Capacity Plan Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Summary by Capacity Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {capacityPlans.map((plan) => {
            const planForecasts = data.forecastData.filter((r) => r.capacity_plan === plan);
            const planStreams = [...new Set(planForecasts.map((r) => r.volume_stream))];
            const planModels = [...new Set(planForecasts.map((r) => r.model_name))];
            const planMetrics = data.modelMetrics.filter((m) => m.capacity_plan === plan);
            const bestPlanModel = planMetrics
              .filter((m) => m.metric_type === "contacts" && m.mape !== null)
              .sort((a, b) => (a.mape ?? Infinity) - (b.mape ?? Infinity))[0];

            return (
              <div
                key={plan}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-semibold text-gray-900">{plan}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Streams: {planStreams.join(", ")}</p>
                  <p>Forecast Models: {planModels.join(", ")}</p>
                  <p>Data Points: {planForecasts.length}</p>
                  {bestPlanModel && (
                    <p className="text-indigo-600 font-medium">
                      Best: {bestPlanModel.model_name} (MAPE: {bestPlanModel.mape?.toFixed(2)}%)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
