import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        email
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setResetToken(response.data.resetToken); // In production, this would be sent via email
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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
              <h1 className="fw-bold text-primary mb-2">Reset Password</h1>
              <p className="text-muted">Enter your email to reset your password</p>
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
                    <div>{message}</div>
                  </div>
                )}

                {resetToken && (
                  <div className="alert alert-info mb-4">
                    <p className="mb-1">Your reset token (for development):</p>
                    <small className="d-block text-break">{resetToken}</small>
                    <Link 
                      to={`/reset-password?token=${resetToken}`}
                      className="btn btn-info btn-sm mt-2"
                    >
                      Continue to Reset Password
                    </Link>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="needs-validation">
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label small fw-bold">
                      Email Address
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-envelope text-primary"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 bg-light"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
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
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="bi bi-envelope me-2"></i>
                          <span>Send Reset Instructions</span>
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

export default ForgotPassword;
