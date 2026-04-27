"use client";

import type { DashboardData, ModelMetric } from "../types";
import {
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
  Users,
  BarChart3,
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

  const totalCapacityVariance = data.capacityPlan.reduce(
    (acc, r) => acc + r.variance_fte,
    0
  );
  const avgAttrition = data.capacityPlan.length > 0
    ? data.capacityPlan.reduce((acc, r) => acc + r.attrition_rate_pct, 0) / data.capacityPlan.length
    : 0;

  const uniqueQueues = [...new Set(data.forecastData.map((r) => r.queue))];
  const totalModels = [...new Set(data.modelMetrics.map((m) => m.model_name))].length;

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
      label: "Avg Forecast Accuracy",
      value: avgAccuracy !== null ? `${avgAccuracy.toFixed(1)}%` : "N/A",
      sub: avgMape !== null ? `Avg MAPE: ${avgMape.toFixed(2)}%` : "",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Total Models",
      value: totalModels,
      sub: `${uniqueQueues.length} queues tracked`,
      icon: BarChart3,
      color: "bg-blue-500",
    },
    {
      label: "FTE Variance (Total)",
      value: totalCapacityVariance.toFixed(1),
      sub: totalCapacityVariance < 0 ? "Understaffed" : "Overstaffed",
      icon: Users,
      color: totalCapacityVariance < 0 ? "bg-red-500" : "bg-amber-500",
    },
    {
      label: "Avg Attrition Rate",
      value: `${avgAttrition.toFixed(1)}%`,
      sub: `Across ${[...new Set(data.capacityPlan.map((r) => r.site))].length} sites`,
      icon: AlertTriangle,
      color: "bg-orange-500",
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
        {/* Top Models by MAPE */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Models by MAPE (Contacts)</h3>
          <div className="space-y-3">
            {data.modelMetrics
              .filter((m) => m.metric_type === "contacts" && m.mape !== null)
              .sort((a, b) => (a.mape ?? Infinity) - (b.mape ?? Infinity))
              .slice(0, 5)
              .map((m, idx) => (
                <div
                  key={m.model_name}
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
                    <span className="font-medium text-gray-900 text-sm">{m.model_name}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {m.mape?.toFixed(2)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Capacity Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Capacity Plan Highlights</h3>
          <div className="space-y-3">
            {[...new Set(data.capacityPlan.map((r) => r.queue))].map((queue) => {
              const rows = data.capacityPlan.filter((r) => r.queue === queue);
              const totalVariance = rows.reduce((acc, r) => acc + r.variance_fte, 0);
              const avgShrinkage =
                rows.reduce((acc, r) => acc + r.shrinkage_pct, 0) / rows.length;
              return (
                <div
                  key={queue}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{queue}</span>
                    <p className="text-xs text-gray-400">
                      Shrinkage: {avgShrinkage.toFixed(1)}%
                    </p>
                  </div>
                  <span
                    className={`text-sm font-mono ${
                      totalVariance < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {totalVariance > 0 ? "+" : ""}
                    {totalVariance.toFixed(1)} FTE
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
