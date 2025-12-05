import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';
import TransactionModal from '../components/TransactionModal';
import HoldingsTable from '../components/HoldingsTable';
import StockChart from '../components/StockChart';
import MarketIndices from '../components/MarketIndices';
import PaperTradingWelcome from '../components/PaperTradingWelcome';
import CashManagementModal from '../components/CashManagementModal';

const Dashboard = ({
    paperTradingEnabled,
    setPaperTradingEnabled,
    cashBalance,
    setCashBalance,
    profitLoss,
    setProfitLoss,
    profitLossPct,
    setProfitLossPct,
    totalAccountValue,
    setTotalAccountValue,
    refreshTrigger
}) => {
    const [holdings, setHoldings] = useState([]);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [selectedTicker, setSelectedTicker] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalDefaults, setModalDefaults] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showPaperTradingWelcome, setShowPaperTradingWelcome] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);
    const [unrealizedPL, setUnrealizedPL] = useState(0);
    const [realizedPL, setRealizedPL] = useState(0);

    const fetchPortfolio = async () => {
        try {
            const response = await axios.get('/api/portfolio/summary');
            setHoldings(response.data.holdings);
            setPortfolioValue(response.data.total_value);
            setLastUpdated(new Date());

            // Cache for next session
            localStorage.setItem('dashboard_portfolio', JSON.stringify({
                holdings: response.data.holdings,
                total_value: response.data.total_value,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error("Error fetching portfolio", error);
        }
    };

    const fetchPaperTradingStatus = async () => {
        try {
            const response = await axios.get('/api/paper-trading/status');
            setPaperTradingEnabled(response.data.enabled);
            setCashBalance(response.data.cash_balance);

            // Cache data
            localStorage.setItem('dashboard_status', JSON.stringify({
                enabled: response.data.enabled,
                cash_balance: response.data.cash_balance,
                timestamp: Date.now()
            }));

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
            setUnrealizedPL(response.data.unrealized_pl || 0);
            setRealizedPL(response.data.realized_pl || 0);

            // Cache data
            localStorage.setItem('dashboard_pl', JSON.stringify({
                profit_loss: response.data.profit_loss,
                profit_loss_percentage: response.data.profit_loss_percentage,
                total_account_value: response.data.total_account_value,
                unrealized_pl: response.data.unrealized_pl || 0,
                realized_pl: response.data.realized_pl || 0,
                timestamp: Date.now()
            }));
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
            const errorMsg = error.response?.data?.detail || "Failed to enable virtual trading";

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
        // Load cached data for instant display
        try {
            const cachedPort = localStorage.getItem('dashboard_portfolio');
            if (cachedPort) {
                const data = JSON.parse(cachedPort);
                setHoldings(data.holdings);
                setPortfolioValue(data.total_value);
            }

            const cachedStatus = localStorage.getItem('dashboard_status');
            if (cachedStatus) {
                const data = JSON.parse(cachedStatus);
                setPaperTradingEnabled(data.enabled);
                setCashBalance(data.cash_balance);
            }

            const cachedPL = localStorage.getItem('dashboard_pl');
            if (cachedPL) {
                const data = JSON.parse(cachedPL);
                setProfitLoss(data.profit_loss);
                setProfitLossPct(data.profit_loss_percentage);
                setTotalAccountValue(data.total_account_value);
                setUnrealizedPL(data.unrealized_pl || 0);
                setRealizedPL(data.realized_pl || 0);
            }
        } catch (e) { console.warn("Cache load failed", e); }

        fetchPortfolio();
        fetchPaperTradingStatus();
    }, []);

    useEffect(() => {
        if (paperTradingEnabled) {
            fetchProfitLoss();
        }
    }, [paperTradingEnabled]);

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchPortfolio();
            fetchPaperTradingStatus();
            if (paperTradingEnabled) {
                fetchProfitLoss();
            }
        }
    }, [refreshTrigger, paperTradingEnabled]);

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
        <Container>
            {/* Header with New Trade Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Dashboard</h2>
                <Button
                    variant="primary"
                    onClick={() => {
                        setModalDefaults({ type: 'buy' });
                        setShowModal(true);
                    }}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    New Trade
                </Button>
            </div>

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

                        {/* Profit/Loss Breakdown */}
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="portfolio-value-widget shadow-sm h-100 d-flex flex-column justify-content-center px-3 py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="portfolio-value-label mb-0">Total P/L</div>
                                    <div className={`fw-bold ${(profitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.2rem' }}>
                                        {(profitLoss || 0) >= 0 ? '+' : ''}${(profitLoss || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="text-end mb-2">
                                    <small className={(profitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                        {(profitLoss || 0) >= 0 ? '+' : ''}{(profitLossPct || 0).toFixed(2)}%
                                    </small>
                                </div>

                                <div className="border-top pt-2 mt-1">
                                    <div className="d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
                                        <span className="text-muted">Unrealized:</span>
                                        <span className={(unrealizedPL || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                            {(unrealizedPL || 0) >= 0 ? '+' : ''}${(unrealizedPL || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
                                        <span className="text-muted">Realized:</span>
                                        <span className={(realizedPL || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                            {(realizedPL || 0) >= 0 ? '+' : ''}${(realizedPL || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
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

            {/* Transaction Modal */}
            <TransactionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onTransactionAdded={handleTransactionAdded}
                defaults={modalDefaults}
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
        </Container>
    );
};

export default Dashboard;
