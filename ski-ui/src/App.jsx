// src/App.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavbarComponent from './components/NavbarComponent';

const App = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <>
      <NavbarComponent />
      <div className="container-fluid" style={{ marginTop: '80px' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              {isLoggedIn ? (
                <div className="card">
                  <div className="card-body">
                    <h2 className="card-title mb-4">Welcome to SKI Management System</h2>
                    <div className="row g-4">
                      <div className="col-md-4">
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title">Expenditure Management</h5>
                            <p className="card-text">
                              Manage purchases, shopping lists, bills, and reviews in one place.
                            </p>
                            <Link 
                              to="/expenditure" 
                              className="btn btn-primary"
                            >
                              Go to Expenditure
                            </Link>
                          </div>
                        </div>
                      </div>
                      {/* Add more feature cards here */}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2>Welcome to SKI Management System</h2>
                  <p className="lead">Please login or register to continue.</p>
                  <div className="mt-4">
                    <Link to="/login" className="btn btn-primary me-3">Login</Link>
                    <Link to="/register" className="btn btn-outline-primary">Register</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
