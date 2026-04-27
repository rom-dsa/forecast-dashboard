import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forecast Model Performance Dashboard",
  description: "Forecasting model performance dashboard powered by Excel data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
