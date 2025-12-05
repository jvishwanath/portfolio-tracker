import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Badge, Modal, Card, Row, Col } from 'react-bootstrap';
import TransactionModal from './components/TransactionModal';
import HoldingsTable from './components/HoldingsTable';
import StockChart from './components/StockChart';
import ChatWidget from './components/ChatWidget';
import Watchlist from './components/Watchlist';
import MarketIndices from './components/MarketIndices';
import Login from './components/Login';
import PaperTradingWelcome from './components/PaperTradingWelcome';
import CashManagementModal from './components/CashManagementModal';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const { user, logout } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Idle Timeout Ref
  const lastActivity = useRef(Date.now());

  // Paper Trading State
  const [paperTradingEnabled, setPaperTradingEnabled] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [showPaperTradingWelcome, setShowPaperTradingWelcome] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [profitLoss, setProfitLoss] = useState(0);
  const [profitLossPct, setProfitLossPct] = useState(0);
  const [totalAccountValue, setTotalAccountValue] = useState(0);


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Track User Activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Auto-logout check
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity.current > 1200000) { // 20 minutes
        console.log("User idle for 20+ minutes. Logging out.");
        logout();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkIdle);
  }, [logout]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/api/portfolio/summary');
      setHoldings(response.data.holdings);
      setPortfolioValue(response.data.total_value);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching portfolio", error);
    }
  };

  const fetchPaperTradingStatus = async () => {
    try {
      const response = await axios.get('/api/paper-trading/status');
      setPaperTradingEnabled(response.data.enabled);
      setCashBalance(response.data.cash_balance);

      // Show welcome modal if paper trading not enabled and user just logged in
      if (!response.data.enabled && !localStorage.getItem('paperTradingPromptShown')) {
        setShowPaperTradingWelcome(true);
        localStorage.setItem('paperTradingPromptShown', 'true');
      }
    } catch (error) {
      console.error("Error fetching paper trading status", error);
    }
  };

  const fetchProfitLoss = async () => {
    try {
      const response = await axios.get('/api/paper-trading/profit-loss');
      setProfitLoss(response.data.profit_loss);
      setProfitLossPct(response.data.profit_loss_percentage);
      setTotalAccountValue(response.data.total_account_value);
    } catch (error) {
      console.error("Error fetching profit/loss", error);
    }
  };

  const enablePaperTrading = async (initialDeposit) => {
    try {
      await axios.post('/api/paper-trading/enable', null, {
        params: { initial_deposit: initialDeposit }
      });
      await fetchPaperTradingStatus();
      await fetchProfitLoss();
      setShowPaperTradingWelcome(false);
    } catch (error) {
      console.error("Error enabling paper trading", error);
      const errorMsg = error.response?.data?.detail || "Failed to enable paper trading";

      // If already enabled, just close the modal and refresh
      if (errorMsg.includes("already enabled")) {
        await fetchPaperTradingStatus();
        await fetchProfitLoss();
        setShowPaperTradingWelcome(false);
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleCashTransaction = async () => {
    await fetchPaperTradingStatus();
    await fetchProfitLoss();
  };

  useEffect(() => {
    fetchPortfolio();
    fetchPaperTradingStatus();

    // Auto-refresh every 2 minutes (120000 ms)
    const interval = setInterval(() => {
      // Check for inactivity (10 minutes = 600,000 ms)
      if (Date.now() - lastActivity.current < 600000) {
        fetchPortfolio();
        if (paperTradingEnabled) {
          fetchProfitLoss();
        }
      } else {
        console.log("Idle: Skipping auto-refresh");
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [paperTradingEnabled]);

  const handleTransactionAdded = () => {
    fetchPortfolio();
    if (paperTradingEnabled) {
      fetchPaperTradingStatus();
      fetchProfitLoss();
    }
    setShowModal(false);
  };

  const handleSelectStock = (ticker) => {
    setSelectedTicker(ticker);
    setShowWatchlist(false); // Close watchlist modal when a stock is selected
  };

  const handleBuy = (ticker, currentPrice) => {
    setModalDefaults({
      ticker,
      type: 'buy',
      price: currentPrice.toFixed(2)
    });
    setShowModal(true);
  };

  const handleSell = (ticker, currentPrice) => {
    setModalDefaults({
      ticker,
      type: 'sell',
      price: currentPrice.toFixed(2)
    });
    setShowModal(true);
  };

  return (
    <div>
      {/* Navigation */}
      <Navbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme === 'dark' ? 'dark' : 'light'} expand={false} className="mb-4">
        <Container className="position-relative">
          <Navbar.Brand href="#home" className="d-flex align-items-center">
            <img
              src="/logo.png"
              alt="NVest AI Logo"
              style={{ height: '32px', marginRight: '10px' }}
            />
            <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>NVest AI</span>
          </Navbar.Brand>

          {/* Action buttons - always visible */}
          <div className="d-flex align-items-center">
            <Button
              variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
              className="me-2 theme-toggle"
              size="sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'}`}></i>
            </Button>
            <Button
              variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
              className="me-2"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              title="AI Assistant"
            >
              <i className="bi bi-chat-dots"></i>
              <span className="d-none d-sm-inline ms-1">Assistant</span>
            </Button>
            <Button
              variant="primary"
              className="me-2"
              size="sm"
              onClick={() => {
                setModalDefaults({});
                setShowModal(true);
              }}
              title="Add New Trade"
            >
              <i className="bi bi-plus-circle"></i>
              <span className="d-none d-sm-inline ms-1">New Trade</span>
            </Button>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
          </div>

          {/* Collapsible menu - user info and logout */}
          <Navbar.Collapse
            id="basic-navbar-nav"
            className={`position-absolute top-100 end-0 mt-2 p-2 rounded shadow ${theme === 'dark' ? 'bg-dark border border-secondary' : 'bg-white border'}`}
            style={{ zIndex: 1050, minWidth: '200px', right: '12px' }}
          >
            <Nav className="flex-column">
              <span className={`mb-2 d-block px-2 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                <i className="bi bi-person-circle me-1"></i>
                {user?.is_guest ? 'Guest' : user?.email}
              </span>
              <Button
                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
                size="sm"
                className="mb-2 text-start w-100 border-0"
                onClick={() => setShowWatchlist(true)}
              >
                <i className="bi bi-eye me-2"></i>
                Watchlist
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="mb-1 text-start w-100 border-0"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container>
        {/* Top Section: Portfolio Stats & Market Overview */}
        <div className="row mb-4">
          {paperTradingEnabled ? (
            <>
              {/* Portfolio Value */}
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
                  <div className="portfolio-value-label">Portfolio Value</div>
                  <div className="portfolio-value-amount">
                    ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Cash Balance */}
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
                  <div className="portfolio-value-label">Cash Balance</div>
                  <div className="portfolio-value-amount text-success">
                    ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowCashModal(true)}
                  >
                    <i className="bi bi-cash-coin me-1"></i>
                    Manage Cash
                  </Button>
                </div>
              </div>

              {/* Total Account Value */}
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
                  <div className="portfolio-value-label">Total Value</div>
                  <div className="portfolio-value-amount">
                    ${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <small className="text-muted">Portfolio + Cash</small>
                </div>
              </div>

              {/* Profit/Loss */}
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
                  <div className="portfolio-value-label">Total P/L</div>
                  <div className={`portfolio-value-amount ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <small className={profitLoss >= 0 ? 'text-success' : 'text-danger'}>
                    {profitLoss >= 0 ? '+' : ''}{profitLossPct.toFixed(2)}%
                  </small>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Simple Portfolio Value for non-paper trading */}
              <div className="col-lg-4 mb-3 mb-lg-0">
                <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
                  <div className="portfolio-value-label">Total Portfolio Value</div>
                  <div className="d-flex align-items-center">
                    <div className="portfolio-value-amount">
                      ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <Button
                    variant="success"
                    className="mt-3"
                    onClick={() => setShowPaperTradingWelcome(true)}
                  >
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Start Virtual Trading
                  </Button>
                </div>
              </div>
              <div className="col-lg-8">
                <MarketIndices />
              </div>
            </>
          )}
        </div>

        {/* Market Indices for paper trading users */}
        {paperTradingEnabled && (
          <div className="row mb-4">
            <div className="col-12">
              <MarketIndices />
            </div>
          </div>
        )}

        {/* Chart Card */}
        {selectedTicker && (
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <StockChart ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
            </div>
          </div>
        )}

        {/* Main Layout: Holdings Table (Full Width) */}
        <div className="row">
          <div className="col-12 mb-4">
            <HoldingsTable
              holdings={holdings}
              onSelectStock={handleSelectStock}
              selectedTicker={selectedTicker}
              onBuy={handleBuy}
              onSell={handleSell}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
      </Container>

      {/* Watchlist Modal */}
      <Modal show={showWatchlist} onHide={() => setShowWatchlist(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5">Watchlist</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Watchlist onSelectStock={handleSelectStock} />
        </Modal.Body>
      </Modal>

      {/* Transaction Modal */}
      <TransactionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onTransactionAdded={handleTransactionAdded}
        defaults={modalDefaults}
      />

      <ChatWidget
        show={showChat}
        onHide={() => setShowChat(false)}
        onTransactionComplete={fetchPortfolio}
      />

      {/* Paper Trading Modals */}
      <PaperTradingWelcome
        show={showPaperTradingWelcome}
        onEnable={enablePaperTrading}
        onSkip={() => setShowPaperTradingWelcome(false)}
      />

      <CashManagementModal
        show={showCashModal}
        onHide={() => setShowCashModal(false)}
        currentBalance={cashBalance}
        onSuccess={handleCashTransaction}
      />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  return user ? <MainApp /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
