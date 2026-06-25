import React, { useState, useEffect } from 'react';
import { api } from './api';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import { IconDashboard, IconBox, IconUsers, IconReceipt, IconRefresh, IconLogo, IconSun, IconMoon } from './components/Icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabProps, setTabProps] = useState({});

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Apply + persist the colour theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const refreshAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, productsData, customersData, ordersData] = await Promise.all([
        api.getStats(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders()
      ]);
      setStats(statsData);
      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to the backend server. Make sure the API service is running.');
    } finally {
      setLoading(false);
    }
  };

  // Initial page load: show the branded splash for a minimum of 3 seconds,
  // while data loads in the background.
  useEffect(() => {
    Promise.all([
      refreshAllData(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]).then(() => setBooting(false));
  }, []);

  // Manual refresh (header button) shows the full animated reload page,
  // held for a minimum duration so the animation is always visible.
  const handleManualRefresh = async () => {
    setReloading(true);
    await Promise.all([
      refreshAllData(),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    setReloading(false);
  };

  const handleNavigate = (tab, props = {}) => {
    setTabProps(props);
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    if (reloading || (loading && !stats)) {
      return (
        <div className="loading-screen">
          <div className="loader-ring" />
          <h2>{reloading ? 'Refreshing your workspace' : 'Syncing your workspace'}</h2>
          <p>Fetching the latest products, customers and the transaction ledger…</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} orders={orders} onNavigate={handleNavigate} />;
      case 'products':
        return (
          <Products 
            products={products} 
            onRefresh={refreshAllData} 
            initialOpenCreate={!!tabProps.openCreateModal}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers} 
            onRefresh={refreshAllData} 
            initialOpenCreate={!!tabProps.openCreateModal}
          />
        );
      case 'orders':
        return (
          <Orders 
            orders={orders} 
            products={products}
            customers={customers}
            onRefresh={refreshAllData} 
            initialOpenCreate={!!tabProps.openCreateModal}
          />
        );
      default:
        return <Dashboard stats={stats} orders={orders} onNavigate={handleNavigate} />;
    }
  };

  if (booting) {
    return (
      <div className="splash-screen">
        <div className="app-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
          <span className="orb orb-4" />
        </div>
        <div className="splash-inner">
          <div className="splash-logo"><IconLogo size={46} /></div>
          <div className="splash-name">Management Hub</div>
          <div className="splash-bar"><span /></div>
          <p className="splash-sub">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <span className="orb orb-4" />
      </div>

      <header className="app-header">
        <div
          className="brand-section"
          role="button"
          tabIndex={0}
          title="Reload"
          onClick={() => window.location.reload()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.reload(); } }}
        >
          <span className="brand-logo"><IconLogo size={22} /></span>
          <span className="brand-name">Management Hub</span>
        </div>
        <nav className="navigation-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            <IconDashboard size={17} /> Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleNavigate('products')}
          >
            <IconBox size={17} /> Products
          </button>
          <button
            className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => handleNavigate('customers')}
          >
            <IconUsers size={17} /> Customers
          </button>
          <button
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavigate('orders')}
          >
            <IconReceipt size={17} /> Orders
          </button>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
          <button className="btn btn-secondary btn-icon-svg" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={handleManualRefresh} disabled={loading || reloading}>
            <IconRefresh size={15} className={(loading || reloading) ? 'spin' : ''} />
            {reloading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <strong>Connection Error:</strong> {error}
          </div>
        )}
        
        {renderTabContent()}
      </main>

      <footer className="app-footer">
        <span className="footer-brand">
          <span className="footer-dot" /> Management Hub
        </span>
        <span>Inventory &amp; Order Management System · {new Date().getFullYear()}</span>
        <span>Built with React, FastAPI &amp; PostgreSQL</span>
      </footer>
    </div>
  );
}
