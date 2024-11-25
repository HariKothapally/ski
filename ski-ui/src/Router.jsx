// src/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from 'react';
import { useAuth } from "./hooks/useAuth";
import LoadingSpinner from "./components/shared/LoadingSpinner.jsx";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";

// Lazy load components
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const Login = lazy(() => import("./components/auth/Login.jsx"));
const Register = lazy(() => import("./components/auth/Register.jsx"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./components/auth/ResetPassword.jsx"));
const Expenditure = lazy(() => import("./components/shopping/Expenditure.jsx"));

// Define PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Router = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/expenditure" element={<PrivateRoute><Expenditure /></PrivateRoute>} />

          {/* Default Route */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* Catch-All Route */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Router;
