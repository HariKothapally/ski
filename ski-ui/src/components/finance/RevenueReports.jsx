import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS } from 'chart.js/auto';
import { Line, Doughnut } from 'react-chartjs-2';

const RevenueReports = () => {
  const [revenueData, setRevenueData] = useState({
    daily: [],
    monthly: [],
    categories: [],
    loading: true,
    error: null
  });

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    try {
      const [dailyRes, monthlyRes, categoriesRes] = await Promise.all([
        axios.get(`/api/finance/revenue/daily?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`/api/finance/revenue/monthly?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`/api/finance/revenue/categories?start=${dateRange.start}&end=${dateRange.end}`)
      ]);

      setRevenueData({
        daily: dailyRes.data,
        monthly: monthlyRes.data,
        categories: categoriesRes.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setRevenueData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch revenue data'
      }));
    }
  };

  const calculateTotalRevenue = () => {
    return revenueData.daily.reduce((sum, day) => sum + day.amount, 0);
  };

  const calculateAverageDaily = () => {
    return revenueData.daily.length > 0
      ? calculateTotalRevenue() / revenueData.daily.length
      : 0;
  };

  const calculateGrowthRate = () => {
    if (revenueData.monthly.length < 2) return 0;
    
    const currentMonth = revenueData.monthly[revenueData.monthly.length - 1].amount;
    const previousMonth = revenueData.monthly[revenueData.monthly.length - 2].amount;
    
    return ((currentMonth - previousMonth) / previousMonth) * 100;
  };

  if (revenueData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (revenueData.error) {
    return (
      <div className="alert alert-danger" role="alert">
        {revenueData.error}
      </div>
    );
  }

  const totalRevenue = calculateTotalRevenue();
  const averageDaily = calculateAverageDaily();
  const growthRate = calculateGrowthRate();

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Revenue Reports</h2>
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
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Revenue</h6>
              <h3 className="text-success mb-0">${totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Average Daily Revenue</h6>
              <h3 className="text-primary mb-0">${averageDaily.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Monthly Growth Rate</h6>
              <h3 className={`mb-0 ${growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                {growthRate.toFixed(1)}%
                <i className={`bi bi-arrow-${growthRate >= 0 ? 'up' : 'down'} ms-2`}></i>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Daily Revenue Trend</h5>
              <Line
                data={{
                  labels: revenueData.daily.map(day => day.date),
                  datasets: [{
                    label: 'Daily Revenue',
                    data: revenueData.daily.map(day => day.amount),
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
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Monthly Revenue Comparison</h5>
              <Line
                data={{
                  labels: revenueData.monthly.map(month => month.date),
                  datasets: [{
                    label: 'Monthly Revenue',
                    data: revenueData.monthly.map(month => month.amount),
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
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Revenue by Category</h5>
              <Doughnut
                data={{
                  labels: revenueData.categories.map(cat => cat.name),
                  datasets: [{
                    data: revenueData.categories.map(cat => cat.amount),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(255, 206, 86, 0.8)',
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(153, 102, 255, 0.8)'
                    ]
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Revenue by Category Breakdown</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Revenue</th>
                      <th>% of Total</th>
                      <th>Growth vs Last Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.categories.map(category => (
                      <tr key={category.name}>
                        <td>{category.name}</td>
                        <td>${category.amount.toFixed(2)}</td>
                        <td>
                          {((category.amount / totalRevenue) * 100).toFixed(1)}%
                        </td>
                        <td className={category.growth >= 0 ? 'text-success' : 'text-danger'}>
                          {category.growth.toFixed(1)}%
                          <i className={`bi bi-arrow-${category.growth >= 0 ? 'up' : 'down'} ms-2`}></i>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;
