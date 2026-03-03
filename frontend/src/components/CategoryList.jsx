function CategoryList({ categories, total }) {
  const sorted = categories.slice().sort((a, b) => b.total - a.total);

  return (
    <div>
      <h3 className="category-title">Category Breakdown</h3>

      {sorted.map((cat) => {
        const percentage =
          total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0;

        return (
          <div key={cat.name} className="category-item">
            <div className="category-row">
              <span>{cat.name}</span>
              <span>
                ₹ {cat.total} ({percentage}%)
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryList;