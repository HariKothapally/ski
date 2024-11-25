import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HRManager = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.role !== 'ADMIN') {
      navigate('/');
    }
  }, [navigate]);

  // Fetch users with their roles and employee info
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setShowModal(false);
    } catch (err) {
      setError('Failed to update user role');
      console.error('Error updating role:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">HR Management</h2>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Employee Code</th>
                  <th>Current Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.employee?.employeeCode}</td>
                    <td>
                      <span className={`badge bg-${user.role === 'ADMIN' ? 'danger' : user.role === 'MANAGER' ? 'warning' : 'primary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Role for {selectedUser.username}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => handleRoleChange(selectedUser.id, 'USER')}
                  >
                    Set as User
                  </button>
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => handleRoleChange(selectedUser.id, 'MANAGER')}
                  >
                    Set as Manager
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleRoleChange(selectedUser.id, 'ADMIN')}
                  >
                    Set as Admin
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
};

export default HRManager;
