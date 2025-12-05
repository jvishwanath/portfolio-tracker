import React from 'react';
import { Container, Card } from 'react-bootstrap';
import Watchlist from '../components/Watchlist';

const WatchlistPage = () => {
    const handleSelectStock = (ticker) => {
        // Navigate to research page with this ticker
        window.location.href = `/research?ticker=${ticker}`;
    };

    return (
        <Container className="py-4">
            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-eye-fill me-2 text-primary" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                            <h4 className="mb-0">My Watchlist</h4>
                            <small className="text-muted">Track your favorite stocks</small>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Watchlist onSelectStock={handleSelectStock} />
                </Card.Body>
            </Card>
        </Container>
    );
};

export default WatchlistPage;
