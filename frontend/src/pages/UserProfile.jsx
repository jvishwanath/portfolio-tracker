import React, { useState } from 'react';
import { Container, Card, Button, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserProfile = ({ user, theme }) => {
    const [showResetModal, setShowResetModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const navigate = useNavigate();

    const handleReset = async () => {
        setLoading(true);
        setError(null);
        try {
            // Reset portfolio to $0 cash and clear holdings
            await axios.post('/api/paper-trading/enable', null, {
                params: { initial_deposit: 0 }
            });
            setShowResetModal(false);
            setSuccessMsg("Portfolio has been successfully reset. Redirecting to Dashboard...");

            // Redirect after short delay
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            console.error("Reset failed", err);
            setError("Failed to reset portfolio. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const isDarkMode = theme === 'dark';
    const cardBg = isDarkMode ? 'bg-secondary text-white' : 'bg-white';
    const borderColor = isDarkMode ? 'border-secondary' : 'border-light';

    return (
        <Container className="py-4">
            <h2 className="mb-4">User Profile</h2>

            {/* Profile Details */}
            <Card className={`mb-4 shadow-sm ${cardBg} ${borderColor}`}>
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div>
                            <h4 className="mb-1">{user?.email || 'Guest User'}</h4>
                            <p className="text-muted mb-0">
                                {user?.email?.startsWith('guest_') ? 'Temporary Guest Account' : 'Registered User'}
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {successMsg && (
                <Alert variant="success" className="mb-4">{successMsg}</Alert>
            )}

            {/* Danger Zone / Settings */}
            <h4 className="mb-3">Settings</h4>
            <Card className={`mb-4 shadow-sm border-danger`}>
                <Card.Header className="bg-danger text-white">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Danger Zone
                </Card.Header>
                <Card.Body className={isDarkMode ? 'bg-dark text-white' : ''}>
                    <h5>Reset Virtual Portfolio</h5>
                    <p className="text-muted">
                        This action will immediately delete all your current holdings, transaction history, and reset your virtual cash balance to <strong>$0</strong>.
                        This action cannot be undone.
                    </p>
                    <Button variant="outline-danger" onClick={() => setShowResetModal(true)}>
                        Reset Portfolio
                    </Button>
                </Card.Body>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                show={showResetModal}
                onHide={() => setShowResetModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        Confirm Portfolio Reset
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you absolutely sure you want to reset your virtual trading portfolio?</p>
                    <div className="alert alert-danger">
                        <ul className="mb-0">
                            <li>All current stock holdings will be removed.</li>
                            <li>All transaction history will be deleted.</li>
                            <li>Cash balance will be set to $0.00.</li>
                        </ul>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResetModal(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleReset} disabled={loading}>
                        {loading ? 'Resetting...' : 'Yes, Reset Everything'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserProfile;
