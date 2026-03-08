import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import TransactionList from "../components/TransactionList";
import { API_BASE_URL } from "../config";

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    type: "EXPENSE",
    category: "",
    merchant: "",
    date: ""
  });

  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");

    if (gmailStatus === "connected") {
      setGmailConnected(true);
      setSearchParams({});

      setTimeout(() => {
        setGmailConnected(false);
      }, 4000);
    }
  }, [searchParams, setSearchParams]);

  const fetchEmails = async () => {
    try {
      setLoading(true);

      await fetch(`${API_BASE_URL}/gmail/fetch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      setLoading(false);
      setSyncing(true);

      // Refresh transactions after a short delay so first batch appears
      setTimeout(() => setRefreshKey((prev) => prev + 1), 5000);

      // Keep refreshing every 10 seconds for 30 seconds
      setTimeout(() => setRefreshKey((prev) => prev + 1), 15000);
      setTimeout(() => setRefreshKey((prev) => prev + 1), 30000);

      // Hide syncing banner after 30 seconds
      setTimeout(() => setSyncing(false), 30000);

    } catch (err) {
      console.error("Fetch failed:", err);
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addTransaction = async (e) => {
    e.preventDefault();

    try {
      await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setShowForm(false);

      setFormData({
        amount: "",
        type: "EXPENSE",
        category: "",
        merchant: "",
        date: ""
      });

      setRefreshKey((prev) => prev + 1);

    } catch (err) {
      console.error("Failed to add transaction:", err);
    }
  };

  return (
    <>
      <Navbar onFetchEmails={fetchEmails} loading={loading} />

      <div className="dashboard-container">

        {gmailConnected && (
          <div className="success-banner">
            Gmail connected successfully.
          </div>
        )}

        {loading && (
          <div className="info-banner">
            Contacting Gmail...
          </div>
        )}

        {syncing && (
          <div className="info-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>⏳ Syncing emails in background, transactions will appear shortly...</span>
            <button
              onClick={() => { setSyncing(false); setRefreshKey((prev) => prev + 1); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Add Transaction Button */}
        <div style={{ marginBottom: "20px" }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Add Transaction
          </button>
        </div>

        {showForm && (
          <div className="manual-transaction-card">
            <h3 className="manual-transaction-title">Add Transaction</h3>

            <form className="manual-form" onSubmit={addTransaction}>
              <input
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                required
              />

              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>

              <input
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                required
              />

              <input
                name="merchant"
                placeholder="Merchant (optional)"
                value={formData.merchant}
                onChange={handleChange}
              />

              <input
                type="date"
                name="date"
                className="full-width"
                value={formData.date}
                onChange={handleChange}
              />

              <div className="manual-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button className="btn-primary" type="submit">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        <TransactionList refreshKey={refreshKey} />
      </div>
    </>
  );
}

export default DashboardPage;