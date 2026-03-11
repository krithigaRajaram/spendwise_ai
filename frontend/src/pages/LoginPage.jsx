import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { Eye, EyeOff } from "lucide-react";

function LoginPage({ onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

const login = async () => {
  try {
    await loginUser(email, password);
    onAuth();
    navigate("/dashboard");
  } catch {
    alert("Invalid credentials");
  }
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/SpendWiseLogo.png" alt="logo" className="auth-logo" />
          <h2>SpendWise AI</h2>
          <p className="auth-tagline">
            Intelligent expense tracking powered by AI
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} color="#b0b3b8" /> : <Eye size={18} color="#b0b3b8" />}
          </span>
        </div>

        <button className="btn btn-primary full-width" onClick={login}>
          Login
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;