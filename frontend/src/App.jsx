import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import { isAuthenticated } from "./services/authService";

function App() {
  const authenticated = isAuthenticated();

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

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/dashboard"
        element={
          authenticated
            ? <DashboardPage />
            : <Navigate to="/login" />
        }
      />

      <Route
        path="/report"
        element={
          authenticated
            ? <ReportPage />
            : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

export default App;