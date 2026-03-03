import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchMonthlyReport } from "../services/reportService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ReportPage() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMonthlyReport(2, 2026);

      const categories = Object.entries(
        data.expenseByCategory || {}
      ).map(([name, value]) => ({
        name,
        value,
      }));

      const total = data.totalExpense;  
      categories.sort((a, b) => b.value - a.value);
      const enriched = categories.map((cat) => ({
        ...cat,
        value: Number(cat.value.toFixed(2)),
        percent: Number(((cat.value / total) * 100).toFixed(1)),
      }));

      setReport({
        total,
        categories: enriched,
      });
    };

    load();
  }, []);

  if (!report) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">Loading...</div>
      </>
    );
  }

  // Generate dynamic distinct colors
  const generateColors = (count) => {
    return Array.from({ length: count }, (_, i) =>
      `hsl(${(i * 360) / count}, 65%, 55%)`
    );
  };

  const COLORS = generateColors(report.categories.length);

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <h2 className="section-title">Monthly Expense Breakdown</h2>

        <div className="report-layout">
           <div className="category-panel">
            {report.categories.map((cat, index) => (
              <div key={cat.name} className="category-item">
                <div className="category-columns">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-amount">₹ {cat.value.toFixed(2)}</span>
                  <span className="cat-percent">{cat.percent}%</span>
                </div>

                <div className="percent-bar">
                  <div
                    className="percent-fill"
                    style={{
                      width: `${cat.percent}%`,
                      background: COLORS[index],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={report.categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={85}
                  outerRadius={135}
                >
                  {report.categories.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="chart-center">
              <p>Total</p>
              <h3>₹ {report.total.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReportPage;