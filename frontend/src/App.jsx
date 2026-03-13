import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import { isAuthenticated } from "./services/authService";

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  const handleAuthChange = () => setAuthenticated(isAuthenticated());
  const handleLogout = () => {
  setAuthenticated(false);
};
  return (
    <Routes>
      <Route
        path="/"
        element={
          authenticated
            ? <Navigate to="/dashboard" />
            : <Navigate to="/login" />
        }
      />

      <Route path="/login" element={<LoginPage onAuth={handleAuthChange} />} />
      <Route path="/signup" element={<SignupPage onAuth={handleAuthChange} />} />

      <Route
        path="/dashboard"
        element={
          authenticated
            ? <DashboardPage onLogout={handleLogout}/>
            : <Navigate to="/login" />
        }
      />

      <Route
        path="/report"
        element={
          authenticated
            ? <ReportPage onLogout={handleLogout}/>
            : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

export default App;