import React, { useState } from 'react';
import axios from 'axios';
import TickerSearch from './TickerSearch';
import { Modal, Button, Form, ButtonGroup, InputGroup } from 'react-bootstrap';

const TransactionModal = ({ show, onHide, onTransactionAdded, defaults = {} }) => {
    const [ticker, setTicker] = useState('');
    const [type, setType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    // Update form when defaults change
    React.useEffect(() => {
        if (show) {
            setTicker(defaults.ticker || '');
            setType(defaults.type || 'buy');
            setPrice(defaults.price || '');
            setQuantity('');
            setError(null);
        }
    }, [show, defaults]);

    // Fetch Price Logic only (manual search removed)
    React.useEffect(() => {
        const fetchPrice = async () => {
            if (ticker && ticker.length >= 1 && ticker.length <= 5) {
                setFetchingPrice(true);
                try {
                    const response = await axios.get(`/api/stock/${ticker.toUpperCase()}/current`);
                    if (response.data.price) {
                        setPrice(response.data.price.toFixed(2));
                    }
                } catch (err) {
                    // Silent fail
                } finally {
                    setFetchingPrice(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            if (ticker && !defaults.ticker) {
                fetchPrice();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [ticker, defaults.ticker]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/transactions', {
                ticker: ticker.toUpperCase(),
                type,
                quantity: parseFloat(quantity),
                price: parseFloat(price),
                date: new Date(date).toISOString()
            });
            onTransactionAdded();
            setTicker('');
            setQuantity('');
            setPrice('');
        } catch (err) {
            console.error("Error adding transaction", err);
            const errorMessage = err.response?.data?.detail || 'Failed to add transaction';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>New Trade</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                <Form onSubmit={handleSubmit}>
                    {/* Buy/Sell Toggle */}
                    <Form.Group className="mb-3">
                        <Form.Label>Action</Form.Label>
                        <ButtonGroup className="w-100">
                            <Button
                                variant={type === 'buy' ? 'primary' : 'outline-primary'}
                                onClick={() => setType('buy')}
                            >
                                Buy
                            </Button>
                            <Button
                                variant={type === 'sell' ? 'danger' : 'outline-danger'}
                                onClick={() => setType('sell')}
                            >
                                Sell
                            </Button>
                        </ButtonGroup>
                    </Form.Group>

                    {/* Ticker */}
                    <Form.Group className="mb-3">
                        <Form.Label>Stock Symbol</Form.Label>
                        <TickerSearch
                            value={ticker}
                            onChange={setTicker}
                            required
                            placeholder="e.g. AAPL or Apple"
                        />
                    </Form.Group>

                    {/* Quantity & Price */}
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                    {fetchingPrice && (
                                        <InputGroup.Text>
                                            <div className="spinner-border spinner-border-sm" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </InputGroup.Text>
                                    )}
                                </InputGroup>
                                {fetchingPrice && (
                                    <Form.Text className="text-muted">
                                        Fetching current price...
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </div>
                    </div>

                    {/* Date */}
                    <Form.Group className="mb-3">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button
                            variant={type === 'buy' ? 'primary' : 'danger'}
                            type="submit"
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? 'Processing...' : `${type === 'buy' ? 'Buy' : 'Sell'} ${ticker || 'Stock'}`}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default TransactionModal;
