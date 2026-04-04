import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useContext(AuthContext);

  const [rollNumber, setRollNumber] = useState("");
  const [rollVerified, setRollVerified] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [verifyingRoll, setVerifyingRoll] = useState(false);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  const handleVerifyRollNumber = async () => {
    setLocalError("");
    setSuccessMessage("");

    if (!rollNumber.trim()) {
      setLocalError("Roll number is required");
      return;
    }

    try {
      setVerifyingRoll(true);

      const response = await fetch(
        "http://localhost:8000/api/users/verify-roll-number",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rollNumber: rollNumber.trim().toUpperCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRollVerified(false);
        setSuccessMessage("");
        setLocalError(data.message || "Verification failed");
        return;
      }

      setRollVerified(true);
      setRollNumber(rollNumber.trim().toUpperCase());
      setLocalError("");
      setSuccessMessage("Roll number verified successfully");
    } catch (err) {
      setRollVerified(false);
      setSuccessMessage("");
      setLocalError("Unable to verify roll number");
    } finally {
      setVerifyingRoll(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMessage("");

    if (!rollVerified) {
      setLocalError("Please verify your roll number first");
      return;
    }

    if (!name.trim()) {
      setLocalError("Full name is required");
      return;
    }

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    if (!passwordRegex.test(password)) {
      setLocalError(
        "Password must contain uppercase, lowercase, number and 6+ characters"
      );
      return;
    }

    if (!confirmPassword) {
      setLocalError("Confirm password is required");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register(name, email, password, rollNumber);
      alert("Account created successfully");
      navigate("/login");
    } catch (err) {
      setLocalError(err.message || "Registration failed");
    }
  };

  const isPasswordStrong = passwordRegex.test(password);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
      </div>

      <form onSubmit={handleRegister} className="auth-form register-form">
        <div className="form-header">
          <div className="logo-circle">
            <span className="logo-icon">📚</span>
          </div>

          <h1 className="auth-title">
            {rollVerified ? "Complete Signup" : "Verify Roll Number"}
          </h1>

          <p className="auth-subtitle">
            {rollVerified
              ? `Roll Number: ${rollNumber}`
              : "Enter your college roll number to verify and continue"}
          </p>
        </div>

        {localError && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error</strong>
              <p>{localError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <div>
              <strong>Success</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {!rollVerified && (
          <>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <div
                className={`input-wrapper ${
                  focusedField === "rollNumber" ? "focused" : ""
                }`}
              >
                <span className="input-icon">🆔</span>
                <input
                  type="text"
                  placeholder="Enter roll number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  onFocus={() => setFocusedField("rollNumber")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyRollNumber}
              disabled={verifyingRoll}
              className="auth-button register-button"
            >
              {verifyingRoll ? "Verifying..." : "Verify Roll Number"}
            </button>
          </>
        )}

        {rollVerified && (
          <>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div
                className={`input-wrapper ${
                  focusedField === "name" ? "focused" : ""
                }`}
              >
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div
                className={`input-wrapper ${
                  focusedField === "email" ? "focused" : ""
                }`}
              >
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input"
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
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {password && (
                <div
                  className={`password-strength ${
                    isPasswordStrong ? "strong" : "weak"
                  }`}
                >
                  {isPasswordStrong
                    ? "Strong password"
                    : "Use uppercase, lowercase and number"}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div
                className={`input-wrapper ${
                  focusedField === "confirm" ? "focused" : ""
                }`}
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="password-toggle"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`password-strength ${
                    passwordsMatch ? "match" : "no-match"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong || !passwordsMatch}
              className="auth-button register-button"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </>
        )}

        <div className="divider">
          <span>Already have an account?</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="auth-link-button"
        >
          Sign In Instead
        </button>
      </form>

      <div className="auth-footer">
        <p>© 2026 Digital Library</p>
      </div>
    </div>
  );
}

export default Register;