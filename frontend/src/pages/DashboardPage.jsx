import Navbar from "../components/Navbar";
import TransactionList from "../components/TransactionList";
import { API_BASE_URL } from "../config";

function DashboardPage() {
  const connectGmail = () => {
    window.location.href = `${API_BASE_URL}/auth/gmail`;
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <TransactionList />
      </div>
    </>
  );
}

export default DashboardPage;