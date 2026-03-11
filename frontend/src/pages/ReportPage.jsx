import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchMonthlyReport } from "../services/reportService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function ReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMonthlyReport(month, year);

      const categories = Object.entries(data.expenseByCategory || {}).map(
        ([name, value]) => ({ name, value })
      );

      const total = data.totalExpense;
      categories.sort((a, b) => b.value - a.value);
      const enriched = categories.map((cat) => ({
        ...cat,
        value: Number(cat.value.toFixed(2)),
        percent: Number(((cat.value / total) * 100).toFixed(1)),
      }));

      setReport({ total, categories: enriched });
    };

    load();
  }, [month, year]);

  const generateColors = (count) =>
    Array.from({ length: count }, (_, i) =>
      `hsl(${(i * 360) / count}, 65%, 55%)`
    );

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate last 5 years as options
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="report-header">
          <h2 className="section-title">Monthly Expense Breakdown</h2>

          <div className="report-filters">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="report-select"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="report-select"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {!report ? (
          <div>Loading...</div>
        ) : report.categories.length === 0 ? (
          <div className="no-data">No expense data for {MONTHS[month - 1]} {year}</div>
        ) : (
          <div className="report-layout">
            <div className="category-panel">
              {report.categories.map((cat, index) => {
                const COLORS = generateColors(report.categories.length);
                return (
                  <div key={cat.name} className="category-item">
                    <div className="category-columns">
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-amount">₹ {cat.value.toFixed(2)}</span>
                      <span className="cat-percent">{cat.percent}%</span>
                    </div>
                    <div className="percent-bar">
                      <div
                        className="percent-fill"
                        style={{ width: `${cat.percent}%`, background: COLORS[index] }}
                      />
                    </div>
                  </div>
                );
              })}
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
                    {report.categories.map((_, index) => (
                      <Cell key={index} fill={generateColors(report.categories.length)[index]} />
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
        )}
      </div>
    </>
  );
}

export default ReportPage;