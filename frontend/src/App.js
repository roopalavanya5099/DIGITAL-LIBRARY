import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import User from "./pages/User";
import Admin from "./pages/Admin";
import BookDetails from "./pages/BookDetails";
import BookReader from "./pages/BookReader"; // ✅ Add this import

function AppRoutes() {
  const { userRole, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={
          isAuthenticated()
            ? userRole === "admin"
              ? <Navigate to="/admin" />
              : <Navigate to="/user" />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated()
            ? userRole === "admin"
              ? <Navigate to="/admin" />
              : <Navigate to="/user" />
            : <Register />
        }
      />

      <Route
        path="/user"
        element={isAuthenticated() ? <User /> : <Navigate to="/login" />}
      />

      <Route
        path="/admin"
        element={
          isAuthenticated() && userRole === "admin"
            ? <Admin />
            : <Navigate to="/login" />
        }
      />

      <Route
        path="/books/:id"
        element={isAuthenticated() ? <BookDetails /> : <Navigate to="/login" />}
      />

      {/* ✅ Book Reader Route */}
      <Route
        path="/read/:bookId"
        element={isAuthenticated() ? <BookReader /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;