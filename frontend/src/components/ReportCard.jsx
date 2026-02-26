import CategoryList from "./CategoryList";
function ReportCard({ report }) {
  if (!report) return null;

  const categories = report.categories || [];

  const total =
    report.total ||
    categories.reduce((sum, cat) => sum + (cat.total || 0), 0);

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2>Monthly Report</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#eef3ff",
          borderRadius: "6px",
        }}
      >
        <h3>Total Spent</h3>
        <p style={{ fontSize: "24px", fontWeight: "bold" }}>
          ₹ {total}
        </p>
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