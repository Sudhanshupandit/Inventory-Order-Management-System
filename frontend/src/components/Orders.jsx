import React, { useState } from 'react';
import { api } from '../api';
import { formatINR } from '../utils/currency';
import Select from './Select';
import { useConfirm } from './ConfirmDialog';

export default function Orders({ orders, products, customers, onRefresh, initialOpenCreate = false }) {
  const confirm = useConfirm();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreate);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const handleOpenCreate = () => {
    setError('');
    setSuccess('');
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false);
  };

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const calculateLiveTotal = () => {
    return orderItems.reduce((acc, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product) {
        return acc + (parseFloat(product.price) * (parseInt(item.quantity) || 0));
      }
      return acc;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCustomerId) return setError('Please select a customer.');
    if (orderItems.length === 0) return setError('Order must contain at least one item.');
    
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        return setError(`Please select a product for line ${i + 1}.`);
      }
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return setError(`Quantity must be greater than 0 for line ${i + 1}.`);
      }

      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product && product.quantity < quantity) {
        return setError(`Insufficient inventory for '${product.name}' on line ${i + 1}. Available: ${product.quantity}, Requested: ${quantity}.`);
      }
    }

    const itemsPayload = orderItems.map(item => ({
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity)
    }));

    try {
      await api.createOrder({
        customer_id: parseInt(selectedCustomerId),
        items: itemsPayload
      });
      setSuccess('Order placed successfully! Inventory updated.');
      onRefresh();
      setTimeout(handleCloseCreate, 1000);
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!(await confirm({
      title: 'Cancel this order?',
      message: 'This will delete the order and restore product inventory levels. This action cannot be undone.',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      danger: true,
    }))) return;
    setError('');
    setSuccess('');
    try {
      await api.deleteOrder(id);
      setSuccess('Order cancelled successfully. Inventory restored.');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    }
  };

  const handleOpenDetails = async (orderId) => {
    try {
      const details = await api.getOrder(orderId);
      setSelectedOrderDetails(details);
    } catch (err) {
      setError('Failed to fetch order details.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders History</h1>
          <p className="page-subtitle">Track orders, inspect item details, and draft client purchases.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          Draft New Order
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="table-container">
          {orders.length === 0 ? (
            <div className="empty-state">No orders recorded yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                  <th>Purchase Date</th>
                  <th>Total Price (INR)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#ORD-{String(order.id).padStart(5, '0')}</strong></td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_email}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-success">
                        {formatINR(order.total_amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }} onClick={() => handleOpenDetails(order.id)}>
                        View Details
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleDeleteOrder(order.id)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={handleCloseCreate} aria-label="Close">×</button>
            <h2 className="modal-title">Draft New Order</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Select Customer</label>
                <Select
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="-- Select a customer --"
                  options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }))}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Order Items</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={handleAddItemRow}>
                    + Add Item Row
                  </button>
                </div>

                <div className="order-items-builder">
                  {orderItems.map((item, index) => {
                    const selectedProd = products.find(p => p.id === parseInt(item.product_id));
                    const maxStock = selectedProd ? selectedProd.quantity : 0;
                    
                    return (
                      <div key={index} className="item-row">
                        <Select
                          value={item.product_id}
                          onChange={(val) => handleItemChange(index, 'product_id', val)}
                          placeholder="-- Choose product --"
                          options={products.map(p => ({
                            value: p.id,
                            label: `${p.name} (SKU: ${p.sku}) · Stock: ${p.quantity}`,
                            disabled: p.quantity === 0
                          }))}
                        />

                        <input
                          type="number"
                          min="1"
                          max={maxStock || undefined}
                          className="form-input"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                        />

                        <button 
                          type="button" 
                          className="btn-danger btn" 
                          onClick={() => handleRemoveItemRow(index)}
                          disabled={orderItems.length === 1}
                          style={{ padding: '6px 12px' }}
                        >
                          Delete Row
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="order-summary-box">
                <span>Calculated Grand Total:</span>
                <span>
                  {formatINR(calculateLiveTotal())}
                </span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCreate}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={products.length === 0 || customers.length === 0}>
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrderDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <button className="modal-close" onClick={() => setSelectedOrderDetails(null)} aria-label="Close">×</button>
            <h2 className="modal-title">
              Order #ORD-{String(selectedOrderDetails.id).padStart(5, '0')} Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '14px' }}>
              <div>
                <strong>Client Info</strong>
                <div>{selectedOrderDetails.customer_name}</div>
                <div style={{ color: '#6c757d' }}>{selectedOrderDetails.customer_email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Order Date</strong>
                <div>{new Date(selectedOrderDetails.created_at).toLocaleString()}</div>
              </div>
            </div>

            <h3>Items Break Down</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderDetails.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product_name}</strong>
                        <div style={{ fontSize: '11px', color: '#6c757d' }}>SKU: {item.product_sku}</div>
                      </td>
                      <td>{formatINR(item.unit_price)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatINR(parseFloat(item.unit_price) * item.quantity)}</strong>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>Order Total:</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#28a745', fontSize: '16px' }}>
                        {formatINR(selectedOrderDetails.total_amount)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedOrderDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
