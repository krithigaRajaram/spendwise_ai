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

      //2–3 seconds to process
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
        setLoading(false);
      }, 3000);

    } catch (err) {
      console.error("Fetch failed:", err);
      setLoading(false);
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
            Fetching latest transactions...
          </div>
        )}

        <TransactionList refreshKey={refreshKey} />
      </div>
    </>
  );
}
export default DashboardPage;