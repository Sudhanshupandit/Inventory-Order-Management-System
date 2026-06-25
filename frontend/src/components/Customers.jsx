import React, { useState } from 'react';
import { api } from '../api';
import { IconAlert } from './Icons';
import { useConfirm } from './ConfirmDialog';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Customers({ customers, onRefresh, initialOpenCreate = false }) {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(initialOpenCreate);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleOpenCreate = () => {
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) return setError('Customer name is required.');
    if (!EMAIL_REGEX.test(formData.email)) return setError('Please enter a valid email address.');

    try {
      await api.createCustomer({
        name: formData.name,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null
      });
      setSuccess('Customer registered successfully!');
      onRefresh();
      setTimeout(handleCloseModal, 1000);
    } catch (err) {
      setError(err.message || 'Failed to register customer.');
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({
      title: 'Delete customer?',
      message: 'Are you sure you want to delete this customer? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    }))) return;
    setError('');
    setSuccess('');
    try {
      await api.deleteCustomer(id);
      setSuccess('Customer deleted successfully.');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to delete customer.');
    }
  };

  const emailInvalid = formData.email.length > 0 && !EMAIL_REGEX.test(formData.email);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers Ledger</h1>
          <p className="page-subtitle">Add new clients, view details, and monitor registered email directories.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          Register Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="action-bar">
          <div className="search-container">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Name or Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">No customers found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Join Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{customer.name}</strong></td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || <span>-</span>}</td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" style={{ color: '#dc3545' }} onClick={() => handleDelete(customer.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close">×</button>
            <h2 className="modal-title">Register Customer</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className={`form-input ${emailInvalid ? 'invalid' : ''}`}
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {emailInvalid && (
                  <div className="field-error"><IconAlert size={14} /> Please enter a valid email address.</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="e.g. 555-0199" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
