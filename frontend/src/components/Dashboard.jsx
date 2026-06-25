import React from 'react';
import { formatINR } from '../utils/currency';
import { IconBox, IconUsers, IconReceipt, IconRevenue, IconBolt, IconAlert, IconCheck } from './Icons';
import RevenueChart from './RevenueChart';

export default function Dashboard({ stats, orders = [], onNavigate }) {
  const { 
    total_products = 0, 
    total_customers = 0, 
    total_orders = 0, 
    total_revenue = 0, 
    low_stock_products = [] 
  } = stats || {};

  return (
    <div>
      <section className="hero">
        <span className="hero-badge"><span className="pulse-dot" /> Live Overview</span>
        <h1 className="hero-title">Welcome back <span className="wave">👋</span></h1>
        <p className="hero-subtitle">
          Here's a real-time snapshot of your inventory, customers, and orders.
          Monitor stock health and draft new orders, all from one place.
        </p>
      </section>

      <div className="metrics-grid">
        <div className="metric-card accent-indigo">
          <div className="metric-top">
            <span className="metric-header">Total Products</span>
            <span className="metric-icon accent-indigo" style={{ color: '#f97316' }}><IconBox size={22} /></span>
          </div>
          <div className="metric-value">{total_products}</div>
        </div>
        <div className="metric-card accent-green">
          <div className="metric-top">
            <span className="metric-header">Total Customers</span>
            <span className="metric-icon accent-green" style={{ color: '#10b981' }}><IconUsers size={22} /></span>
          </div>
          <div className="metric-value">{total_customers}</div>
        </div>
        <div className="metric-card accent-cyan">
          <div className="metric-top">
            <span className="metric-header">Active Orders</span>
            <span className="metric-icon accent-cyan" style={{ color: '#06b6d4' }}><IconReceipt size={22} /></span>
          </div>
          <div className="metric-value">{total_orders}</div>
        </div>
        <div className="metric-card accent-amber">
          <div className="metric-top">
            <span className="metric-header">Accumulated Revenue</span>
            <span className="metric-icon accent-amber" style={{ color: '#f59e0b' }}><IconRevenue size={22} /></span>
          </div>
          <div className="metric-value">
            {formatINR(total_revenue)}
          </div>
        </div>
      </div>

      <div className="dashboard-sections single">
        <RevenueChart orders={orders} />

        <div className="card alerts-card">
          <div className="alerts-head">
            <span className="alerts-icon"><IconAlert size={20} /></span>
            <div>
              <h3 className="section-title danger">Low Stock Alerts</h3>
              <p className="alerts-sub">Products with less than 10 items remaining in stock.</p>
            </div>
            {low_stock_products.length > 0 && (
              <span className="alerts-count">{low_stock_products.length}</span>
            )}
          </div>

          <div className="alerts-list">
            {low_stock_products.length === 0 ? (
              <div className="alerts-healthy">
                <span className="alerts-healthy-icon"><IconCheck size={26} /></span>
                <strong>All inventory stock levels are healthy!</strong>
                <span className="alerts-healthy-sub">Nothing needs restocking right now.</span>
              </div>
            ) : (
              low_stock_products.map((product) => (
                <div key={product.id} className="alert-item">
                  <div>
                    <strong>{product.name}</strong>
                    <div className="alert-sku">SKU: {product.sku}</div>
                  </div>
                  <span className="alert-badge">{product.quantity} left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="section-title"><IconBolt size={19} /> Getting Started</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
          Three quick steps to get your workspace up and running.
        </p>
        <div className="onboarding-grid">
          {[
            {
              num: 1,
              title: 'Add your products',
              desc: 'Create your catalog with names, SKUs, prices and stock levels so inventory can be tracked.',
              view: 'products',
            },
            {
              num: 2,
              title: 'Register customers',
              desc: 'Build your customer ledger with names, emails and phone numbers to assign orders to.',
              view: 'customers',
            },
            {
              num: 3,
              title: 'Draft an order',
              desc: 'Combine products and a customer into an order. Stock and totals update automatically.',
              view: 'orders',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="step-card"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(step.view, { openCreateModal: true })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(step.view, { openCreateModal: true });
                }
              }}
            >
              <div className="step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
              <span className="step-cta">Get started →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
