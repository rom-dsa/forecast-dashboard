# Forecast Model Performance Dashboard

A static GitHub Pages dashboard for tracking forecasting model performance. Powered by Excel data, built with **Next.js 14**, **Tailwind CSS**, and **Plotly**.

## Features

- **Overview**: KPI cards with best models, forecast accuracy, FTE variance, and attrition rates
- **Forecast vs Actual**: Intraday and daily trend charts comparing actual vs forecasted contacts and AHT
- **Model Metrics**: Comparison bar charts and detailed metrics table (MAPE, RMSE, MAE, SMAPE, R², Bias, Accuracy, W-MAPE)
- **Model Leaderboard**: Ranked model comparison with configurable ranking metric
- **Capacity Plan**: FTE variance analysis with Required vs Planned vs Actual charts
- **Extensible**: Add new metrics columns to the Excel file — they appear automatically in the dashboard

## Data Format

The dashboard reads from `public/data/forecast_data.xlsx` with three sheets:

### Sheet: `Forecast_vs_Actual`
| Column | Description |
|--------|-------------|
| date | Date (YYYY-MM-DD) |
| interval | Time interval (HH:MM) |
| queue | Queue name |
| channel | Channel (Voice, Chat, Email) |
| actual_contacts | Actual contact volume |
| forecasted_contacts | Forecasted contact volume |
| actual_aht | Actual average handle time (seconds) |
| forecasted_aht | Forecasted AHT (seconds) |

### Sheet: `Model_Metrics`
| Column | Description |
|--------|-------------|
| model_name | Model name (e.g., ARIMA, XGBoost) |
| metric_type | What the model forecasts (contacts, aht) |
| mape | Mean Absolute Percentage Error |
| rmse | Root Mean Square Error |
| mae | Mean Absolute Error |
| smape | Symmetric MAPE |
| r2 | R-squared |
| bias | Forecast bias |
| forecast_accuracy | 100 - MAPE |
| weighted_mape | Volume-weighted MAPE |

> **Extensibility**: Add any additional columns to this sheet — they will automatically appear in the metrics table.

### Sheet: `Capacity_Plan`
| Column | Description |
|--------|-------------|
| month | Month (YYYY-MM) |
| queue | Queue name |
| site | Site name |
| required_fte | Required FTE |
| planned_fte | Planned FTE |
| actual_fte | Actual FTE |
| variance_fte | Variance (actual - required) |
| shrinkage_pct | Shrinkage percentage |
| attrition_rate_pct | Attrition rate percentage |

## Quick Start

```bash
# Install dependencies
npm install

# Generate sample data
node scripts/generate-sample-data.mjs

# Start dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

## Updating Data

Replace `public/data/forecast_data.xlsx` with your updated Excel file and push to `main`. GitHub Pages will automatically rebuild and deploy.

## Deployment

The dashboard auto-deploys to GitHub Pages via GitHub Actions on every push to `main`.

**Live URL**: `https://rom-dsa.github.io/forecast-dashboard/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (Static Export) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Plotly |
| Data | SheetJS (xlsx) |
| Hosting | GitHub Pages |
