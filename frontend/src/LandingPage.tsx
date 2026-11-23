import React, { useState } from 'react';
import { SignInButton } from '@clerk/react';
import {
  Boxes,
  Zap,
  ArrowRight,
  Sparkles,
  Barcode,
  ShieldCheck,
  BellRing,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Search,
  Layers,
  Sun,
  Moon,
  Check,
  RefreshCw,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { INITIAL_ITEMS, MOVEMENT_CHART_DATA } from './mockData';
import { Item } from './types';

interface LandingPageProps {
  dark: boolean;
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  dark,
  onToggleTheme
}) => {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('ELEC-SCN-200');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [totalScansToday, setTotalScansToday] = useState<number>(48);

  const categories = ['All', 'Packaging', 'Hardware', 'Consumables', 'Safety'];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.lowStockThreshold).length;
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);

  const handleSimulateScan = (overrideCode?: string) => {
    const codeToScan = (overrideCode || barcodeInput).trim();
    if (!codeToScan) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const targetItem = items.find(
        (i) =>
          i.sku.toLowerCase() === codeToScan.toLowerCase() ||
          i.barcode === codeToScan ||
          i.name.toLowerCase().includes(codeToScan.toLowerCase())
      );

      if (targetItem) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === targetItem.id
              ? { ...it, quantity: it.quantity + 1 }
              : it
          )
        );
        setTotalScansToday((prev) => prev + 1);
        setScanFeedback(
          `✅ Ingested +1 unit of "${targetItem.name}" (Now: ${targetItem.quantity + 1} ${targetItem.unit})`
        );
      } else {
        setScanFeedback(`⚠️ SKU or Barcode "${codeToScan}" not recognized in warehouse catalog.`);
      }

      setTimeout(() => {
        setScanFeedback(null);
      }, 4500);
    }, 400);
  };

  return (
    <div className="landing-root">
      {/* Top Banner */}
      <div className="top-announcement">
        <span>
          <span className="pill-pulse"></span> Stockroom OS v2.4 — High-Velocity Barcode Ingest & Operations
        </span>
        <SignInButton mode="modal">
          <button className="top-portal-link">
            Access Portal <ArrowRight size={13} />
          </button>
        </SignInButton>
      </div>

      {/* Main Navbar */}
      <header className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon-wrapper">
              <Boxes size={22} className="brand-icon" />
            </div>
            <div className="brand-text-group">
              <span className="brand-title">Stockroom</span>
              <span className="brand-badge">ENTERPRISE</span>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#showcase">Operations Console</a>
            <a href="#features">Capabilities</a>
            <a href="#workflow">Operations Flow</a>
            <a href="#stats">Performance</a>
          </nav>

          <div className="nav-actions">
            <button
              onClick={onToggleTheme}
              className="theme-btn"
              aria-label="Toggle theme"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <SignInButton mode="modal">
              <button className="btn btn-primary">
                <span>Sign In</span>
                <ArrowRight size={15} />
              </button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-pill">
            <Sparkles size={14} className="hero-pill-icon" />
            <span>Next-Gen Warehouse Inventory & Operations</span>
          </div>

          <h1 className="hero-headline">
            Warehouse inventory, <br />
            <span className="gradient-text">engineered for precision & calm.</span>
          </h1>

          <p className="hero-description">
            Eliminate inventory discrepancies, blindspots, and stockouts. Experience lightning-fast
            barcode intake, automated threshold surveillance, and audit-ready reports in one
            uncluttered, resilient platform.
          </p>

          <div className="hero-cta-group">
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-lg">
                <Zap size={18} />
                <span>Access Warehouse Portal</span>
                <ArrowRight size={17} />
              </button>
            </SignInButton>

            <a href="#showcase" className="btn btn-secondary btn-lg">
              <Boxes size={18} />
              <span>View Operations Console</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <div className="trust-icon-box">
                <Zap size={16} />
              </div>
              <div>
                <strong>&lt; 150ms</strong>
                <small>Barcode Recognition</small>
              </div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-icon-box">
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong>100%</strong>
                <small>Audit Trail Log</small>
              </div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-icon-box">
                <BellRing size={16} />
              </div>
              <div>
                <strong>Proactive</strong>
                <small>Stockout Warnings</small>
              </div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-icon-box">
                <PackageCheck size={16} />
              </div>
              <div>
                <strong>Zero Setup</strong>
                <small>USB & Camera Scanners</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operations Console Showcase Section */}
      <section id="showcase" className="showcase-section">
        <div className="section-header">
          <div className="section-pill">Operations Console</div>
          <h2 className="section-title">High-precision warehouse floor control</h2>
          <p className="section-subtitle">
            Fast barcode intake, automated stock tracking, and live inventory surveillance.
          </p>
        </div>

        <div className="showcase-card">
          {/* Showcase Top Bar */}
          <div className="showcase-topbar">
            <div className="window-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="showcase-address-bar">
              <Boxes size={14} />
              <span>stockroom.internal/console/zone-a</span>
            </div>
            <div className="showcase-badge">
              <span className="badge-live-dot"></span> REAL-TIME ENGINE
            </div>
          </div>

          <div className="showcase-body">
            {/* KPI Stat Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-head">
                  <span>Total Active Items</span>
                  <Layers size={18} className="kpi-icon" />
                </div>
                <div className="kpi-value">{items.length}</div>
                <div className="kpi-meta text-emerald">8 bins currently assigned</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-head">
                  <span>In-Stock Units</span>
                  <PackageCheck size={18} className="kpi-icon" />
                </div>
                <div className="kpi-value">{totalUnits}</div>
                <div className="kpi-meta">Real-time aggregate total</div>
              </div>

              <div className={`kpi-card ${lowStockCount > 0 ? 'kpi-warn' : ''}`}>
                <div className="kpi-head">
                  <span>Low Stock Warnings</span>
                  <BellRing size={18} className="kpi-icon text-amber" />
                </div>
                <div className="kpi-value text-amber">{lowStockCount}</div>
                <div className="kpi-meta">Requires reorder attention</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-head">
                  <span>Today's Transactions</span>
                  <TrendingUp size={18} className="kpi-icon text-emerald" />
                </div>
                <div className="kpi-value">{totalScansToday}</div>
                <div className="kpi-meta text-emerald">+12% vs last shift</div>
              </div>
            </div>

            {/* Barcode Intake Terminal */}
            <div className="scan-simulator-box">
              <div className="scan-simulator-header">
                <div>
                  <h3>
                    <Barcode size={20} /> Barcode & SKU Ingest Terminal
                  </h3>
                  <p>
                    Scan or enter any SKU to process real-time inbound receiving and stock allocation.
                  </p>
                </div>
                <div className="sample-chips">
                  <span className="chips-label">Quick Tags:</span>
                  {['ELEC-SCN-200', 'PKG-TPE-6PK', 'PRN-LBL-500', 'PKG-BOX-LRG'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setBarcodeInput(chip);
                        handleSimulateScan(chip);
                      }}
                      className="sku-chip"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSimulateScan();
                }}
                className="scan-simulator-form"
              >
                <div className="scan-input-wrapper">
                  <Barcode className="scan-input-icon" size={20} />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter SKU or Scan Barcode..."
                    className="scan-input"
                  />
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput('')}
                      className="scan-clear"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isScanning}
                  className={`btn btn-primary ${isScanning ? 'btn-scanning' : ''}`}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Receive & Allocate (+1)</span>
                    </>
                  )}
                </button>
              </form>

              {scanFeedback && (
                <div className="scan-feedback-alert">
                  <span>{scanFeedback}</span>
                </div>
              )}
            </div>

            {/* Split View: Live Inventory Table & Stock Movement Trend */}
            <div className="showcase-split">
              {/* Inventory Table Container */}
              <div className="showcase-table-panel">
                <div className="table-controls">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Filter by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="category-pills">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th>SKU / Barcode</th>
                        <th>Location</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const isLow = item.quantity <= item.lowStockThreshold;
                        const isZero = item.quantity === 0;
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="item-name">{item.name}</div>
                              <div className="item-cat">{item.category || 'Standard'}</div>
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
                              {isZero ? (
                                <span className="status-pill status-out">Out of Stock</span>
                              ) : isLow ? (
                                <span className="status-pill status-low">Low ({item.lowStockThreshold})</span>
                              ) : (
                                <span className="status-pill status-healthy">Healthy</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movement Mini-Analytics */}
              <div className="showcase-chart-panel">
                <div className="chart-header">
                  <div>
                    <h4>Shift Movement Trend</h4>
                    <small>Inbound vs Outbound velocity</small>
                  </div>
                  <span className="chart-badge">+18.4% WoW</span>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={MOVEMENT_CHART_DATA}>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
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
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inbound"
                        stroke="#18a987"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInbound)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-footer-note">
                  <CheckCircle2 size={15} className="text-emerald" />
                  <span>Real-time sync to backend REST API & audit records</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities / Feature Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div className="section-pill">Core Capabilities</div>
          <h2 className="section-title">Built for high-velocity operations</h2>
          <p className="section-subtitle">
            Every feature is purpose-designed to eliminate manual errors and keep stock moving.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Barcode size={24} />
            </div>
            <h3>Lightning Barcode Engine</h3>
            <p>
              Full compatibility with 1D/2D symbologies (UPC, EAN, Code-128, QR). Support for USB
              wedge scanners and handheld mobile camera capture.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> Automatic Enter-key submission</li>
              <li><Check size={14} /> Rapid SKU & barcode cross-indexing</li>
              <li><Check size={14} /> Zero driver installation required</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <BellRing size={24} />
            </div>
            <h3>Intelligent Threshold Alerts</h3>
            <p>
              Configure safety stock thresholds per SKU. Get notified before items run dry so
              procurement and production lines never stall.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> Real-time visual badge counters</li>
              <li><Check size={14} /> Alert acknowledgment workflow</li>
              <li><Check size={14} /> Historical stockout forecasting</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <h3>Immutable Audit Trail</h3>
            <p>
              Every stock movement (IN, OUT, ADJUST) is immutably logged with quantity deltas,
              operator identities, timestamps, and order references.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> Trace every single discrepancy</li>
              <li><Check size={14} /> Cycle-count reconciliation</li>
              <li><Check size={14} /> Certified compliance history</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileSpreadsheet size={24} />
            </div>
            <h3>One-Click Export Reports</h3>
            <p>
              Instantly generate clean CSV spreadsheets for accounting or certified PDF manifests
              for freight carriers and floor supervisors.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> Instant CSV inventory dump</li>
              <li><Check size={14} /> Official PDF manifest generation</li>
              <li><Check size={14} /> Spring Boot backend powered</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Layers size={24} />
            </div>
            <h3>Multi-Bin Location Tracking</h3>
            <p>
              Organize your facility by Zone, Aisle, Rack, and Shelf. Direct pickers and put-away
              staff to the exact location every time.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> Fast bin relocation logging</li>
              <li><Check size={14} /> Category & department sorting</li>
              <li><Check size={14} /> Capacity utilization visibility</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Zap size={24} />
            </div>
            <h3>Clerk Enterprise Auth & RBAC</h3>
            <p>
              Protected by Clerk's multi-factor authentication with granular Role-Based Access
              Control distinguishing Floor Staff from Admins.
            </p>
            <ul className="feature-bullets">
              <li><Check size={14} /> JWT Bearer authenticated API</li>
              <li><Check size={14} /> Admin-only export and creation locks</li>
              <li><Check size={14} /> Instant user session management</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3-Step Operations Flow */}
      <section id="workflow" className="workflow-section">
        <div className="section-header">
          <div className="section-pill">Simplified Workflow</div>
          <h2 className="section-title">How Stockroom keeps your floor running smoothly</h2>
          <p className="section-subtitle">
            From arrival at the receiving dock to final outbound dispatch.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-num">01</div>
            <h4>Ingest & Scan</h4>
            <p>
              Scan goods on arrival at the dock. Barcodes automatically match SKUs and allocate
              units into appropriate storage bins.
            </p>
          </div>

          <div className="step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <h4>Surveil & Alert</h4>
            <p>
              Stock counts sync across all connected terminals. If items cross minimum safety
              thresholds, instant priority alerts are triggered.
            </p>
          </div>

          <div className="step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <h4>Pick, Pack & Export</h4>
            <p>
              Record outbound dispatches, review daily velocity charts, and generate certified PDF
              manifests with one click.
            </p>
          </div>
        </div>
      </section>

      {/* Performance Stats Banner */}
      <section id="stats" className="stats-banner-section">
        <div className="stats-card">
          <div className="stat-tile">
            <span className="stat-big">99.98%</span>
            <span className="stat-label">Ingest Accuracy</span>
          </div>
          <div className="stat-tile">
            <span className="stat-big">&lt; 150ms</span>
            <span className="stat-label">API Query Latency</span>
          </div>
          <div className="stat-tile">
            <span className="stat-big">10x</span>
            <span className="stat-label">Faster Discrepancy Audits</span>
          </div>
          <div className="stat-tile">
            <span className="stat-big">0</span>
            <span className="stat-label">Driver Installations</span>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="cta-banner-section">
        <div className="cta-banner-content">
          <Boxes size={44} className="cta-icon" />
          <h2>Ready to bring clarity to your inventory?</h2>
          <p>
            Join modern warehouse operations that trust Stockroom for fast, calm, and accurate
            inventory execution.
          </p>
          <div className="cta-actions">
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-lg">
                <Zap size={18} />
                <span>Access Warehouse Portal</span>
              </button>
            </SignInButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-brand-header">
              <Boxes size={22} className="footer-logo" />
              <span>Stockroom</span>
            </div>
            <p>Warehouse inventory management, made calm and resilient.</p>
            <div className="system-status-indicator">
              <span className="status-dot-green"></span>
              <span>All Systems Operational • v2.4 Enterprise</span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Operations</h5>
            <a href="#showcase">Barcode Ingest</a>
            <a href="#showcase">Live Inventory</a>
            <a href="#showcase">Movement Charts</a>
          </div>

          <div className="footer-col">
            <h5>Security & Access</h5>
            <span>Clerk Authenticated</span>
            <span>Role-Based Permissions</span>
            <span>Spring Security JWT</span>
            <span>PostgreSQL Flyway</span>
          </div>

          <div className="footer-col">
            <h5>Environment</h5>
            <span>Dark & Light Themes</span>
            <span>Desktop & Tablet Ready</span>
            <span>USB HID Scanner Wedge</span>
            <span>REST API v1</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Stockroom Systems. Built for high-throughput warehouse logistics.</p>
        </div>
      </footer>
    </div>
  );
};
