"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CapacityPlanRow } from "../types";

interface CapacityTabProps {
  data: CapacityPlanRow[];
}

export default function CapacityTab({ data }: CapacityTabProps) {
  const queues = useMemo(() => [...new Set(data.map((r) => r.queue))], [data]);
  const sites = useMemo(() => [...new Set(data.map((r) => r.site))], [data]);
  const [selectedQueue, setSelectedQueue] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");

  const filtered = useMemo(
    () =>
      data.filter(
        (r) =>
          (selectedQueue === "all" || r.queue === selectedQueue) &&
          (selectedSite === "all" || r.site === selectedSite)
      ),
    [data, selectedQueue, selectedSite]
  );

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { required: number; planned: number; actual: number; variance: number }> = {};
    filtered.forEach((r) => {
      if (!byMonth[r.month]) byMonth[r.month] = { required: 0, planned: 0, actual: 0, variance: 0 };
      byMonth[r.month].required += r.required_fte;
      byMonth[r.month].planned += r.planned_fte;
      byMonth[r.month].actual += r.actual_fte;
      byMonth[r.month].variance += r.variance_fte;
    });
    return Object.keys(byMonth)
      .sort()
      .map((m) => ({
        month: m,
        required: Math.round(byMonth[m].required * 10) / 10,
        planned: Math.round(byMonth[m].planned * 10) / 10,
        actual: Math.round(byMonth[m].actual * 10) / 10,
        variance: Math.round(byMonth[m].variance * 10) / 10,
      }));
  }, [filtered]);

  const totalRequired = filtered.reduce((a, r) => a + r.required_fte, 0);
  const totalPlanned = filtered.reduce((a, r) => a + r.planned_fte, 0);
  const totalActual = filtered.reduce((a, r) => a + r.actual_fte, 0);
  const totalVariance = filtered.reduce((a, r) => a + r.variance_fte, 0);
  const avgShrinkage = filtered.length > 0
    ? filtered.reduce((a, r) => a + r.shrinkage_pct, 0) / filtered.length
    : 0;
  const avgAttrition = filtered.length > 0
    ? filtered.reduce((a, r) => a + r.attrition_rate_pct, 0) / filtered.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters + Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Queue</label>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Queues</option>
              {queues.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Site</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Sites</option>
              {sites.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto grid grid-cols-3 sm:grid-cols-6 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-gray-500">Required</p>
              <p className="font-bold text-gray-900">{totalRequired.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Planned</p>
              <p className="font-bold text-gray-900">{totalPlanned.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Actual</p>
              <p className="font-bold text-gray-900">{totalActual.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Variance</p>
              <p className={`font-bold ${totalVariance < 0 ? "text-red-600" : "text-green-600"}`}>
                {totalVariance > 0 ? "+" : ""}{totalVariance.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Shrinkage</p>
              <p className="font-bold text-gray-900">{avgShrinkage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Attrition</p>
              <p className="font-bold text-gray-900">{avgAttrition.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* FTE Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">FTE: Required vs Planned vs Actual</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis label={{ value: "FTE", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="required" name="Required FTE" stroke="#DC2626" strokeWidth={2} />
            <Line type="monotone" dataKey="planned" name="Planned FTE" stroke="#4F46E5" strokeWidth={2} />
            <Line type="monotone" dataKey="actual" name="Actual FTE" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Variance Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">FTE Variance by Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis label={{ value: "Variance (FTE)", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Bar dataKey="variance" name="Variance (FTE)">
              {monthlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.variance < 0 ? "#DC2626" : "#059669"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Queue</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Site</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Required</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Planned</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actual</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Variance</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Shrinkage %</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Attrition %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r, i) => (
              <tr key={`${r.month}-${r.queue}-${i}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{r.month}</td>
                <td className="px-4 py-3 text-gray-600">{r.queue}</td>
                <td className="px-4 py-3 text-gray-600">{r.site}</td>
                <td className="text-right px-4 py-3">{r.required_fte.toFixed(1)}</td>
                <td className="text-right px-4 py-3">{r.planned_fte.toFixed(1)}</td>
                <td className="text-right px-4 py-3">{r.actual_fte.toFixed(1)}</td>
                <td className={`text-right px-4 py-3 font-medium ${
                  r.variance_fte < 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {r.variance_fte > 0 ? "+" : ""}{r.variance_fte.toFixed(1)}
                </td>
                <td className="text-right px-4 py-3">{r.shrinkage_pct.toFixed(1)}</td>
                <td className="text-right px-4 py-3">{r.attrition_rate_pct.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
