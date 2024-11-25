// src/App.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import NavbarComponent from './components/NavbarComponent';

const App = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {!isAuthPage && isAuthenticated && <NavbarComponent />}
      <div className="container mt-5">
        <div className="text-center">
          <h1>Welcome to SKI Management System</h1>
          <p className="lead">Please login or register to continue.</p>
          <div className="mt-4">
            <Link to="/login" className="btn btn-primary me-3">Login</Link>
            <Link to="/register" className="btn btn-outline-primary">Register</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
