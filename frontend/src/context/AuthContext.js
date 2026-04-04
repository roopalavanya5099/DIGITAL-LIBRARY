import React, { createContext, useState, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  const [userName, setUserName] = useState(localStorage.getItem("userName"));
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail"));
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= REGISTER ================= */
  const register = useCallback(async (name, email, password, rollNumber) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, rollNumber }),
      });

      const text = await res.text();
      console.log("REGISTER RESPONSE TEXT:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOGIN ================= */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      console.log("LOGIN RESPONSE TEXT:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setAuthToken(data.token);
      setUserEmail(data.user.email);
      setUserRole(data.user.role);
      setUserName(data.user.name);
      setUserId(data.user.id);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userEmail", data.user.email || "");
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userId", data.user.id);

      return { success: true, role: data.user.role };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= GUEST LOGIN ================= */
  const guestLogin = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/users/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const text = await res.text();
      console.log("GUEST RESPONSE TEXT:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Response is not JSON: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.message || "Guest login failed");
      }

      setAuthToken(data.token);
      setUserEmail("");
      setUserRole(data.user.role);
      setUserName(data.user.name);
      setUserId(data.user.id);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userEmail", "");
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userId", data.user.id);

      return { success: true, role: data.user.role };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOGOUT ================= */
  const logout = useCallback(() => {
    setAuthToken(null);
    setUserEmail(null);
    setUserRole(null);
    setUserName(null);
    setUserId(null);
    setError(null);
    localStorage.clear();
  }, []);

  /* ================= AUTH CHECK ================= */
  const isAuthenticated = useCallback(() => !!authToken, [authToken]);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userRole,
        userName,
        userEmail,
        userId,
        loading,
        error,
        register,
        login,
        guestLogin,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};