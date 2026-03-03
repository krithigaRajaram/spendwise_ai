import { useEffect, useState } from "react";
import { fetchMonthlyReport } from "./services/reportService";
import ReportCard from "./components/ReportCard";
import "./index.css";

function App() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchMonthlyReport(2, 2026);

        const formattedReport = {
          ...data,
          total: data.totalExpense,
          categories: Object.entries(data.expenseByCategory || {}).map(
            ([name, total]) => ({
              name,
              total,
            })
          ),
        };

        setReport(formattedReport);
      } catch (err) {
        if (err.message.includes("No authentication token")) {
          setError("Authentication required. Please login.");
        } else {
          setError("Failed to load report.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  return (
    <div className="app-container">
      <div className="dashboard">
        <h1 className="app-heading">Expense Tracker</h1>

        {loading && <p className="loading-text">Loading report...</p>}

        {error && <p className="error-text">{error}</p>}

        {!loading && report && <ReportCard report={report} />}
      </div>
    </div>
  );
}

export default App;