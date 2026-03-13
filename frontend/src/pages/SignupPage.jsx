import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { Eye, EyeOff } from "lucide-react";

function SignupPage({ onAuth }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
    alert("Name, email and password are all required");
    return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
          alert(data.error || "Signup failed");
              return;      
        }
        
      localStorage.setItem("token", data.token);
      onAuth();
      navigate("/dashboard");
    } catch (err) {
      alert("Signup failed");
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
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <button className="btn btn-primary full-width" onClick={signup}>
          Create Account
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;