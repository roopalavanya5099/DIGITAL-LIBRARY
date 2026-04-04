import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [userCount, setUserCount] = useState(0);
  const [bookCount, setBookCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const usersRes = await axios.get("http://localhost:8000/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserCount(usersRes.data.length);
        const booksRes = await axios.get("http://localhost:8000/api/books");
        setBookCount(booksRes.data.length);
      } catch (err) {
        setUserCount(0);
        setBookCount(0);
      }
      setLoading(false);
    };
    fetchCounts();
  }, [token]);
  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="dashboard-nav" style={{ width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0.5em 0', textAlign: 'center' }}>
          <span role="img" aria-label="library" style={{ verticalAlign: 'middle', fontSize: '2.5rem' }}>📚</span> Digital Library
        </h1>
        <div className="nav-actions" style={{ position: 'absolute', right: '2em', top: '2em' }}>
          <span style={{ marginRight: '1em', fontWeight: 'bold' }}>ADMIN</span>
          <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
        </div>
      </div>
      <div className="dashboard-content" style={{ textAlign: 'center', marginTop: '3em' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5em' }}>Admin Dashboard</h1>
        <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '2em' }}>
          <span role="img" aria-label="library" style={{ verticalAlign: 'middle', fontSize: '2rem' }}>📚</span> Digital Library
        </h2>
        {/* Summary Section */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3em', marginBottom: '2em' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5em 2em', minWidth: '160px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5em', color: '#007bff' }}>Users</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', margin: '0.5em 0' }}>{loading ? '...' : userCount}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5em 2em', minWidth: '160px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5em', color: '#28a745' }}>Books</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', margin: '0.5em 0' }}>{loading ? '...' : bookCount}</div>
          </div>
        </div>
        <div className="dashboard-cards" style={{ display: 'flex', justifyContent: 'center', gap: '2em' }}>
          <div className="dashboard-card" style={{ padding: '2em', borderRadius: '16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', minWidth: '180px', textAlign: 'center' }} onClick={() => navigate("/admin/add-book")}>Add Books<br /><button className="card-btn" style={{ marginTop: '1em' }}>Add</button></div>
          <div className="dashboard-card" style={{ padding: '2em', borderRadius: '16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', minWidth: '180px', textAlign: 'center' }} onClick={() => navigate("/admin/view-books")}>View Books<br /><button className="card-btn" style={{ marginTop: '1em' }}>View</button></div>
          <div className="dashboard-card" style={{ padding: '2em', borderRadius: '16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', minWidth: '180px', textAlign: 'center' }} onClick={() => navigate("/admin/users")}>Users<br /><button className="card-btn" style={{ marginTop: '1em' }}>Manage</button></div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
