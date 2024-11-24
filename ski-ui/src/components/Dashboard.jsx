import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    activeMenuItems: 0,
    lowStockItems: [],
    recentOrders: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const modules = [
    {
      title: 'Menu Management',
      icon: 'bi-menu-button-wide',
      path: '/menu',
      description: 'Manage menu items, categories, and pricing',
      color: 'primary'
    },
    {
      title: 'Inventory',
      icon: 'bi-box-seam',
      path: '/inventory',
      description: 'Track ingredients and supplies',
      color: 'success'
    },
    {
      title: 'Recipes',
      icon: 'bi-journal-text',
      path: '/recipes',
      description: 'Manage recipes and cooking instructions',
      color: 'info'
    },
    {
      title: 'Orders',
      icon: 'bi-cart',
      path: '/orders',
      description: 'Process and track customer orders',
      color: 'warning'
    },
  ];

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Kitchen Dashboard</h2>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Today's Orders</h6>
              <div className="d-flex align-items-center">
                <h3 className="mb-0">{stats.totalOrders}</h3>
                <i className="bi bi-clock ms-auto fs-4 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Pending Orders</h6>
              <div className="d-flex align-items-center">
                <h3 className="mb-0">{stats.pendingOrders}</h3>
                <i className="bi bi-hourglass-split ms-auto fs-4 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Active Menu Items</h6>
              <div className="d-flex align-items-center">
                <h3 className="mb-0">{stats.activeMenuItems}</h3>
                <i className="bi bi-menu-button ms-auto fs-4 text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Today's Revenue</h6>
              <div className="d-flex align-items-center">
                <h3 className="mb-0">${stats.todayRevenue.toFixed(2)}</h3>
                <i className="bi bi-currency-dollar ms-auto fs-4 text-info"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="row mb-4">
        {modules.map((module) => (
          <div key={module.path} className="col-md-3 mb-3">
            <Link to={module.path} className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center">
                  <i className={`bi ${module.icon} fs-1 text-${module.color} mb-3`}></i>
                  <h5 className="card-title">{module.title}</h5>
                  <p className="card-text text-muted small">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Alerts and Recent Activity */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Low Stock Alerts</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {stats.lowStockItems.map((item, index) => (
                  <div key={index} className="list-group-item d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    <div>
                      <h6 className="mb-0">{item.name}</h6>
                      <small className="text-muted">
                        {item.quantity} {item.unit} remaining
                      </small>
                    </div>
                    <span className="badge bg-warning ms-auto">Low Stock</span>
                  </div>
                ))}
                {stats.lowStockItems.length === 0 && (
                  <p className="text-muted mb-0">No low stock items</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Recent Orders</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {stats.recentOrders.map((order) => (
                  <div key={order._id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">Order #{order._id.slice(-6)}</h6>
                        <small className="text-muted">
                          Table {order.tableNumber} - {order.items.length} items
                        </small>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className={`badge bg-${order.status === 'pending' ? 'warning' : 'success'} me-2`}>
                          {order.status.toUpperCase()}
                        </span>
                        <Link to={`/orders/${order._id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.recentOrders.length === 0 && (
                  <p className="text-muted mb-0">No recent orders</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
