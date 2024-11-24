import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, formData);

      if (response.data && response.data.token) {
        const userInfo = {
          username: response.data.username,
          id: response.data.id,
          role: response.data.role,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          employeeID: response.data.employeeID
        };

        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        console.log(`Welcome ${userInfo.firstName} ${userInfo.lastName} (${userInfo.role})`);

        if (userInfo.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" 
         style={{ 
           background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
           minHeight: '100vh'
         }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="text-center mb-4">
              <h1 className="fw-bold text-primary mb-2">Ski-MS</h1>
              <p className="text-muted">Welcome back! Please login to your account.</p>
            </div>
            
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="needs-validation">
                  <div className="mb-4">
                    <label htmlFor="login" className="form-label small fw-bold">
                      Username or Email
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-person text-primary"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 bg-light"
                        id="login"
                        name="login"
                        value={formData.login}
                        onChange={handleChange}
                        placeholder="Enter your username or email"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <label htmlFor="password" className="form-label small fw-bold">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-primary text-decoration-none small">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-lock text-primary"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control border-start-0 border-end-0 bg-light"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        className="input-group-text bg-light border-start-0"
                        type="button"
                        onClick={togglePasswordVisibility}
                      >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-primary`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="d-grid mb-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          <span>Sign In</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary fw-bold text-decoration-none">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center mt-4">
              <small className="text-muted">
                &copy; {new Date().getFullYear()} Ski-MS. All rights reserved.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
