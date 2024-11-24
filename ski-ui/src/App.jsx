// src/App.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from './components/NavbarComponent';
import { FaUtensils, FaReceipt, FaImages, FaBoxes, FaChartBar } from 'react-icons/fa';

const App = () => {
  const isLoggedIn = localStorage.getItem('authToken');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { role } = userInfo;

  const FeatureCard = ({ title, description, link, icon: Icon }) => (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm hover-shadow">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <Icon className="me-2 text-primary" size={24} />
            <h5 className="card-title mb-0">{title}</h5>
          </div>
          <p className="card-text">{description}</p>
          <Link to={link} className="btn btn-primary">
            Access {title}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <NavbarComponent />
      <div className="container-fluid py-4">
        <div className="container">
          {isLoggedIn ? (
            <>
              <h2 className="mb-4">Welcome to SKI Management System</h2>
              <div className="row">
                <FeatureCard
                  title="Meal Tracker"
                  description="Track and manage daily meals, ingredients, and dietary information."
                  link="/meal-tracker"
                  icon={FaUtensils}
                />
                <FeatureCard
                  title="Receipt Management"
                  description="Upload, categorize, and track all kitchen-related receipts and expenses."
                  link="/receipts"
                  icon={FaReceipt}
                />
                <FeatureCard
                  title="Image Gallery"
                  description="Centralized storage for food images, recipes, and kitchen documentation."
                  link="/images"
                  icon={FaImages}
                />
                <FeatureCard
                  title="Stock Movement"
                  description="Monitor and manage kitchen inventory and stock movements."
                  link="/stock"
                  icon={FaBoxes}
                />
                <FeatureCard
                  title="Expenditure"
                  description="Track and analyze kitchen expenses and budget allocation."
                  link="/expenditure"
                  icon={FaChartBar}
                />
                {(role === 'MANAGER' || role === 'ADMIN') && (
                  <FeatureCard
                    title="Reports & Analytics"
                    description="Access detailed reports and analytics for kitchen operations."
                    link="/reports"
                    icon={FaChartBar}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-5">
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
    </>
  );
};

export default App;
