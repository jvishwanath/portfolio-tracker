import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const PaperTradingWelcome = ({ show, onEnable, onSkip }) => {
    const [initialDeposit, setInitialDeposit] = useState(10000);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleEnable = async () => {
        setLoading(true);
        try {
            await onEnable(initialDeposit);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onSkip} centered backdrop="static">
            <Modal.Header>
                <Modal.Title>
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Welcome to Virtual Trading!
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-4">
                    <i className="bi bi-cash-stack text-success" style={{ fontSize: '4rem' }}></i>
                </div>

                <h5 className="text-center mb-3">Start Trading with Virtual Money</h5>

                <p className="text-muted">
                    Practice trading stocks with virtual money. Track your performance,
                    test strategies, and learn without any risk!
                </p>

                <div className="border p-3 rounded mb-3">
                    <h6>Features:</h6>
                    <ul className="mb-0">
                        <li>Real-time stock prices</li>
                        <li>Track profit/loss</li>
                        <li>Manage virtual cash balance</li>
                        <li>Full transaction history</li>
                    </ul>
                </div>

                <Form.Group className="mb-3">
                    <Form.Label>Initial Deposit Amount</Form.Label>
                    <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Form.Control
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(parseFloat(e.target.value))}
                            min="1000"
                            step="1000"
                        />
                    </div>
                    <Form.Text className="text-muted">
                        Recommended: $10,000 - $100,000
                    </Form.Text>
                </Form.Group>

                <div className="alert alert-warning d-flex align-items-start" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                    <div>
                        <strong>Warning:</strong> Enabling virtual trading will
                        <span className="fw-bold text-danger"> delete all existing transactions</span> and reset your portfolio.
                    </div>
                </div>

                <Form.Check
                    type="checkbox"
                    id="confirm-reset"
                    label="I understand that my existing portfolio will be cleared."
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mb-3"
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onSkip} disabled={loading}>
                    Maybe Later
                </Button>
                <Button
                    variant="success"
                    onClick={handleEnable}
                    disabled={loading || initialDeposit < 1000 || !confirmed}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Activating...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-2"></i>
                            Start Virtual Trading
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PaperTradingWelcome;
