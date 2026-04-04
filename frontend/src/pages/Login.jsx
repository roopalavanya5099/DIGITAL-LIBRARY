import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login, guestLogin, loading, error } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Please enter email and password");
      return;
    }

    try {
      const result = await login(email, password);

      if (result.success) {
        if (result.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      }
    } catch (err) {
      setLocalError(err.message || "Login failed");
    }
  };

  const handleGuestLogin = async () => {
    setLocalError("");

    try {
      const result = await guestLogin();
      if (result.success) {
        navigate("/user");
      }
    } catch (err) {
      setLocalError(err.message || "Guest login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
      </div>

      <form onSubmit={handleLogin} className="auth-form login-form">
        <div className="form-header">
          <div className="logo-circle">
            <span className="logo-icon">📚</span>
          </div>

          <h1 className="auth-title">Digital Library</h1>
          <p className="auth-subtitle">
            Welcome back! Sign in to continue to your account
          </p>
        </div>

        {(localError || error) && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Authentication Error</strong>
              <p>{localError || error}</p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div
            className={`input-wrapper ${
              focusedField === "email" ? "focused" : ""
            }`}
          >
            <span className="input-icon">✉️</span>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="auth-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div
            className={`input-wrapper ${
              focusedField === "password" ? "focused" : ""
            }`}
          >
            <span className="input-icon">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="auth-input"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-button login-button"
        >
          {loading ? "Logging in..." : "Sign In"}
        </button>

        <p className="auth-helper-text">
          <span
            className={`guest-link ${loading ? "disabled-link" : ""}`}
            onClick={!loading ? handleGuestLogin : undefined}
          >
            {loading ? "Please wait..." : "Continue as Guest"}
          </span>
        </p>

        <div className="divider">
          <span>Don't have an account?</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="auth-link-button"
        >
          Create an account
        </button>
      </form>

      <div className="auth-footer">
        <p>© 2026 Digital Library. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;