import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

interface DailyChartProps {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}

export const DailyTrendChart: React.FC<DailyChartProps> = ({ labels, incomeData, expenseData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['আজ'],
        datasets: [
          {
            label: 'আয় (Income)',
            data: incomeData.length > 0 ? incomeData : [0],
            borderColor: '#1E8A52',
            backgroundColor: 'rgba(30, 138, 82, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#0A4A29',
            pointRadius: 4,
          },
          {
            label: 'ব্যয় (Expense)',
            data: expenseData.length > 0 ? expenseData : [0],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#DC2626',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Hind Siliguri', size: 12, weight: 'bold' },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ৳ ${Number(context.raw).toLocaleString('en-US')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `৳ ${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [labels, incomeData, expenseData]);

  return (
    <div className="w-full h-64 sm:h-72">
      <canvas ref={canvasRef} />
    </div>
  );
};

interface MonthlyBarChartProps {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
  profitData: number[];
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  labels,
  incomeData,
  expenseData,
  profitData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['বর্তমান মাস'],
        datasets: [
          {
            label: 'মোট আয় (Income)',
            data: incomeData.length > 0 ? incomeData : [0],
            backgroundColor: '#1E8A52',
            borderRadius: 6,
          },
          {
            label: 'মোট ব্যয় (Expense)',
            data: expenseData.length > 0 ? expenseData : [0],
            backgroundColor: '#EF4444',
            borderRadius: 6,
          },
          {
            label: 'নিট লাভ (Net Profit)',
            data: profitData.length > 0 ? profitData : [0],
            backgroundColor: '#FFB300',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Hind Siliguri', size: 12, weight: 'bold' },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ৳ ${Number(context.raw).toLocaleString('en-US')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `৳ ${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [labels, incomeData, expenseData, profitData]);

  return (
    <div className="w-full h-64 sm:h-72">
      <canvas ref={canvasRef} />
    </div>
  );
};
