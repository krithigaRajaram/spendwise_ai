import CategoryList from "./CategoryList";

function ReportCard({ report }) {
  if (!report) return null;

  const categories = report.categories || [];

  const total =
    report.total ||
    categories.reduce((sum, cat) => sum + (cat.total || 0), 0);

  return (
    <div className="report-card">
      <h2 style={{ marginBottom: "20px" }}>Monthly Report</h2>

      <div className="total-section">
        <h3>Total Spent</h3>
        <p className="total-amount">₹ {total}</p>
      </div>

      {categories.length > 0 ? (
        <CategoryList categories={categories} total={total} />
      ) : (
        <p>No category data available.</p>
      )}
    </div>
  );
}

export default ReportCard;