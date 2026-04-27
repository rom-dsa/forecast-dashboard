"use client";

import { useState, useMemo } from "react";
import { Card, LineChart, BarChart } from "@tremor/react";
import type { ForecastRow } from "../types";

interface ForecastTabProps {
  data: ForecastRow[];
}

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthSortKey(month: string, year: number): string {
  const mi = MONTH_ORDER.indexOf(month);
  return `${year}-${String(mi).padStart(2, "0")}`;
}

function monthLabel(month: string, year: number): string {
  return `${month} ${year}`;
}

export default function ForecastTab({ data }: ForecastTabProps) {
  const capacityPlans = useMemo(() => [...new Set(data.map((r) => r.capacity_plan))], [data]);
  const volumeStreams = useMemo(() => [...new Set(data.map((r) => r.volume_stream))], [data]);
  const models = useMemo(() => [...new Set(data.map((r) => r.model_name))], [data]);

  const [selectedPlan, setSelectedPlan] = useState<string>(capacityPlans[0] || "");
  const [selectedStream, setSelectedStream] = useState<string>(volumeStreams[0] || "");
  const [selectedModel, setSelectedModel] = useState<string>(models[0] || "");
  const [metric, setMetric] = useState<"contacts" | "aht">("contacts");

  const filtered = useMemo(
    () =>
      data.filter(
        (r) =>
          r.capacity_plan === selectedPlan &&
          r.volume_stream === selectedStream &&
          r.model_name === selectedModel
      ),
    [data, selectedPlan, selectedStream, selectedModel]
  );

  const chartData = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => monthSortKey(a.month, a.year).localeCompare(monthSortKey(b.month, b.year)))
      .map((r) => ({
        period: monthLabel(r.month, r.year),
        Actual: metric === "contacts" ? r.actual_contacts : r.actual_aht,
        Forecast: metric === "contacts" ? r.forecasted_contacts : r.forecasted_aht,
      }));
  }, [filtered, metric]);

  const varianceData = useMemo(() => {
    return chartData.map((d) => {
      const variance = d.Actual > 0 ? ((d.Forecast - d.Actual) / d.Actual) * 100 : 0;
      return {
        period: d.period,
        "Variance (%)": Math.round(variance * 100) / 100,
      };
    });
  }, [chartData]);

  const totalActual = chartData.reduce((a, b) => a + b.Actual, 0);
  const totalForecast = chartData.reduce((a, b) => a + b.Forecast, 0);
  const overallVariance = totalActual > 0 ? ((totalForecast - totalActual) / totalActual) * 100 : 0;
  const avgActual = chartData.length > 0 ? totalActual / chartData.length : 0;
  const avgForecast = chartData.length > 0 ? totalForecast / chartData.length : 0;

  // Multi-model comparison for the same plan + stream
  const allModelsData = useMemo(() => {
    const relevant = data.filter(
      (r) => r.capacity_plan === selectedPlan && r.volume_stream === selectedStream
    );
    const byPeriod: Record<string, Record<string, number>> = {};
    relevant.forEach((r) => {
      const sortKey = monthSortKey(r.month, r.year);
      if (!byPeriod[sortKey]) byPeriod[sortKey] = { _period: 0 };
      byPeriod[sortKey]._period = 0;
      byPeriod[sortKey][`${r.model_name}`] =
        metric === "contacts" ? r.forecasted_contacts : r.forecasted_aht;
      byPeriod[sortKey]["Actual"] =
        metric === "contacts" ? r.actual_contacts : r.actual_aht;
      byPeriod[sortKey]["__label"] = 0;
    });
    const sorted = Object.keys(byPeriod).sort();
    return sorted.map((sk) => {
      const idx = Number(sk.split("-")[1]);
      const year = sk.split("-")[0];
      const label = `${MONTH_ORDER[idx]} ${year}`;
      const entry: Record<string, string | number> = { period: label };
      for (const [k, v] of Object.entries(byPeriod[sk])) {
        if (k !== "_period" && k !== "__label") {
          entry[k] = v;
        }
      }
      return entry;
    });
  }, [data, selectedPlan, selectedStream, metric]);

  const allModelCategories = useMemo(() => {
    const cats = new Set<string>();
    allModelsData.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "period") cats.add(k);
      });
    });
    // Put Actual first
    const arr = [...cats].filter((c) => c !== "Actual");
    return ["Actual", ...arr.sort()];
  }, [allModelsData]);

  const modelColors: string[] = useMemo(() => {
    const palette = ["gray", "indigo", "emerald", "amber", "rose", "cyan", "violet", "orange"];
    return allModelCategories.map((_, i) => palette[i % palette.length]);
  }, [allModelCategories]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Capacity Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {capacityPlans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Volume Stream</label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {volumeStreams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Metric</label>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-0.5">
              {(["contacts", "aht"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    metric === m
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {m === "contacts" ? "Contacts" : "AHT"}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg Actual</p>
              <p className="font-bold text-gray-900">
                {metric === "contacts" ? avgActual.toFixed(0) : `${avgActual.toFixed(0)}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg Forecast</p>
              <p className="font-bold text-gray-900">
                {metric === "contacts" ? avgForecast.toFixed(0) : `${avgForecast.toFixed(0)}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Overall Variance</p>
              <p className={`font-bold ${Math.abs(overallVariance) > 10 ? "text-red-600" : "text-green-600"}`}>
                {overallVariance > 0 ? "+" : ""}{overallVariance.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Single Model: Actual vs Forecast */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          {selectedModel}: Actual vs Forecast ({metric === "contacts" ? "Contacts" : "AHT"})
        </h3>
        <p className="text-sm text-tremor-content mt-1">
          {selectedPlan} &middot; {selectedStream}
        </p>
        <LineChart
          className="mt-4 h-96"
          data={chartData}
          index="period"
          categories={["Actual", "Forecast"]}
          colors={["gray", "indigo"]}
          yAxisWidth={65}
          connectNulls
        />
      </Card>

      {/* Variance % */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Forecast Variance (%)
        </h3>
        <BarChart
          className="mt-4 h-72"
          data={varianceData}
          index="period"
          categories={["Variance (%)"]}
          colors={["indigo"]}
          yAxisWidth={60}
        />
      </Card>

      {/* Multi-Model Comparison */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          All Models Comparison ({metric === "contacts" ? "Contacts" : "AHT"})
        </h3>
        <p className="text-sm text-tremor-content mt-1">
          {selectedPlan} &middot; {selectedStream}
        </p>
        <LineChart
          className="mt-4 h-96"
          data={allModelsData}
          index="period"
          categories={allModelCategories}
          colors={modelColors}
          yAxisWidth={65}
          connectNulls
        />
      </Card>
    </div>
  );
}
