import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ListGroup, Button, Form } from 'react-bootstrap';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import TickerSearch from './TickerSearch';

const Watchlist = ({ onSelectStock }) => {
    const [watchlist, setWatchlist] = useState([]);
    const [newTicker, setNewTicker] = useState('');
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState('');

    const fetchWatchlist = async () => {
        try {
            const response = await axios.get('/api/watchlist');
            setWatchlist(response.data);
            // Fetch prices for watchlist items
            response.data.forEach(item => fetchPrice(item.ticker));
        } catch (error) {
            console.error("Error fetching watchlist", error);
            setError('Failed to load watchlist');
        }
    };

    const fetchPrice = async (ticker) => {
        try {
            const response = await axios.get(`/api/stock/${ticker}/current`);
            setPrices(prev => ({
                ...prev,
                [ticker]: response.data
            }));
            setLastUpdated(new Date());
        } catch (error) {
            console.error(`Error fetching price for ${ticker}`, error);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    useEffect(() => {
        // Refresh prices every minute
        if (watchlist.length === 0) return;

        const interval = setInterval(() => {
            watchlist.forEach(item => fetchPrice(item.ticker));
        }, 60000);

        return () => clearInterval(interval);
    }, [watchlist]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTicker) return;
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/watchlist', { ticker: newTicker.toUpperCase() });
            setNewTicker('');
            fetchWatchlist();
        } catch (error) {
            console.error("Error adding to watchlist", error);
            const errorMessage = error.response?.data?.detail || 'Failed to add to watchlist';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, e) => {
        e.stopPropagation();
        setError('');
        try {
            await axios.delete(`/api/watchlist/${id}`);
            fetchWatchlist();
        } catch (error) {
            console.error("Error removing from watchlist", error);
            const errorMessage = error.response?.data?.detail || 'Failed to remove from watchlist';
            setError(errorMessage);
        }
    };

    return (
        <div>
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
                </div>
            )}
            <Form onSubmit={handleAdd} className="mb-3">
                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <TickerSearch
                            value={newTicker}
                            onChange={setNewTicker}
                            placeholder="Add symbol..."
                        />
                    </div>
                    <Button variant="outline-primary" type="submit" disabled={loading}>
                        <Plus size={18} />
                    </Button>
                </div>
            </Form>

            <ListGroup variant="flush">
                {watchlist.length === 0 && (
                    <div className="text-center text-muted py-3">
                        <small>No stocks in watchlist</small>
                    </div>
                )}
                {watchlist.map((item) => {
                    const data = prices[item.ticker] || { price: 0, previous_close: 0, company_name: '' };

                    const change = data.price - data.previous_close;
                    const changePercent = data.previous_close ? (change / data.previous_close) * 100 : 0;
                    const isPositive = change >= 0;

                    return (
                        <ListGroup.Item
                            key={item.id}
                            onClick={() => onSelectStock(item.ticker)}
                            className="d-flex justify-content-between align-items-center py-1 px-2"
                            style={{ cursor: 'pointer', borderLeft: 'none', borderRight: 'none' }}
                        >
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                <span className="fw-bold" style={{ fontSize: '0.85rem', minWidth: '60px' }}>
                                    {item.ticker}
                                </span>

                                {data.price > 0 && (
                                    <>
                                        <span className="fw-bold" style={{ fontSize: '0.85rem', minWidth: '70px' }}>
                                            ${data.price.toFixed(2)}
                                        </span>
                                        <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.75rem', minWidth: '80px' }}>
                                            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                        </span>
                                    </>
                                )}

                                {data.company_name && (
                                    <small className="text-muted text-truncate" style={{ fontSize: '0.7rem', maxWidth: '200px' }}>
                                        {data.company_name}
                                    </small>
                                )}
                            </div>
                            <Button
                                variant="link"
                                className="text-danger p-0"
                                onClick={(e) => handleRemove(item.id, e)}
                                style={{ minWidth: 'auto' }}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>

            {lastUpdated && (
                <div className="text-end mt-2">
                    <small className="text-muted d-inline-flex align-items-center" style={{ fontSize: '0.7rem' }}>
                        <RefreshCw size={10} className="me-1" />
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </small>
                </div>
            )}
        </div>
    );
};

export default Watchlist;
