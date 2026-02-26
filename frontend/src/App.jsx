import { useEffect, useState } from "react";
import { fetchMonthlyReport } from "./services/reportService";
import ReportCard from "./components/ReportCard";


function App() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchMonthlyReport(2, 2026);

        // 🔥 Transform backend response to frontend-friendly format
        const formattedReport = {
          ...data,
          total: data.totalExpense,
          categories: Object.entries(data.expenseByCategory || {}).map(
            ([name, total]) => ({
              name,
              total
            })
          )
        };

        setReport(formattedReport);
      } catch (err) {
        setError("Failed to load report");
      }
    };

    loadReport();
  }, []);

  return (
    <div className="app-container">
      <div className="dashboard">
        <h1 className="app-heading">Expense Tracker</h1>

        {error && <p className="error-text">{error}</p>}

        {report && <ReportCard report={report} />}
      </div>
    </div>
  );
}
export default App;