import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import TransactionModal from './components/TransactionModal';
import HoldingsTable from './components/HoldingsTable';
import StockChart from './components/StockChart';
import ChatWidget from './components/ChatWidget';
import Watchlist from './components/Watchlist';
import MarketIndices from './components/MarketIndices';

function App() {
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            <i className="bi bi-graph-up-arrow me-2"></i>
            Portfolio Tracker
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Button
              variant="outline-light"
              className="me-2"
              onClick={() => setShowChat(!showChat)}
            >
              <i className="bi bi-chat-dots me-2"></i>
              Assistant
            </Button>
            <Button variant="primary" onClick={() => {
              setModalDefaults({});
              setShowModal(true);
            }}>
              <i className="bi bi-plus-circle me-2"></i>
              New Trade
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container>
        {/* Portfolio Value Card */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col">
                <h6 className="text-muted mb-1">Total Portfolio Value</h6>
                <h2 className="mb-0 fw-bold">
                  ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="col-auto">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-bar-chart-fill text-primary fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Indices */}
        <MarketIndices />

        {/* Chart Card */}
        {selectedTicker && (
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <StockChart ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
            </div>
          </div>
        )}

        {/* Main Layout: Holdings and Watchlist */}
        <div className="row">
          <div className="col-lg-8 mb-4">
            <HoldingsTable
              holdings={holdings}
              onSelectStock={handleSelectStock}
              selectedTicker={selectedTicker}
              onBuy={handleBuy}
              onSell={handleSell}
              lastUpdated={lastUpdated}
            />
          </div>
          <div className="col-lg-4 mb-4">
            <Watchlist onSelectStock={handleSelectStock} />
          </div>
        </div>
      </Container>

      {/* Transaction Modal */}
      <TransactionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onTransactionAdded={handleTransactionAdded}
        defaults={modalDefaults}
      />

      <ChatWidget show={showChat} onHide={() => setShowChat(false)} />
    </div>
  );
}

export default App;
