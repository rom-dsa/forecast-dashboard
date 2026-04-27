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
  const years = useMemo(() => [...new Set(data.map((r) => r.year))].sort(), [data]);

  const [selectedPlan, setSelectedPlan] = useState<string>(capacityPlans[0] || "");
  const [selectedStream, setSelectedStream] = useState<string>(volumeStreams[0] || "");
  const [selectedModel, setSelectedModel] = useState<string>(models[0] || "");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [metric, setMetric] = useState<"contacts" | "aht">("contacts");

  const filtered = useMemo(
    () =>
      data.filter(
        (r) =>
          r.capacity_plan === selectedPlan &&
          r.volume_stream === selectedStream &&
          r.model_name === selectedModel &&
          (selectedYear === "all" || r.year === Number(selectedYear))
      ),
    [data, selectedPlan, selectedStream, selectedModel, selectedYear]
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
        "Over Forecast": variance >= 0 ? Math.round(variance * 100) / 100 : 0,
        "Under Forecast": variance < 0 ? Math.round(variance * 100) / 100 : 0,
      };
    });
  }, [chartData]);

  const totalActual = chartData.reduce((a, b) => a + b.Actual, 0);
  const totalForecast = chartData.reduce((a, b) => a + b.Forecast, 0);
  const overallVariance = totalActual > 0 ? ((totalForecast - totalActual) / totalActual) * 100 : 0;
  const avgActual = chartData.length > 0 ? totalActual / chartData.length : 0;
  const avgForecast = chartData.length > 0 ? totalForecast / chartData.length : 0;

  const allModelsData = useMemo(() => {
    const relevant = data.filter(
      (r) =>
        r.capacity_plan === selectedPlan &&
        r.volume_stream === selectedStream &&
        (selectedYear === "all" || r.year === Number(selectedYear))
    );
    const byPeriod: Record<string, Record<string, number>> = {};
    relevant.forEach((r) => {
      const sortKey = monthSortKey(r.month, r.year);
      if (!byPeriod[sortKey]) byPeriod[sortKey] = {};
      byPeriod[sortKey][r.model_name] =
        metric === "contacts" ? r.forecasted_contacts : r.forecasted_aht;
      byPeriod[sortKey]["Actual"] =
        metric === "contacts" ? r.actual_contacts : r.actual_aht;
    });
    const sorted = Object.keys(byPeriod).sort();
    return sorted.map((sk) => {
      const idx = Number(sk.split("-")[1]);
      const year = sk.split("-")[0];
      const label = `${MONTH_ORDER[idx]} ${year}`;
      const entry: Record<string, string | number> = { period: label };
      for (const [k, v] of Object.entries(byPeriod[sk])) {
        entry[k] = v;
      }
      return entry;
    });
  }, [data, selectedPlan, selectedStream, selectedYear, metric]);

  const allModelCategories = useMemo(() => {
    const cats = new Set<string>();
    allModelsData.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "period") cats.add(k);
      });
    });
    const arr = [...cats].filter((c) => c !== "Actual");
    return ["Actual", ...arr.sort()];
  }, [allModelsData]);

  const modelColors: string[] = useMemo(() => {
    const palette = ["gray", "indigo", "emerald", "amber", "rose", "cyan", "violet", "orange"];
    return allModelCategories.map((_, i) => palette[i % palette.length]);
  }, [allModelCategories]);

  const selectClass = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Capacity Plan</label>
            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className={selectClass}>
              {capacityPlans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Volume Stream</label>
            <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className={selectClass}>
              {volumeStreams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className={selectClass}>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={selectClass}>
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
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
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
        </div>
        <div className="mt-3 flex gap-6 text-sm border-t border-gray-100 pt-3">
          <div>
            <span className="text-xs text-gray-500">Avg Actual</span>
            <p className="font-bold text-gray-900">
              {metric === "contacts" ? avgActual.toFixed(0) : `${avgActual.toFixed(0)}s`}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Avg Forecast</span>
            <p className="font-bold text-gray-900">
              {metric === "contacts" ? avgForecast.toFixed(0) : `${avgForecast.toFixed(0)}s`}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Overall Variance</span>
            <p className={`font-bold ${Math.abs(overallVariance) > 10 ? "text-red-600" : "text-green-600"}`}>
              {overallVariance > 0 ? "+" : ""}{overallVariance.toFixed(1)}%
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Points</span>
            <p className="font-bold text-gray-900">{chartData.length}</p>
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
          {selectedYear !== "all" && ` \u00b7 ${selectedYear}`}
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

      {/* Variance % — split into over/under for color coding */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Forecast Variance (%)
        </h3>
        <p className="text-sm text-tremor-content mt-1">
          Positive = over-forecast, Negative = under-forecast
        </p>
        <BarChart
          className="mt-4 h-72"
          data={varianceData}
          index="period"
          categories={["Over Forecast", "Under Forecast"]}
          colors={["emerald", "red"]}
          yAxisWidth={60}
          stack
        />
      </Card>

      {/* Multi-Model Comparison */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          All Models Comparison ({metric === "contacts" ? "Contacts" : "AHT"})
        </h3>
        <p className="text-sm text-tremor-content mt-1">
          {selectedPlan} &middot; {selectedStream}
          {selectedYear !== "all" && ` \u00b7 ${selectedYear}`}
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
