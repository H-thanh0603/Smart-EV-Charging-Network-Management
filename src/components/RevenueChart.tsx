"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Point = { date: string; revenue: number; energy: number; count: number };

export default function RevenueChart({ data }: { data: Point[] }) {
  const labels = data.map((d) => d.date);

  return (
    <div style={{ position: "relative", height: 340 }}>
      <Chart
        type="bar"
        data={{
          labels,
          datasets: [
            {
              type: "bar" as const,
              label: "Doanh thu (₫)",
              data: data.map((d) => d.revenue),
              backgroundColor: "rgba(16, 185, 129, 0.75)",
              borderRadius: 6,
              yAxisID: "y",
              order: 2,
            },
            {
              type: "line" as const,
              label: "Năng lượng (kWh)",
              data: data.map((d) => d.energy),
              borderColor: "rgb(8, 145, 178)",
              backgroundColor: "rgba(8, 145, 178, 0.15)",
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 3,
              yAxisID: "y1",
              order: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top" },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = ctx.parsed.y ?? 0;
                  if (ctx.dataset.yAxisID === "y")
                    return ` Doanh thu: ${v.toLocaleString("vi-VN")} ₫`;
                  return ` Năng lượng: ${v.toFixed(1)} kWh`;
                },
              },
            },
          },
          scales: {
            y: {
              type: "linear",
              position: "left",
              title: { display: true, text: "Doanh thu (₫)" },
              ticks: {
                callback: (val) => Number(val).toLocaleString("vi-VN"),
              },
            },
            y1: {
              type: "linear",
              position: "right",
              title: { display: true, text: "kWh" },
              grid: { drawOnChartArea: false },
            },
          },
        }}
      />
    </div>
  );
}
