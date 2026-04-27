"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import type { ForecastRow } from "../types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ForecastTabProps {
  data: ForecastRow[];
}

export default function ForecastTab({ data }: ForecastTabProps) {
  const queues = useMemo(() => [...new Set(data.map((r) => r.queue))], [data]);
  const dates = useMemo(() => [...new Set(data.map((r) => r.date))].sort(), [data]);

  const [selectedQueue, setSelectedQueue] = useState<string>(queues[0] || "");
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || "");
  const [metric, setMetric] = useState<"contacts" | "aht">("contacts");

  const filtered = useMemo(
    () =>
      data.filter(
        (r) => r.queue === selectedQueue && r.date === selectedDate
      ),
    [data, selectedQueue, selectedDate]
  );

  const intervals = filtered.map((r) => r.interval);
  const actuals =
    metric === "contacts"
      ? filtered.map((r) => r.actual_contacts)
      : filtered.map((r) => r.actual_aht);
  const forecasted =
    metric === "contacts"
      ? filtered.map((r) => r.forecasted_contacts)
      : filtered.map((r) => r.forecasted_aht);

  // Compute daily summary
  const totalActual = actuals.reduce((a, b) => a + b, 0);
  const totalForecast = forecasted.reduce((a, b) => a + b, 0);
  const variance =
    totalActual > 0
      ? ((totalForecast - totalActual) / totalActual) * 100
      : 0;

  // Daily aggregated view across all dates
  const dailyData = useMemo(() => {
    const byDate: Record<string, { actual: number; forecast: number }> = {};
    data
      .filter((r) => r.queue === selectedQueue)
      .forEach((r) => {
        if (!byDate[r.date]) byDate[r.date] = { actual: 0, forecast: 0 };
        if (metric === "contacts") {
          byDate[r.date].actual += r.actual_contacts;
          byDate[r.date].forecast += r.forecasted_contacts;
        } else {
          byDate[r.date].actual += r.actual_aht;
          byDate[r.date].forecast += r.forecasted_aht;
        }
      });
    const sortedDates = Object.keys(byDate).sort();
    return {
      dates: sortedDates,
      actuals: sortedDates.map((d) => byDate[d].actual),
      forecasts: sortedDates.map((d) => byDate[d].forecast),
    };
  }, [data, selectedQueue, metric]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Queue</label>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {queues.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
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
              <p className="text-xs text-gray-500">Actual</p>
              <p className="font-bold text-gray-900">
                {metric === "contacts" ? totalActual.toLocaleString() : `${(totalActual / filtered.length || 0).toFixed(0)}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Forecast</p>
              <p className="font-bold text-gray-900">
                {metric === "contacts" ? totalForecast.toLocaleString() : `${(totalForecast / filtered.length || 0).toFixed(0)}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Variance</p>
              <p className={`font-bold ${Math.abs(variance) > 10 ? "text-red-600" : "text-green-600"}`}>
                {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intraday Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Intraday: {selectedQueue} - {selectedDate}
        </h3>
        <Plot
          data={[
            {
              x: intervals,
              y: actuals,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Actual",
              line: { color: "#1F2937", width: 2 },
              marker: { size: 4 },
            },
            {
              x: intervals,
              y: forecasted,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Forecast",
              line: { color: "#4F46E5", width: 2, dash: "dot" as const },
              marker: { size: 4 },
            },
          ]}
          layout={{
            xaxis: { title: "Interval", tickangle: -45 },
            yaxis: { title: metric === "contacts" ? "Contacts" : "AHT (seconds)" },
            legend: { orientation: "h" as const, y: -0.25 },
            margin: { t: 20, r: 20, b: 80, l: 60 },
            hovermode: "x unified" as const,
            height: 400,
          }}
          config={{ responsive: true, displayModeBar: true }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Daily Trend: {selectedQueue}
        </h3>
        <Plot
          data={[
            {
              x: dailyData.dates,
              y: dailyData.actuals,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Actual",
              line: { color: "#1F2937", width: 2 },
            },
            {
              x: dailyData.dates,
              y: dailyData.forecasts,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              name: "Forecast",
              line: { color: "#4F46E5", width: 2, dash: "dot" as const },
            },
          ]}
          layout={{
            xaxis: { title: "Date", type: "date" as const },
            yaxis: {
              title: metric === "contacts" ? "Total Contacts" : "Total AHT (seconds)",
            },
            legend: { orientation: "h" as const, y: -0.2 },
            margin: { t: 20, r: 20, b: 60, l: 60 },
            hovermode: "x unified" as const,
            height: 350,
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
