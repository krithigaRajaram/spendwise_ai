import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import TransactionList from "../components/TransactionList";
import { API_BASE_URL } from "../config";

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");

    if (gmailStatus === "connected") {
      setGmailConnected(true);

      // Trigger backend email fetch
      fetch(`${API_BASE_URL}/auth/gmail/fetch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }).catch(console.error);

      setSearchParams({});

      setTimeout(() => {
        setGmailConnected(false);
      }, 4000);
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        {gmailConnected && (
          <div className="success-banner">
            Gmail connected successfully. Fetching transactions...
          </div>
        )}

        <TransactionList />
      </div>
    </>
  );
}

export default DashboardPage;