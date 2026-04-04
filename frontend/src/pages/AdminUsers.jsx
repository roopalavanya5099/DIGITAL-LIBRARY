// AdminUsers.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

function AdminUsers() {
  const { token } = useContext(AuthContext); // Make sure your AuthContext provides 'token'
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* ================== FETCH USERS ================== */
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // ✅ Admin route for fetching users
        const res = await axios.get("http://localhost:8000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
        alert("Error fetching users");
      }
      setLoadingUsers(false);
    };

    loadUsers();
  }, [token]);

  /* ================== DELETE USER ================== */
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      // ✅ Admin route for deleting users
      await axios.delete(`http://localhost:8000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the deleted user from local state
      setUsers(users.filter((user) => user._id !== id));
      alert("User Deleted Successfully!");
    } catch (error) {
      console.error("Delete user error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Error deleting user");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Manage Users</h2>

      {loadingUsers ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users available</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUsers;