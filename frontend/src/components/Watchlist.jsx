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
        <div>
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
                {watchlist.map((item) => {
                    const data = prices[item.ticker];
                    if (!data) return null;

                    const change = data.price - data.previous_close;
                    const changePercent = data.previous_close ? (change / data.previous_close) * 100 : 0;
                    const isPositive = change >= 0;

                    return (
                        <ListGroup.Item
                            key={item.id}
                            onClick={() => onSelectStock(item.ticker)}
                            className="d-flex justify-content-between align-items-center py-2 px-2"
                            style={{ cursor: 'pointer', borderLeft: 'none', borderRight: 'none' }}
                        >
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                                <div className="d-flex flex-column" style={{ minWidth: '120px' }}>
                                    <span className="fw-bold" style={{ fontSize: '0.75rem' }}>
                                        {item.ticker}
                                    </span>
                                    {data.company_name && (
                                        <small className="text-muted" style={{ fontSize: '0.65rem', lineHeight: '1' }}>
                                            {data.company_name}
                                        </small>
                                    )}
                                </div>
                                {data.previous_close && (
                                    <>
                                        <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.7rem' }}>
                                            {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)}
                                        </span>
                                        <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.7rem' }}>
                                            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                                        </span>
                                    </>
                                )}
                                <span className="fw-bold ms-auto" style={{ fontSize: '0.8rem' }}>
                                    ${data.price.toFixed(2)}
                                </span>
                            </div>
                            <Button
                                variant="link"
                                className="text-danger p-0 ms-2"
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
