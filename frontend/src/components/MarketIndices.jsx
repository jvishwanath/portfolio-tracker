import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const MarketIndices = () => {
    const [indices, setIndices] = useState({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Ticker symbols for major indices and crypto
    const symbols = [
        { ticker: '^DJI', name: 'DOW' },
        { ticker: '^IXIC', name: 'NASDAQ' },
        { ticker: '^GSPC', name: 'S&P 500' },
        { ticker: 'BTC-USD', name: 'BTC' },
        { ticker: 'ETH-USD', name: 'ETH' },
        { ticker: 'XRP-USD', name: 'XRP' }
    ];

    const fetchIndices = async () => {
        setLoading(true);
        const results = {};

        for (const symbol of symbols) {
            try {
                const response = await axios.get(`/api/stock/${symbol.ticker}/current`);
                results[symbol.ticker] = {
                    name: symbol.name,
                    price: response.data.price,
                    previousClose: response.data.previous_close
                };
            } catch (error) {
                console.error(`Error fetching ${symbol.ticker}`, error);
            }
        }

        setIndices(results);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchIndices();

        // Refresh every 5 minutes
        const interval = setInterval(() => {
            fetchIndices();
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    const calculateChange = (current, previous) => {
        if (!previous) return { value: 0, percent: 0 };
        const change = current - previous;
        const percent = (change / previous) * 100;
        return { value: change, percent };
    };

    const formatPrice = (price, isCrypto) => {
        if (isCrypto) {
            return price < 1 ? price.toFixed(4) : price.toFixed(2);
        }
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading && Object.keys(indices).length === 0) {
        return (
            <div className="card shadow-sm mb-4">
                <div className="card-body text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-muted">Market Overview</h6>
                    {lastUpdated && (
                        <small className="text-muted d-flex align-items-center">
                            <RefreshCw size={12} className="me-1" />
                            {lastUpdated.toLocaleTimeString()}
                        </small>
                    )}
                </div>
                <div className="row g-3">
                    {symbols.map(symbol => {
                        const data = indices[symbol.ticker];
                        if (!data) return null;

                        const isCrypto = symbol.ticker.includes('-USD');
                        const change = calculateChange(data.price, data.previousClose);
                        const isPositive = change.value >= 0;

                        return (
                            <div key={symbol.ticker} className="col-6 col-md-4 col-lg-2">
                                <div className="d-flex flex-column">
                                    <small className="text-muted fw-semibold">{data.name}</small>
                                    <div className="fw-bold">
                                        {isCrypto && '$'}{formatPrice(data.price, isCrypto)}
                                    </div>
                                    {data.previousClose && (
                                        <small className={isPositive ? 'text-success' : 'text-danger'}>
                                            <span className="d-flex align-items-center">
                                                {isPositive ? <TrendingUp size={12} className="me-1" /> : <TrendingDown size={12} className="me-1" />}
                                                {isPositive ? '+' : ''}{change.value.toFixed(2)} ({isPositive ? '+' : ''}{change.percent.toFixed(2)}%)
                                            </span>
                                        </small>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MarketIndices;
