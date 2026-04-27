"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import OverviewTab from "./components/OverviewTab";
import ForecastTab from "./components/ForecastTab";
import MetricsTab from "./components/MetricsTab";
import LeaderboardTab from "./components/LeaderboardTab";
import CapacityTab from "./components/CapacityTab";
import { loadDashboardData } from "./lib/parse-excel";
import type { DashboardData } from "./types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData(`${basePath}/data/forecast_data.xlsx`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800">Failed to load data</h2>
          <p className="text-red-700 mt-2">{error || "Unknown error"}</p>
          <p className="text-sm text-red-500 mt-2">
            Make sure <code className="bg-red-100 px-1 rounded">public/data/forecast_data.xlsx</code> exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Forecast Model Performance
          </h1>
          <p className="text-gray-500 mt-1">
            {data.modelMetrics.length} model evaluations &middot;{" "}
            {[...new Set(data.forecastData.map((r) => r.queue))].length} queues &middot;{" "}
            {data.capacityPlan.length} capacity plan records
          </p>
        </div>

        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "forecast" && <ForecastTab data={data.forecastData} />}
        {activeTab === "metrics" && <MetricsTab metrics={data.modelMetrics} />}
        {activeTab === "leaderboard" && <LeaderboardTab metrics={data.modelMetrics} />}
        {activeTab === "capacity" && <CapacityTab data={data.capacityPlan} />}
      </div>
    </>
  );
}
