import React, { useState, useEffect } from 'react';
import { UserButton, useAuth, useUser } from '@clerk/react';
import {
  Boxes,
  Barcode,
  Menu,
  Moon,
  Sun,
  TriangleAlert,
  Search,
  Plus,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  Zap,
  X,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Item, StockTransaction, StockAlert, TransactionType } from './types';
import {
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_ALERTS,
  MOVEMENT_CHART_DATA
} from './mockData';

interface DashboardProps {
  dark: boolean;
  onToggleTheme: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const Dashboard: React.FC<DashboardProps> = ({
  dark,
  onToggleTheme
}) => {
  const auth = useAuth();
  const { user: clerkUser } = useUser();

  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_TRANSACTIONS);
  const [alerts, setAlerts] = useState<StockAlert[]>(INITIAL_ALERTS);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{ displayName?: string; email?: string; role?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Scanner Form state
  const [scanCode, setScanCode] = useState<string>('');
  const [scanType, setScanType] = useState<'IN' | 'OUT'>('IN');
  const [scanQty, setScanQty] = useState<number>(1);
  const [scanNote, setScanNote] = useState<string>('');
  const [scanToast, setScanToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    sku: string;
    barcode: string;
    category: string;
    unit: string;
    quantity: number;
    lowStockThreshold: number;
    location: string;
  }>({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    unit: 'each',
    quantity: 10,
    lowStockThreshold: 5,
    location: 'Aisle 1, Bin A-01'
  });

  // Authenticated API helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers
        }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call error:', err);
      throw err;
    }
  };

  // Sync user profile & fetch database items
  const reloadData = async () => {
    try {
      // 1. Sync user profile
      try {
        const me = await apiCall('/me');
        if (me && me.email) {
          setUserProfile(me);
          setBackendConnected(true);
        }
      } catch (e) {
        console.warn('Could not sync user profile with backend:', e);
      }

      // 2. Load Items
      const fetchedItems = await apiCall('/items');
      if (Array.isArray(fetchedItems)) {
        setItems(fetchedItems.length > 0 ? fetchedItems : INITIAL_ITEMS);
        setBackendConnected(true);
      }

      // 3. Load Transactions
      try {
        const fetchedTxs = await apiCall('/transactions');
        if (Array.isArray(fetchedTxs) && fetchedTxs.length > 0) {
          const mappedTxs: StockTransaction[] = fetchedTxs.map((t: any) => ({
            id: t.id,
            itemId: t.item?.id || t.itemId,
            itemName: t.item?.name || t.itemName || 'Inventory Item',
            type: t.type,
            quantity: t.quantity,
            note: t.note,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
          }));
          setTransactions(mappedTxs);
        }
      } catch (e) {
        console.warn('Transactions endpoint note:', e);
      }

      // 4. Load Alerts
      try {
        const fetchedAlerts = await apiCall('/alerts');
        if (Array.isArray(fetchedAlerts)) {
          const mappedAlerts: StockAlert[] = fetchedAlerts.map((a: any) => ({
            id: a.id,
            itemId: a.item?.id || a.itemId,
            itemName: a.item?.name || 'Inventory Item',
            sku: a.item?.sku || '',
            message: a.message || 'Low stock threshold alert',
            currentQuantity: a.item?.quantity || 0,
            threshold: a.item?.lowStockThreshold || 0,
            status: a.status || 'OPEN',
            createdAt: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
          }));
          setAlerts(mappedAlerts);
        }
      } catch (e) {
        console.warn('Alerts endpoint note:', e);
      }
    } catch (err) {
      console.warn('Backend currently unreachable, using cache:', err);
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, [auth.isSignedIn]);

  // Derived calculations
  const lowStockItems = items.filter((i) => i.quantity <= i.lowStockThreshold);
  const outOfStockItems = items.filter((i) => i.quantity === 0);
  const totalUnitsInStock = items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Categories list
  const categories = [
    'All',
    ...Array.from(new Set(items.map((i) => i.category || 'General')))
  ];

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery));
    return matchesCat && matchesQuery;
  });

  // Handle Scan Submission
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanCode.trim();
    if (!query) return;

    const matchedItem = items.find(
      (i) =>
        i.sku.toLowerCase() === query.toLowerCase() ||
        i.barcode === query ||
        i.name.toLowerCase().includes(query.toLowerCase())
    );

    if (!matchedItem) {
      setScanToast({
        msg: `Item not found for barcode / SKU "${query}"`,
        type: 'error'
      });
      setTimeout(() => setScanToast(null), 4000);
      return;
    }

    const delta = scanType === 'IN' ? scanQty : -scanQty;

    // Check stock for OUT operations
    if (scanType === 'OUT' && matchedItem.quantity < scanQty) {
      setScanToast({
        msg: `Insufficient stock! Requested ${scanQty} ${matchedItem.unit}, but only ${matchedItem.quantity} are in stock.`,
        type: 'error'
      });
      setTimeout(() => setScanToast(null), 4000);
      return;
    }

    // Call API if item has a valid UUID (from backend)
    let apiSuccess = false;
    try {
      await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          itemId: matchedItem.id,
          type: scanType,
          quantity: scanQty,
          note: scanNote || `${scanType} recorded via scanner station`
        })
      });
      apiSuccess = true;
      reloadData();
    } catch (err) {
      console.warn('Backend tx logged locally in memory:', err);
    }

    // Update state locally
    if (!apiSuccess) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === matchedItem.id
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
      );

      const newTx: StockTransaction = {
        id: `tx-${Date.now()}`,
        itemId: matchedItem.id,
        itemName: matchedItem.name,
        type: scanType,
        quantity: scanQty,
        note: scanNote || `${scanType} recorded via console scanner`,
        createdAt: 'Just now'
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    setScanToast({
      msg: `Recorded ${scanType} ${scanQty} ${matchedItem.unit} for "${matchedItem.name}". New balance: ${Math.max(
        0,
        matchedItem.quantity + delta
      )}`,
      type: 'success'
    });
    setScanCode('');
    setScanNote('');
    setTimeout(() => setScanToast(null), 4000);
  };

  // Handle Create New Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      alert('Please provide at least Name and SKU');
      return;
    }

    try {
      const saved = await apiCall('/items', {
        method: 'POST',
        body: JSON.stringify({
          name: newItem.name.trim(),
          sku: newItem.sku.trim().toUpperCase(),
          barcode: newItem.barcode ? newItem.barcode.trim() : null,
          category: newItem.category.trim() || 'General',
          unit: newItem.unit.trim() || 'each',
          quantity: Number(newItem.quantity),
          lowStockThreshold: Number(newItem.lowStockThreshold)
        })
      });

      if (saved && saved.id) {
        setItems((prev) => [saved, ...prev]);
        setBackendConnected(true);
      } else {
        const localCreated: Item = {
          id: `item-${Date.now()}`,
          name: newItem.name,
          sku: newItem.sku.toUpperCase(),
          barcode: newItem.barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
          category: newItem.category,
          unit: newItem.unit || 'each',
          quantity: Number(newItem.quantity),
          lowStockThreshold: Number(newItem.lowStockThreshold),
          location: newItem.location || 'Bin A-01'
        };
        setItems((prev) => [localCreated, ...prev]);
      }
    } catch (e) {
      console.warn('Backend item create saved locally:', e);
      const localCreated: Item = {
        id: `item-${Date.now()}`,
        name: newItem.name,
        sku: newItem.sku.toUpperCase(),
        barcode: newItem.barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
        category: newItem.category,
        unit: newItem.unit || 'each',
        quantity: Number(newItem.quantity),
        lowStockThreshold: Number(newItem.lowStockThreshold),
        location: newItem.location || 'Bin A-01'
      };
      setItems((prev) => [localCreated, ...prev]);
    }

    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      sku: '',
      barcode: '',
      category: 'General',
      unit: 'each',
      quantity: 10,
      lowStockThreshold: 5,
      location: 'Aisle 1, Bin A-01'
    });
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      const token = await auth.getToken();
      const res = await fetch(`${API_BASE}/reports/items.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'warehouse-items.csv';
        a.click();
        return;
      }
    } catch (e) {
      console.warn('API CSV fallback to client generator', e);
    }

    // Client-side CSV generation fallback
    const header = ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'Quantity', 'Unit', 'Threshold'];
    const rows = items.map((i) => [
      i.id,
      `"${i.name}"`,
      i.sku,
      i.barcode || '',
      i.category || '',
      i.quantity,
      i.unit,
      i.lowStockThreshold
    ]);
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockroom-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Handle Acknowledge Alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiCall(`/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (e) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    }
  };

  return (
    <div className="dash-container">
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <Boxes size={22} className="brand-icon" />
            </div>
            <div className="brand-text">
              <strong>Stockroom</strong>
              <small>Warehouse Operations</small>
            </div>
          </div>

          <div className="sidebar-menu">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: Layers },
              { id: 'Inventory', label: 'Inventory Catalog', icon: Package },
              { id: 'Stock Movement', label: 'Barcode & Intake', icon: Barcode },
              { id: 'Alerts', label: 'Low Stock Alerts', icon: TriangleAlert, badge: lowStockItems.length },
              { id: 'Reports', label: 'Reports & Export', icon: FileSpreadsheet },
              { id: 'Access', label: 'System Access', icon: CheckCircle2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="sidebar-badge">{tab.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <div className="status-indicator-box">
              <span className={`dot-pulse ${backendConnected ? 'dot-green' : 'dot-amber'}`}></span>
              <span>{backendConnected ? 'REST Engine Live' : 'Connecting to REST API'}</span>
            </div>
            {clerkUser && (
              <div className="user-pill-sidebar">
                <small>Signed in as:</small>
                <strong>{clerkUser.primaryEmailAddress?.emailAddress || clerkUser.fullName || 'Operator'}</strong>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dash-main">
          {/* Top Bar */}
          <header className="dash-topbar">
            <div className="topbar-left">
              <button
                className="mobile-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <span className="topbar-sub">WAREHOUSE MANAGEMENT SYSTEM</span>
                <h1 className="topbar-title">{activeTab}</h1>
              </div>
            </div>

            <div className="topbar-actions">
              <button
                onClick={reloadData}
                className="tool-icon-btn"
                title="Sync with Backend"
                aria-label="Sync"
              >
                <RefreshCw size={17} />
              </button>

              <button
                onClick={onToggleTheme}
                className="tool-icon-btn"
                aria-label="Toggle Theme"
                title="Toggle Theme"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setActiveTab('Alerts')}
                className="tool-icon-btn alert-bell-btn"
                aria-label="Alerts"
                title={`${lowStockItems.length} active alerts`}
              >
                <TriangleAlert size={18} />
                {lowStockItems.length > 0 && (
                  <span className="bell-badge">{lowStockItems.length}</span>
                )}
              </button>

              <UserButton />
            </div>
          </header>

          {/* Attention Banner if Low Stock */}
          {lowStockItems.length > 0 && (
            <div className="stock-alert-banner">
              <AlertOctagon size={18} className="alert-icon" />
              <span>
                <strong>Attention Required:</strong> {lowStockItems.length} item
                {lowStockItems.length > 1 ? 's have' : ' has'} dropped below safety threshold.
              </span>
              <button
                onClick={() => setActiveTab('Alerts')}
                className="banner-action-btn"
              >
                Review Items →
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="dash-content-body">
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'Dashboard' && (
              <>
                {/* Metric Summary Cards */}
                <div className="metrics-row">
                  <div className="metric-box">
                    <div className="metric-header">
                      <span>Total Active Items</span>
                      <Package size={18} className="metric-icon" />
                    </div>
                    <div className="metric-value">{items.length}</div>
                    <div className="metric-sub">Cataloged warehouse SKUs</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-header">
                      <span>Units in Stock</span>
                      <Layers size={18} className="metric-icon" />
                    </div>
                    <div className="metric-value">{totalUnitsInStock}</div>
                    <div className="metric-sub">Across all storage zones</div>
                  </div>

                  <div className={`metric-box ${lowStockItems.length > 0 ? 'metric-warn' : ''}`}>
                    <div className="metric-header">
                      <span>Low Stock Items</span>
                      <TriangleAlert size={18} className="metric-icon" />
                    </div>
                    <div className="metric-value">{lowStockItems.length}</div>
                    <div className="metric-sub">Below safety threshold</div>
                  </div>

                  <div className={`metric-box ${outOfStockItems.length > 0 ? 'metric-danger' : ''}`}>
                    <div className="metric-header">
                      <span>Out of Stock</span>
                      <AlertOctagon size={18} className="metric-icon" />
                    </div>
                    <div className="metric-value">{outOfStockItems.length}</div>
                    <div className="metric-sub">Critical zero-balance</div>
                  </div>
                </div>

                {/* Split: Movement Chart & Quick Scanner */}
                <div className="dashboard-grid-split">
                  {/* Movement Chart */}
                  <div className="panel-box chart-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Inventory Movement Velocity</h3>
                        <small>Daily inbound vs outbound unit movement</small>
                      </div>
                      <button
                        onClick={() => setActiveTab('Stock Movement')}
                        className="btn btn-outline btn-sm"
                      >
                        Scanner Station →
                      </button>
                    </div>

                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={MOVEMENT_CHART_DATA}>
                          <defs>
                            <linearGradient id="inColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#18a987" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#18a987" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="#71837d" fontSize={12} />
                          <YAxis stroke="#71837d" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#102a25',
                              borderColor: '#1f4940',
                              color: '#fff',
                              borderRadius: '8px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="inbound"
                            stroke="#18a987"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#inColor)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="panel-box activity-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Recent Audit Activity</h3>
                        <small>Live inbound & outbound movements</small>
                      </div>
                      <span className="activity-live-tag">
                        <span className="dot-pulse dot-green"></span> LIVE
                      </span>
                    </div>

                    <div className="activity-list">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="activity-item">
                          <div
                            className={`activity-icon-badge ${
                              tx.type === 'IN' ? 'badge-in' : 'badge-out'
                            }`}
                          >
                            {tx.type === 'IN' ? (
                              <ArrowDownRight size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </div>
                          <div className="activity-details">
                            <div className="activity-title">
                              <strong>
                                {tx.type} {tx.quantity} units
                              </strong>
                              <span>{tx.itemName || 'Inventory SKU'}</span>
                            </div>
                            <div className="activity-meta">
                              <span>{tx.note || 'Recorded transaction'}</span>
                              <span className="activity-time">
                                <Clock size={12} /> {tx.createdAt || 'Recent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Catalog Preview */}
                <div className="panel-box">
                  <div className="panel-header">
                    <div>
                      <h3>Warehouse Inventory Snapshot</h3>
                      <small>Top items and their current floor availability</small>
                    </div>
                    <button
                      onClick={() => setActiveTab('Inventory')}
                      className="btn btn-primary btn-sm"
                    >
                      View All {items.length} Items
                    </button>
                  </div>
                  <InventoryTable items={items.slice(0, 5)} />
                </div>
              </>
            )}

            {/* 2. INVENTORY CATALOG TAB */}
            {activeTab === 'Inventory' && (
              <div className="panel-box">
                <div className="panel-header">
                  <div>
                    <h3>Inventory Management Catalog</h3>
                    <small>Showing {filteredItems.length} matching warehouse records</small>
                  </div>
                  <div className="panel-actions-group">
                    <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
                      <FileSpreadsheet size={15} /> Export CSV
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={16} /> Add New Item
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="table-filter-bar">
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search items by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="clear-btn">
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="cat-selector">
                    <span>Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <InventoryTable items={filteredItems} onQuickScan={(item) => {
                  setScanCode(item.sku);
                  setActiveTab('Stock Movement');
                }} />
              </div>
            )}

            {/* 3. STOCK MOVEMENT & BARCODE INTAKE TAB */}
            {activeTab === 'Stock Movement' && (
              <div className="scanner-station-grid">
                <div className="panel-box scanner-main-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Barcode Scanner & Intake Console</h3>
                      <small>Plug-and-play USB wedge & handheld barcode scanner ready</small>
                    </div>
                    <span className="scanner-mode-pill">
                      <Barcode size={16} /> SCANNER LISTENING
                    </span>
                  </div>

                  {scanToast && (
                    <div
                      className={`scanner-toast ${
                        scanToast.type === 'error' ? 'toast-error' : 'toast-success'
                      }`}
                    >
                      {scanToast.type === 'error' ? (
                        <AlertOctagon size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      <span>{scanToast.msg}</span>
                    </div>
                  )}

                  <form onSubmit={handleScanSubmit} className="scanner-form">
                    <div className="form-row-types">
                      <label>Operation Type:</label>
                      <div className="type-toggle-group">
                        <button
                          type="button"
                          onClick={() => setScanType('IN')}
                          className={`type-btn in ${scanType === 'IN' ? 'active' : ''}`}
                        >
                          <ArrowDownRight size={16} /> Stock IN (Receiving)
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanType('OUT')}
                          className={`type-btn out ${scanType === 'OUT' ? 'active' : ''}`}
                        >
                          <ArrowUpRight size={16} /> Stock OUT (Dispatch)
                        </button>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Barcode or SKU (Hardware Scanner Auto-Submits on Enter):</label>
                      <div className="scanner-input-container">
                        <Barcode size={22} className="barcode-ico" />
                        <input
                          type="text"
                          autoFocus
                          value={scanCode}
                          onChange={(e) => setScanCode(e.target.value)}
                          placeholder="Point scanner or type SKU (e.g. ELEC-SCN-200)..."
                          className="scanner-code-input"
                        />
                      </div>
                    </div>

                    <div className="form-row-split">
                      <div className="form-field">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={scanQty}
                          onChange={(e) => setScanQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="qty-input"
                        />
                      </div>

                      <div className="form-field flex-2">
                        <label>Reference / Note:</label>
                        <input
                          type="text"
                          value={scanNote}
                          onChange={(e) => setScanNote(e.target.value)}
                          placeholder="e.g. Inbound PO-88219 / Dispatch order #44"
                          className="note-input"
                        />
                      </div>
                    </div>

                    <div className="quick-sku-picker">
                      <span>Quick Select:</span>
                      {items.slice(0, 5).map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setScanCode(it.sku)}
                          className="quick-chip"
                        >
                          {it.sku}
                        </button>
                      ))}
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg submit-scan-btn">
                      <Zap size={18} />
                      <span>Record Stock {scanType} Transaction</span>
                    </button>
                  </form>
                </div>

                {/* Audit Movement Log */}
                <div className="panel-box scanner-history-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Session Movement Log</h3>
                      <small>Recorded in this session</small>
                    </div>
                  </div>

                  <div className="session-tx-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="session-tx-card">
                        <div className="tx-card-top">
                          <span
                            className={`tx-type-tag ${
                              tx.type === 'IN' ? 'in' : 'out'
                            }`}
                          >
                            {tx.type} {tx.quantity}
                          </span>
                          <span className="tx-time">{tx.createdAt || 'Today'}</span>
                        </div>
                        <div className="tx-card-name">{tx.itemName || 'Inventory Unit'}</div>
                        {tx.note && <div className="tx-card-note">{tx.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ALERTS TAB */}
            {activeTab === 'Alerts' && (
              <div className="panel-box">
                <div className="panel-header">
                  <div>
                    <h3>Safety Threshold Surveillance</h3>
                    <small>Items currently at or below minimum operating margins</small>
                  </div>
                  <span className="alert-count-pill">
                    {lowStockItems.length} Warnings Active
                  </span>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle2 size={48} className="text-emerald" />
                    <h3>Inventory Levels are Healthy</h3>
                    <p>All stock counts are currently above configured safety thresholds.</p>
                  </div>
                ) : (
                  <div className="alerts-grid">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="alert-detail-card">
                        <div className="alert-card-header">
                          <div className="alert-icon-box">
                            <TriangleAlert size={20} className="text-amber" />
                          </div>
                          <div>
                            <h4>{item.name}</h4>
                            <code className="sku-badge">{item.sku}</code>
                          </div>
                          <span
                            className={`status-pill ${
                              item.quantity === 0 ? 'status-out' : 'status-low'
                            }`}
                          >
                            {item.quantity === 0 ? 'Depleted' : 'Low Stock'}
                          </span>
                        </div>

                        <div className="alert-meta-box">
                          <div className="meta-stat">
                            <span>Current Stock:</span>
                            <strong className="text-amber">
                              {item.quantity} {item.unit}
                            </strong>
                          </div>
                          <div className="meta-stat">
                            <span>Safety Margin:</span>
                            <strong>
                              {item.lowStockThreshold} {item.unit}
                            </strong>
                          </div>
                          <div className="meta-stat">
                            <span>Storage Location:</span>
                            <span>{item.location || 'Aisle 1'}</span>
                          </div>
                        </div>

                        <div className="alert-action-row">
                          <button
                            onClick={() => {
                              setScanCode(item.sku);
                              setScanType('IN');
                              setScanQty(Math.max(item.lowStockThreshold * 2, 5));
                              setActiveTab('Stock Movement');
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Plus size={15} /> Quick Restock Intake
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. REPORTS TAB */}
            {activeTab === 'Reports' && (
              <div className="panel-box">
                <div className="panel-header">
                  <div>
                    <h3>Manifest & Audit Reports</h3>
                    <small>Download official inventory reports and spreadsheets</small>
                  </div>
                </div>

                <div className="reports-grid">
                  <div className="report-card">
                    <div className="report-icon-box">
                      <FileSpreadsheet size={28} />
                    </div>
                    <h4>CSV Inventory Spreadsheet</h4>
                    <p>
                      Export complete warehouse inventory with SKU, Barcode, Current
                      Quantities, and Safety Thresholds directly from PostgreSQL.
                    </p>
                    <button onClick={handleExportCSV} className="btn btn-primary">
                      <FileSpreadsheet size={16} /> Download CSV Manifest
                    </button>
                  </div>

                  <div className="report-card">
                    <div className="report-icon-box">
                      <FileText size={28} />
                    </div>
                    <h4>PDF Official Warehouse Manifest</h4>
                    <p>
                      Generated directly by the Spring Boot backend using iText/OpenPDF.
                      Official document for freight carriers and logistics audit sign-off.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const token = await auth.getToken();
                          const res = await fetch(`${API_BASE}/reports/items.pdf`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                          });
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'warehouse-manifest.pdf';
                            a.click();
                            return;
                          }
                        } catch (e) {
                          console.warn('PDF fetch error:', e);
                        }
                        alert('Could not download PDF manifest from backend. Please ensure backend server is running.');
                      }}
                      className="btn btn-outline"
                    >
                      <FileText size={16} /> Download PDF Manifest
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. ACCESS & SECURITY TAB */}
            {activeTab === 'Access' && (
              <div className="panel-box">
                <div className="panel-header">
                  <div>
                    <h3>System Access & Security</h3>
                    <small>Authentication provided by Clerk & Spring Security RBAC</small>
                  </div>
                </div>

                <div className="security-info-grid">
                  <div className="security-card">
                    <h4>Role Capabilities</h4>
                    <div className="role-item">
                      <span className="role-tag admin">ADMIN</span>
                      <p>
                        Full read/write permissions. Can add new SKUs, adjust thresholds,
                        acknowledge alerts, and export certified manifests.
                      </p>
                    </div>
                    <div className="role-item">
                      <span className="role-tag staff">STAFF</span>
                      <p>
                        Warehouse operations role. Can scan barcodes, execute stock intake, pick
                        outbound orders, and view live inventory.
                      </p>
                    </div>
                  </div>

                  <div className="security-card">
                    <h4>Current Session</h4>
                    <p>
                      Authenticated via Clerk enterprise session. All API requests carry cryptographically verified JWT tokens with signed RSA keys.
                    </p>
                    {userProfile && (
                      <div className="user-profile-details">
                        <div><strong>Account:</strong> {userProfile.email}</div>
                        <div><strong>Role:</strong> {userProfile.role || 'ADMIN'}</div>
                      </div>
                    )}
                    <div className="session-status-badge">
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>{backendConnected ? 'Connected & Verified' : 'Session Active'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Package size={20} /> Add New Warehouse Item
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="modal-form">
              <div className="modal-field">
                <label>Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Duty Pallet Wrap"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>SKU (Stock Keeping Unit) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PKG-WRP-HD"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Barcode Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8901234567899"
                    value={newItem.barcode}
                    onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Packaging, Hardware"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 3, Rack B-02"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="modal-field">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Safety Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.lowStockThreshold}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        lowStockThreshold: parseInt(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for Inventory Table
const InventoryTable: React.FC<{
  items: Item[];
  onQuickScan?: (item: Item) => void;
}> = ({ items, onQuickScan }) => {
  return (
    <div className="table-responsive">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item Name & Category</th>
            <th>SKU / Barcode</th>
            <th>Location</th>
            <th>Stock Level</th>
            <th>Safety Threshold</th>
            <th>Status</th>
            {onQuickScan && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLow = item.quantity <= item.lowStockThreshold;
            const isZero = item.quantity === 0;

            return (
              <tr key={item.id}>
                <td>
                  <div className="item-name">{item.name}</div>
                  <div className="item-cat">{item.category || 'General'}</div>
                </td>
                <td>
                  <code className="sku-badge">{item.sku}</code>
                  {item.barcode && <div className="barcode-sub">{item.barcode}</div>}
                </td>
                <td>
                  <span className="location-pill">{item.location || 'Bin A-01'}</span>
                </td>
                <td>
                  <div className="qty-cell">
                    <span className="qty-number">
                      {item.quantity} {item.unit}
                    </span>
                    <div className="qty-progress-bg">
                      <div
                        className={`qty-progress-fill ${
                          isZero ? 'fill-danger' : isLow ? 'fill-warning' : 'fill-good'
                        }`}
                        style={{
                          width: `${Math.min(100, (item.quantity / 50) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="threshold-label">
                    {item.lowStockThreshold} {item.unit}
                  </span>
                </td>
                <td>
                  {isZero ? (
                    <span className="status-pill status-out">Out of Stock</span>
                  ) : isLow ? (
                    <span className="status-pill status-low">Low Stock</span>
                  ) : (
                    <span className="status-pill status-healthy">Healthy</span>
                  )}
                </td>
                {onQuickScan && (
                  <td>
                    <button
                      onClick={() => onQuickScan(item)}
                      className="table-action-btn"
                      title="Quick Scan"
                    >
                      <Barcode size={15} /> Scan
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted">
                No items match your filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
