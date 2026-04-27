"use client";

import { useState, useMemo } from "react";
import { Card, LineChart } from "@tremor/react";
import type { ForecastRow } from "../types";

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

  const intradayData = filtered.map((r) => ({
    interval: r.interval,
    Actual: metric === "contacts" ? r.actual_contacts : r.actual_aht,
    Forecast: metric === "contacts" ? r.forecasted_contacts : r.forecasted_aht,
  }));

  const totalActual = intradayData.reduce((a, b) => a + b.Actual, 0);
  const totalForecast = intradayData.reduce((a, b) => a + b.Forecast, 0);
  const variance =
    totalActual > 0
      ? ((totalForecast - totalActual) / totalActual) * 100
      : 0;

  const dailyData = useMemo(() => {
    const byDate: Record<string, { Actual: number; Forecast: number }> = {};
    data
      .filter((r) => r.queue === selectedQueue)
      .forEach((r) => {
        if (!byDate[r.date]) byDate[r.date] = { Actual: 0, Forecast: 0 };
        if (metric === "contacts") {
          byDate[r.date].Actual += r.actual_contacts;
          byDate[r.date].Forecast += r.forecasted_contacts;
        } else {
          byDate[r.date].Actual += r.actual_aht;
          byDate[r.date].Forecast += r.forecasted_aht;
        }
      });
    return Object.keys(byDate)
      .sort()
      .map((d) => ({ date: d, Actual: byDate[d].Actual, Forecast: byDate[d].Forecast }));
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
                {metric === "contacts" ? totalActual.toLocaleString() : `${(totalActual / (filtered.length || 1)).toFixed(0)}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Forecast</p>
              <p className="font-bold text-gray-900">
                {metric === "contacts" ? totalForecast.toLocaleString() : `${(totalForecast / (filtered.length || 1)).toFixed(0)}s`}
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
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Intraday: {selectedQueue} - {selectedDate}
        </h3>
        <LineChart
          className="mt-4 h-96"
          data={intradayData}
          index="interval"
          categories={["Actual", "Forecast"]}
          colors={["gray", "indigo"]}
          yAxisWidth={65}
          connectNulls
        />
      </Card>

      {/* Daily Trend Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-tremor-content-strong">
          Daily Trend: {selectedQueue}
        </h3>
        <LineChart
          className="mt-4 h-80"
          data={dailyData}
          index="date"
          categories={["Actual", "Forecast"]}
          colors={["gray", "indigo"]}
          yAxisWidth={65}
          connectNulls
        />
      </Card>
    </div>
  );
}
