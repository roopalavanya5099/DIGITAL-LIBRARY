import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useContext(AuthContext);

  return (
    <div className="home-container">

      {/* Top Heading */}
  

      {/* Floating Books */}
      <div className="floating-books">
        <span className="book">📘</span>
        <span className="book">📕</span>
        <span className="book">📗</span>
        <span className="book">📙</span>
        <span className="book">📓</span>
        <span className="book">📔</span>
        <span className="book">📚</span>
        <span className="book">📖</span>
        <span className="book">📒</span>
        <span className="book">📑</span>
        <span className="book">📜</span>
        <span className="book">🗂️</span>
        <span className="book">📘</span>
        <span className="book">📕</span>
        <span className="book">📗</span>
        <span className="book">📙</span>
        <span className="book">📚</span>
        <span className="book">📖</span>
        <span className="book">📒</span>
        <span className="book">📑</span>
      </div>

      <h1 className="main-heading">Welcome to Digital Library 📚</h1>
      
      <h2 className="subtitle">
        Access thousands of e-books and PDFs anytime, anywhere.
      </h2>

      <div className="features">
        <div className="feature-box">📚<br /><strong>Huge Collection</strong></div>
        <div className="feature-box">🔍<br /><strong>Easy Search</strong></div>
        <div className="feature-box">⬇️<br /><strong>Download Anytime</strong></div>
        <div className="feature-box">👩‍🏫<br /><strong>Learn & Grow</strong></div>
      </div>

      <div className="button-group">
        {isAuthenticated() ? (
          <>
            <button 
              onClick={() => navigate(userRole === 'admin' ? '/admin' : '/user')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Home
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              🔐 Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn btn-secondary"
            >
              📝 Register
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default Home;
