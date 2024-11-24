import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar, Line } from 'react-chartjs-2';

const BudgetTracking = () => {
  const [budgetData, setBudgetData] = useState({
    expenses: [],
    income: [],
    budgets: [],
    loading: true,
    error: null
  });

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchBudgetData();
  }, [selectedPeriod, selectedYear, selectedMonth]);

  const fetchBudgetData = async () => {
    try {
      const [expensesRes, incomeRes, budgetsRes] = await Promise.all([
        axios.get(`/api/finance/expenses?period=${selectedPeriod}&year=${selectedYear}&month=${selectedMonth}`),
        axios.get(`/api/finance/income?period=${selectedPeriod}&year=${selectedYear}&month=${selectedMonth}`),
        axios.get(`/api/finance/budgets?period=${selectedPeriod}&year=${selectedYear}&month=${selectedMonth}`)
      ]);

      setBudgetData({
        expenses: expensesRes.data,
        income: incomeRes.data,
        budgets: budgetsRes.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setBudgetData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch budget data'
      }));
    }
  };

  const calculateTotals = () => {
    const totalExpenses = budgetData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = budgetData.income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalBudget = budgetData.budgets.reduce((sum, budget) => sum + budget.amount, 0);
    
    return {
      expenses: totalExpenses,
      income: totalIncome,
      budget: totalBudget,
      balance: totalIncome - totalExpenses
    };
  };

  const getChartData = () => {
    const categories = [...new Set(budgetData.expenses.map(exp => exp.category))];
    
    return {
      labels: categories,
      datasets: [
        {
          label: 'Actual Expenses',
          data: categories.map(cat => 
            budgetData.expenses
              .filter(exp => exp.category === cat)
              .reduce((sum, exp) => sum + exp.amount, 0)
          ),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'Budgeted Amount',
          data: categories.map(cat =>
            budgetData.budgets
              .filter(budget => budget.category === cat)
              .reduce((sum, budget) => sum + budget.amount, 0)
          ),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1
        }
      ]
    };
  };

  const totals = calculateTotals();

  if (budgetData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (budgetData.error) {
    return (
      <div className="alert alert-danger" role="alert">
        {budgetData.error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Budget Tracking</h2>
            <div className="d-flex gap-2">
              <select 
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {selectedPeriod === 'monthly' && (
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Income</h6>
              <h3 className="text-success mb-0">${totals.income.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Expenses</h6>
              <h3 className="text-danger mb-0">${totals.expenses.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Budget</h6>
              <h3 className="text-primary mb-0">${totals.budget.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Balance</h6>
              <h3 className={`mb-0 ${totals.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                ${Math.abs(totals.balance).toFixed(2)}
                {totals.balance < 0 && ' (Deficit)'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Budget vs Actual Expenses</h5>
              <Bar data={getChartData()} options={{ responsive: true }} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Expense Breakdown</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Budget</th>
                      <th>Actual</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.budgets.map(budget => {
                      const actualExpense = budgetData.expenses
                        .filter(exp => exp.category === budget.category)
                        .reduce((sum, exp) => sum + exp.amount, 0);
                      const variance = budget.amount - actualExpense;
                      
                      return (
                        <tr key={budget.category}>
                          <td>{budget.category}</td>
                          <td>${budget.amount.toFixed(2)}</td>
                          <td>${actualExpense.toFixed(2)}</td>
                          <td className={variance >= 0 ? 'text-success' : 'text-danger'}>
                            ${Math.abs(variance).toFixed(2)}
                            {variance < 0 ? ' (Over)' : ' (Under)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Income Trends</h5>
              <Line
                data={{
                  labels: budgetData.income.map(inc => inc.date),
                  datasets: [{
                    label: 'Income',
                    data: budgetData.income.map(inc => inc.amount),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracking;
