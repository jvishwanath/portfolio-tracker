import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ListGroup, Button, Form, InputGroup } from 'react-bootstrap';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const Watchlist = ({ onSelectStock }) => {
    const [watchlist, setWatchlist] = useState([]);
    const [newTicker, setNewTicker] = useState('');
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchWatchlist = async () => {
        try {
            const response = await axios.get('/api/watchlist');
            setWatchlist(response.data);
            // Fetch prices for watchlist items
            response.data.forEach(item => fetchPrice(item.ticker));
        } catch (error) {
            console.error("Error fetching watchlist", error);
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
        try {
            await axios.post('/api/watchlist', { ticker: newTicker.toUpperCase() });
            setNewTicker('');
            fetchWatchlist();
        } catch (error) {
            console.error("Error adding to watchlist", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`/api/watchlist/${id}`);
            fetchWatchlist();
        } catch (error) {
            console.error("Error removing from watchlist", error);
        }
    };

    return (
        <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Watchlist</h5>
                {lastUpdated && (
                    <small className="text-muted d-flex align-items-center">
                        <RefreshCw size={12} className="me-1" />
                        {lastUpdated.toLocaleTimeString()}
                    </small>
                )}
            </div>
            <div className="card-body">
                <Form onSubmit={handleAdd} className="mb-3">
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Add symbol..."
                            value={newTicker}
                            onChange={(e) => setNewTicker(e.target.value)}
                        />
                        <Button variant="outline-primary" type="submit" disabled={loading}>
                            <Plus size={18} />
                        </Button>
                    </InputGroup>
                </Form>

                <ListGroup variant="flush">
                    {watchlist.length === 0 && (
                        <div className="text-center text-muted py-3">
                            <small>No stocks in watchlist</small>
                        </div>
                    )}
                    {watchlist.map((item) => (
                        <ListGroup.Item
                            key={item.id}
                            onClick={() => onSelectStock(item.ticker)}
                            className="d-flex justify-content-between align-items-center px-2"
                            style={{ cursor: 'pointer' }}
                        >
                            <div>
                                <div className="fw-bold">{item.ticker}</div>
                                {prices[item.ticker] && prices[item.ticker].previous_close && (
                                    <small className={
                                        (prices[item.ticker].price - prices[item.ticker].previous_close) >= 0
                                            ? "text-success"
                                            : "text-danger"
                                    }>
                                        {((prices[item.ticker].price - prices[item.ticker].previous_close) >= 0 ? '+' : '')}
                                        ${(prices[item.ticker].price - prices[item.ticker].previous_close).toFixed(2)}
                                        {' '}
                                        ({((prices[item.ticker].price - prices[item.ticker].previous_close) / prices[item.ticker].previous_close * 100).toFixed(2)}%)
                                    </small>
                                )}
                            </div>
                            <div className="d-flex align-items-center">
                                {prices[item.ticker] && (
                                    <span className="fw-bold me-3">
                                        ${prices[item.ticker].price.toFixed(2)}
                                    </span>
                                )}
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    onClick={(e) => handleRemove(item.id, e)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        </div>
    );
};

export default Watchlist;
