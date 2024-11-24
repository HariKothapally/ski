// src/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from 'react';
import App from "./App";
import LoadingSpinner from "./components/shared/LoadingSpinner";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Lazy load components
const Dashboard = lazy(() => import("./components/Dashboard"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/auth/ResetPassword"));
const Expenditure = lazy(() => import("./components/shopping/Expenditure"));

const MenuManagement = lazy(() => import("./components/menu/MenuManagement"));
const InventoryManagement = lazy(() => import("./components/inventory/InventoryManagement"));
const RecipeManagement = lazy(() => import("./components/recipe/RecipeManagement"));
const OrderManagement = lazy(() => import("./components/order/OrderManagement"));
const CustomerManagement = lazy(() => import("./components/customer/CustomerManagement"));
const EventManagement = lazy(() => import("./components/event/EventManagement"));
const QualityManagement = lazy(() => import("./components/quality/QualityManagement"));

const StockMovementManagement = lazy(() => import("./components/stock/StockMovementManagement"));
const ProductManagement = lazy(() => import("./components/stock/ProductManagement"));
const CategoryManagement = lazy(() => import("./components/stock/CategoryManagement"));

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? children : <Navigate to="/" />;
};

const ManagerRoute = ({ children }) => {
  const { isAuthenticated, isManager } = useAuth();
  return isAuthenticated && isManager ? children : <Navigate to="/" />;
};

const Router = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/dashboard" />} />
            
            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="menu/*" element={<PrivateRoute><MenuManagement /></PrivateRoute>} />
            <Route path="inventory/*" element={<PrivateRoute><InventoryManagement /></PrivateRoute>} />
            <Route path="recipes/*" element={<PrivateRoute><RecipeManagement /></PrivateRoute>} />
            <Route path="orders/*" element={<PrivateRoute><OrderManagement /></PrivateRoute>} />
            <Route path="customers/*" element={<PrivateRoute><CustomerManagement /></PrivateRoute>} />
            <Route path="events/*" element={<PrivateRoute><EventManagement /></PrivateRoute>} />
            <Route path="quality/*" element={<PrivateRoute><QualityManagement /></PrivateRoute>} />
            
            {/* Stock Management Routes */}
            <Route path="stock">
              <Route path="movements/*" element={<PrivateRoute><StockMovementManagement /></PrivateRoute>} />
              <Route path="products/*" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
              <Route path="categories/*" element={<PrivateRoute><CategoryManagement /></PrivateRoute>} />
            </Route>

            {/* Expenditure Routes */}
            <Route path="expenditure/*" element={<PrivateRoute><Expenditure /></PrivateRoute>} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Router;
