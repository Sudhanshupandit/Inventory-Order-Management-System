import React, { useState } from 'react';
import { api } from '../api';
import { formatINR } from '../utils/currency';
import { IconAlert } from './Icons';
import { useConfirm } from './ConfirmDialog';

export default function Products({ products, onRefresh, initialOpenCreate = false }) {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(initialOpenCreate);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: ''
  });

  const handleOpenCreate = () => {
    setError('');
    setSuccess('');
    setFormData({ name: '', sku: '', price: '', quantity: '' });
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setError('');
    setSuccess('');
    setEditingProduct(product);
    setFormData({
      name: product.name ?? '',
      sku: product.sku ?? '',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? '')
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceStr = formData.price.trim();
    const quantityStr = formData.quantity.trim();

    if (!formData.name.trim()) return setError('Product name is required.');
    if (!formData.sku.trim()) return setError('Product SKU is required.');
    if (!/^\d+(\.\d+)?$/.test(priceStr) || parseFloat(priceStr) <= 0) {
      return setError('Price must be a number (not letters) greater than 0.');
    }
    if (!/^\d+$/.test(quantityStr)) {
      return setError('Stock quantity must be a whole number (not letters), 0 or more.');
    }

    const price = parseFloat(priceStr);
    const quantity = parseInt(quantityStr, 10);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          sku: formData.sku,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity)
        });
        setSuccess('Product updated successfully!');
      } else {
        await api.createProduct({
          name: formData.name,
          sku: formData.sku,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity)
        });
        setSuccess('Product added successfully!');
      }
      onRefresh();
      setTimeout(handleCloseModal, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({
      title: 'Delete product?',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    }))) return;
    setError('');
    setSuccess('');
    try {
      await api.deleteProduct(id);
      setSuccess('Product deleted successfully.');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  const priceInvalid = formData.price !== '' &&
    !(/^\d+(\.\d+)?$/.test(formData.price.trim()) && parseFloat(formData.price) > 0);
  const quantityInvalid = formData.quantity !== '' &&
    !/^\d+$/.test(formData.quantity.trim());

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Inventory</h1>
          <p className="page-subtitle">Add, modify, and monitor stock levels and prices.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          Add New Product
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
              placeholder="Search by Name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">No products found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Price (INR)</th>
                  <th>Stock Quantity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td><code>{product.sku}</code></td>
                    <td>{formatINR(product.price)}</td>
                    <td>
                      <span className={`badge ${product.quantity < 10 ? 'badge-danger' : 'badge-success'}`}>
                        {product.quantity} items
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(product)}>
                        Edit
                      </button>
                      <button className="btn-icon" style={{ color: '#dc3545', marginLeft: '5px' }} onClick={() => handleDelete(product.id)}>
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
            <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Wireless Mouse" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MSE-01" 
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (INR)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-input ${priceInvalid ? 'invalid' : ''}`}
                  placeholder="e.g. 499.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                {priceInvalid && (
                  <div className="field-error">
                    <IconAlert size={14} /> Enter a number (not letters) greater than 0.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${quantityInvalid ? 'invalid' : ''}`}
                  placeholder="e.g. 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                {quantityInvalid && (
                  <div className="field-error">
                    <IconAlert size={14} /> Enter a whole number (not letters), 0 or more.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
