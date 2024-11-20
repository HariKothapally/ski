// src/Router.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from 'react';
import App from "./App";
import RegistrationForm from "../user/RegistrationForm";
import LoginForm from "../user/LoginForm";
import PurchasesComponent from "../shopping/PurchasesComponent";
import ExpenditureComponent from "../shopping/ExpenditureComponent";
import HRManagerComponent from '../user/HRManagerComponent';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isAdmin = userInfo.role === 'ADMIN';
  return isAdmin ? children : <Navigate to="/" />;
};

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/purchases"
          element={
            <PrivateRoute>
              <PurchasesComponent />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/expenditure/*"
          element={
            <PrivateRoute>
              <ExpenditureComponent />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/hr-manager/*"
          element={
            <AdminRoute>
              <HRManagerComponent />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
