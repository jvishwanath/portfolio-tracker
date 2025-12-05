import React, { useState } from 'react';
import { Modal, Button, Form, Tabs, Tab, Alert } from 'react-bootstrap';
import axios from 'axios';

const CashManagementModal = ({ show, onHide, currentBalance, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/paper-trading/cash', null, {
                params: {
                    transaction_type: activeTab,
                    amount: parseFloat(amount),
                    note: note
                }
            });

            setAmount('');
            setNote('');
            if (onSuccess) onSuccess(response.data);

            // Show success message briefly then close
            setTimeout(() => {
                onHide();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const isValid = amount && parseFloat(amount) > 0;
    const isWithdrawalValid = isValid && parseFloat(amount) <= currentBalance;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-cash-coin me-2"></i>
                    Manage Cash
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Current Balance:</span>
                        <h4 className="mb-0 text-success">
                            ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                    </div>
                </div>

                {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-3"
                >
                    <Tab eventKey="deposit" title={<><i className="bi bi-plus-circle me-1"></i> Deposit</>}>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Amount</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Note (Optional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Monthly deposit"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </Form.Group>

                            <Button
                                variant="success"
                                type="submit"
                                className="w-100"
                                disabled={!isValid || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Deposit ${amount || '0.00'}
                                    </>
                                )}
                            </Button>
                        </Form>
                    </Tab>

                    <Tab eventKey="withdrawal" title={<><i className="bi bi-dash-circle me-1"></i> Withdraw</>}>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Amount</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        max={currentBalance}
                                        required
                                    />
                                </div>
                                <Form.Text className="text-muted">
                                    Available: ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Note (Optional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Profit withdrawal"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </Form.Group>

                            <Button
                                variant="warning"
                                type="submit"
                                className="w-100"
                                disabled={!isWithdrawalValid || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-dash-circle me-2"></i>
                                        Withdraw ${amount || '0.00'}
                                    </>
                                )}
                            </Button>
                        </Form>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
};

export default CashManagementModal;
