import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [updatedCategory, setUpdatedCategory] = useState("");

  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
          <span>Amount</span>
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

            <span className="amount">₹ {txn.amount}</span>

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