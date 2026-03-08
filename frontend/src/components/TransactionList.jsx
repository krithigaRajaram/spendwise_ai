import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function TransactionList({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [updatedCategory, setUpdatedCategory] = useState("");

  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions`, {
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
  }, [refreshKey]);

  const updateCategory = async (id) => {
    await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category: updatedCategory }),
    });

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
      <h3 className="section-title">Recent Transactions</h3>

      <div className="transaction-table">
        <div className="transaction-header">
          <span>Merchant</span>
          <span>Category</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {transactions.map((txn) => (
          <div key={txn.id} className="transaction-row">
            <span className="merchant">{txn.merchant}</span>

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

            <span
              className={`type ${
                txn.type === "INCOME" ? "income-text" : "expense-text"
              }`}
            >
              {txn.type}
            </span>

            <span
              className={`amount ${
                txn.type === "INCOME" ? "income-text" : "expense-text"
              }`}
            >
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
                  onClick={() => updateCategory(txn.id)}
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
        ))}
      </div>
    </div>
  );
}

export default TransactionList;