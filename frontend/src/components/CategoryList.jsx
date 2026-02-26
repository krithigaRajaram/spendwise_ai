function CategoryList({ categories, total }) {
  const sorted = categories.slice().sort((a, b) => b.total - a.total);

  return (
    <div>
      <h3>Category Breakdown</h3>
      {sorted.map((cat) => {
        const percentage =
          total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0;

        return (
          <div
            key={cat.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>{cat.name}</span>
            <span>
              ₹ {cat.total} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}
export default CategoryList;