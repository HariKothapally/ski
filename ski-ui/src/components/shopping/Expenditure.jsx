import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Purchases, Shopping, ShoppedByBill, ShoppingReview } from './index.jsx';
import NavbarComponent from '../NavbarComponent.jsx';

const Expenditure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && ['purchases', 'shopping', 'bills', 'review'].includes(path)) {
      setActiveTab(path);
    } else {
      navigate('/expenditure/purchases', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <NavbarComponent />
      <div className="container-fluid" style={{ marginTop: '80px' }}>
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h4 className="mb-3">Expenditure Management</h4>
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <NavLink 
                      to="/expenditure/purchases" 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Purchases
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink 
                      to="/expenditure/shopping" 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Shopping List
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink 
                      to="/expenditure/bills" 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Shopped Bills
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink 
                      to="/expenditure/review" 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Review
                    </NavLink>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <Routes>
                  <Route path="purchases" element={<Purchases />} />
                  <Route path="shopping" element={<Shopping />} />
                  <Route path="bills" element={<ShoppedByBill />} />
                  <Route path="review" element={<ShoppingReview />} />
                  <Route path="*" element={<Navigate to="purchases" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Expenditure;
