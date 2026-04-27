import XLSX from "xlsx";
import { mkdirSync } from "fs";

mkdirSync("public/data", { recursive: true });

// --- Forecast vs Actual ---
const queues = ["Billing", "Technical Support", "Sales", "Retention"];
const channels = ["Voice", "Chat", "Email"];
const dates = [];
for (let d = new Date("2026-01-05"); d <= new Date("2026-01-31"); d.setDate(d.getDate() + 1)) {
  dates.push(d.toISOString().split("T")[0]);
}

const intervals = [];
for (let h = 8; h < 20; h++) {
  intervals.push(`${String(h).padStart(2, "0")}:00`);
  intervals.push(`${String(h).padStart(2, "0")}:30`);
}

const forecastRows = [];
for (const date of dates) {
  for (const queue of queues) {
    const ch = channels[queues.indexOf(queue) % channels.length];
    for (const interval of intervals) {
      const hour = parseInt(interval.split(":")[0]);
      const peakFactor = hour >= 10 && hour <= 14 ? 1.5 : 1.0;
      const baseContacts = Math.round((40 + Math.random() * 30) * peakFactor);
      const forecastedContacts = Math.round(baseContacts * (0.9 + Math.random() * 0.2));
      const baseAHT = 180 + Math.random() * 120;
      const forecastedAHT = baseAHT * (0.92 + Math.random() * 0.16);

      forecastRows.push({
        date,
        interval,
        queue,
        channel: ch,
        actual_contacts: baseContacts,
        forecasted_contacts: forecastedContacts,
        actual_aht: Math.round(baseAHT),
        forecasted_aht: Math.round(forecastedAHT),
      });
    }
  }
}

// --- Model Metrics ---
const models = [
  { name: "ARIMA", type: "contacts" },
  { name: "SARIMA", type: "contacts" },
  { name: "Holt-Winters", type: "contacts" },
  { name: "Linear Regression", type: "contacts" },
  { name: "XGBoost", type: "contacts" },
  { name: "Random Forest", type: "contacts" },
  { name: "Prophet", type: "contacts" },
  { name: "Ensemble (Weighted)", type: "contacts" },
  { name: "ARIMA", type: "aht" },
  { name: "Holt-Winters", type: "aht" },
  { name: "XGBoost", type: "aht" },
  { name: "Prophet", type: "aht" },
  { name: "Ensemble (Weighted)", type: "aht" },
];

const metricRows = models.map(({ name, type }) => {
  const baseMape = 3 + Math.random() * 15;
  return {
    model_name: name,
    metric_type: type,
    mape: Math.round(baseMape * 100) / 100,
    rmse: Math.round((baseMape * 2.5 + Math.random() * 10) * 100) / 100,
    mae: Math.round((baseMape * 1.8 + Math.random() * 5) * 100) / 100,
    smape: Math.round((baseMape * 0.95 + Math.random() * 2) * 100) / 100,
    r2: Math.round((0.98 - baseMape / 100) * 10000) / 10000,
    bias: Math.round((Math.random() * 6 - 3) * 100) / 100,
    forecast_accuracy: Math.round((100 - baseMape) * 100) / 100,
    weighted_mape: Math.round((baseMape * 1.05 + Math.random() * 2) * 100) / 100,
  };
});

// --- Capacity Plan ---
const sites = ["NYC", "Manila", "Bangalore", "London"];
const months = [
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
  "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
];

const capacityRows = [];
for (const month of months) {
  for (const queue of queues) {
    const site = sites[queues.indexOf(queue) % sites.length];
    const requiredFTE = Math.round((20 + Math.random() * 30) * 10) / 10;
    const plannedFTE = Math.round((requiredFTE * (0.9 + Math.random() * 0.2)) * 10) / 10;
    const actualFTE = Math.round((plannedFTE * (0.85 + Math.random() * 0.3)) * 10) / 10;
    capacityRows.push({
      month,
      queue,
      site,
      required_fte: requiredFTE,
      planned_fte: plannedFTE,
      actual_fte: actualFTE,
      variance_fte: Math.round((actualFTE - requiredFTE) * 10) / 10,
      shrinkage_pct: Math.round((25 + Math.random() * 10) * 10) / 10,
      attrition_rate_pct: Math.round((3 + Math.random() * 8) * 10) / 10,
    });
  }
}

// Build workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(forecastRows), "Forecast_vs_Actual");
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricRows), "Model_Metrics");
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(capacityRows), "Capacity_Plan");

XLSX.writeFile(wb, "public/data/forecast_data.xlsx");
console.log("Sample data generated: public/data/forecast_data.xlsx");
console.log(`  Forecast rows: ${forecastRows.length}`);
console.log(`  Model metrics: ${metricRows.length}`);
console.log(`  Capacity plan: ${capacityRows.length}`);
