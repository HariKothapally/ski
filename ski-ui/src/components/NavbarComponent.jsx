import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavbarComponent = () => {
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { role, username } = userInfo;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const renderNavLinks = () => {
    if (!authToken) return null;

    const links = [];

    // Common links for all authenticated users
    links.push(
      <li className="nav-item" key="expenditure">
        <Link className="nav-link" to="/expenditure">
          Expenditure Management
        </Link>
      </li>
    );

    // Admin-specific links
    if (role === 'ADMIN') {
      links.push(
        <>
          <li className="nav-item" key="admin">
            <Link className="nav-link" to="/admin">
              Admin Panel
            </Link>
          </li>
          <li className="nav-item" key="hr">
            <Link className="nav-link" to="/hr">
              HR Management
            </Link>
          </li>
        </>
      );
    }

    // Manager-specific links
    if (role === 'MANAGER' || role === 'ADMIN') {
      links.push(
        <li className="nav-item" key="reports">
          <Link className="nav-link" to="/reports">
            Reports
          </Link>
        </li>
      );
    }

    return links;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-house-door me-2"></i>
          SKI Management System
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {renderNavLinks()}
          </ul>
          <ul className="navbar-nav">
            {!authToken ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <span className="nav-link">
                    <i className="bi bi-person me-1"></i>
                    {username} ({role})
                  </span>
                </li>
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-light ms-2" 
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavbarComponent;
