import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const MONTHS = [
  "All", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function TransactionList({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [updatedCategory, setUpdatedCategory] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    try {
      let url = `${API_BASE_URL}/transactions`;
      if (month !== 0) {
        url += `?month=${month}&year=${year}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshKey, month, year]);

  const handleSaveClick = (id) => {
    setPendingSave({ id, category: updatedCategory });
    setShowMapModal(true);
  };

  const updateCategory = async (mapMerchant) => {
    const { id, category } = pendingSave;

    await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, mapMerchant }),
    });

    setShowMapModal(false);
    setPendingSave(null);
    setEditingId(null);
    fetchTransactions();
  };

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );
    if (!confirmDelete) return;

    await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchTransactions();
  };

  return (
    <div className="transactions-wrapper">
      <div className="transactions-header">
        <h3 className="section-title">Transactions</h3>

        <div className="transaction-filters">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="report-select"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
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

      <div className="transaction-table">
        <div className="transaction-header">
          <span>Merchant</span>
          <span>Category</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {transactions.length === 0 ? (
          <div className="no-data" style={{ padding: "30px", textAlign: "center" }}>
            No transactions found for this period.
          </div>
        ) : (
          transactions.map((txn) => (
            <div key={txn.id} className="transaction-row">
              <span className="merchant">{txn.merchant || "-"}</span>

              <span className="category">
                {editingId === txn.id ? (
                  <input
                    value={updatedCategory}
                    onChange={(e) => setUpdatedCategory(e.target.value)}
                    className="category-input"
                  />
                ) : (
                  txn.category
                )}
              </span>

              <span className={`type ${txn.type === "INCOME" ? "income-text" : "expense-text"}`}>
                {txn.type}
              </span>

              <span className={`amount ${txn.type === "INCOME" ? "income-text" : "expense-text"}`}>
                ₹ {txn.amount}
              </span>

              <span className="date">
                {txn.date ? new Date(txn.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) : "-"}
              </span>

              <span className="actions">
                {editingId === txn.id ? (
                  <button
                    className="btn btn-primary small"
                    onClick={() => handleSaveClick(txn.id)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary small"
                    onClick={() => {
                      setEditingId(txn.id);
                      setUpdatedCategory(txn.category);
                    }}
                  >
                    Edit
                  </button>
                )}

                <button
                  className="btn btn-danger small"
                  onClick={() => deleteTransaction(txn.id)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {showMapModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Update Category</h3>
            <p>Do you want to apply this category only to this transaction, or map this merchant for future transactions too?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => updateCategory(false)}>
                This transaction only
              </button>
              <button className="btn btn-primary" onClick={() => updateCategory(true)}>
                Map merchant for future
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionList;