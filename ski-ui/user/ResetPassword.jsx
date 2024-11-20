import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided');
    }
  }, [token]);

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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        token,
        newPassword: formData.password
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while resetting your password.');
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
              <h1 className="fw-bold text-primary mb-2">Create New Password</h1>
              <p className="text-muted">Enter your new password below</p>
            </div>

            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}

                {message && (
                  <div className="alert alert-success d-flex align-items-center" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div>
                      {message}
                      <div className="small mt-1">
                        Redirecting to login page...
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="needs-validation">
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label small fw-bold">
                      New Password
                    </label>
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
                        placeholder="Enter your new password"
                        required
                        minLength="8"
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

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label small fw-bold">
                      Confirm New Password
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-lock-fill text-primary"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control border-start-0 border-end-0 bg-light"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your new password"
                        required
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
                      disabled={loading || !token}
                    >
                      {loading ? (
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span>Resetting Password...</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="bi bi-check-lg me-2"></i>
                          <span>Reset Password</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Remember your password?{' '}
                      <Link to="/login" className="text-primary fw-bold text-decoration-none">
                        Back to Login
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center mt-4">
              <small className="text-muted">
                © {new Date().getFullYear()} Ski-MS. All rights reserved.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
