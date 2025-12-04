import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Badge, Modal } from 'react-bootstrap';
import TransactionModal from './components/TransactionModal';
import HoldingsTable from './components/HoldingsTable';
import StockChart from './components/StockChart';
import ChatWidget from './components/ChatWidget';
import Watchlist from './components/Watchlist';
import MarketIndices from './components/MarketIndices';
import Login from './components/Login';
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  useEffect(() => {
    fetchPortfolio();

    // Auto-refresh every 2 minutes (120000 ms)
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleTransactionAdded = () => {
    fetchPortfolio();
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
        <Container>
          <Navbar.Brand href="#home">
            <i className="bi bi-graph-up-arrow me-2"></i>
            Portfolio Tracker
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
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <span className={`mb-2 d-block ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                <i className="bi bi-person-circle me-1"></i>
                {user?.is_guest ? 'Guest' : user?.email}
              </span>
              <Button
                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
                size="sm"
                className="mb-2 text-start"
                onClick={() => setShowWatchlist(true)}
              >
                <i className="bi bi-eye me-2"></i>
                Watchlist
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="mb-2 text-start"
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
        {/* Top Section: Portfolio Value & Market Overview */}
        <div className="row mb-4">
          <div className="col-lg-4 mb-3 mb-lg-0">
            <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center">
              <div className="portfolio-value-label">Total Portfolio Value</div>
              <div className="d-flex align-items-center">
                <div className="portfolio-value-amount">
                  ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <MarketIndices />
          </div>
        </div>

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
