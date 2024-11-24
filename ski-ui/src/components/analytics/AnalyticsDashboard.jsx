import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    sales: [],
    inventory: [],
    customers: [],
    orders: [],
    loading: true,
    error: null
  });

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      const [salesRes, inventoryRes, customersRes, ordersRes] = await Promise.all([
        axios.get(`/api/analytics/sales?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`/api/analytics/inventory?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`/api/analytics/customers?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`/api/analytics/orders?start=${dateRange.start}&end=${dateRange.end}`)
      ]);

      setAnalyticsData({
        sales: salesRes.data,
        inventory: inventoryRes.data,
        customers: customersRes.data,
        orders: ordersRes.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch analytics data'
      }));
    }
  };

  const calculateKPIs = () => {
    const totalSales = analyticsData.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalOrders = analyticsData.orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = analyticsData.customers.length;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalCustomers
    };
  };

  if (analyticsData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (analyticsData.error) {
    return (
      <div className="alert alert-danger" role="alert">
        {analyticsData.error}
      </div>
    );
  }

  const kpis = calculateKPIs();

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Analytics Dashboard</h2>
        <div className="d-flex gap-2">
          <input
            type="date"
            className="form-control"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <input
            type="date"
            className="form-control"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Sales</h6>
              <h3 className="text-primary mb-0">${kpis.totalSales.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Orders</h6>
              <h3 className="text-success mb-0">{kpis.totalOrders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Average Order Value</h6>
              <h3 className="text-info mb-0">${kpis.averageOrderValue.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Customers</h6>
              <h3 className="text-warning mb-0">{kpis.totalCustomers}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Sales Trend</h5>
              <Line
                data={{
                  labels: analyticsData.sales.map(sale => sale.date),
                  datasets: [{
                    label: 'Daily Sales',
                    data: analyticsData.sales.map(sale => sale.amount),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.1)'
                  }]
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: value => `$${value}`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Order Status Distribution</h5>
              <Doughnut
                data={{
                  labels: ['Completed', 'In Progress', 'Cancelled'],
                  datasets: [{
                    data: [
                      analyticsData.orders.filter(order => order.status === 'completed').length,
                      analyticsData.orders.filter(order => order.status === 'in_progress').length,
                      analyticsData.orders.filter(order => order.status === 'cancelled').length
                    ],
                    backgroundColor: [
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(255, 99, 132, 0.8)'
                    ]
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Inventory Status</h5>
              <Bar
                data={{
                  labels: analyticsData.inventory.map(item => item.name),
                  datasets: [{
                    label: 'Current Stock',
                    data: analyticsData.inventory.map(item => item.quantity),
                    backgroundColor: analyticsData.inventory.map(item => 
                      item.quantity <= item.minQuantity ? 'rgba(255, 99, 132, 0.8)' :
                      item.quantity <= item.minQuantity * 2 ? 'rgba(255, 205, 86, 0.8)' :
                      'rgba(75, 192, 192, 0.8)'
                    )
                  }]
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Customer Growth</h5>
              <Line
                data={{
                  labels: analyticsData.customers.map(data => data.date),
                  datasets: [{
                    label: 'New Customers',
                    data: analyticsData.customers.map(data => data.count),
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    tension: 0.1,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
