import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Navbar({ onFetchEmails, loading, syncing }) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

const connectGmail = () => {
  const token = localStorage.getItem("token");
  window.location.href = `${API_BASE_URL}/gmail/auth?token=${token}`;
};

  const goDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="navbar">
      <div className="logo-wrapper clickable-logo" onClick={goDashboard}>
        <img src="/SpendWiseLogo.png" alt="logo" className="logo-img" />
        <h2 className="logo-text">SpendWise AI</h2>
      </div>

      <div className="nav-actions">
        <button
          className="btn btn-secondary"
          onClick={connectGmail}
        >
          Connect Gmail
        </button>

        <button
          className="btn btn-info"
          onClick={onFetchEmails}
          disabled={loading || syncing}
        >
          {loading ? "Fetching..." : syncing ? "Syncing..." : "Fetch Emails"}
        </button>

        <button
          className={`btn btn-primary ${
            location.pathname === "/report" ? "active-nav" : ""
          }`}
          onClick={() => navigate("/report")}
        >
          Monthly Report
        </button>

        <button className="btn btn-danger" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;