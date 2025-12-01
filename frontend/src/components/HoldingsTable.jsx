import React, { useState, useMemo } from 'react';
import { Table, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { RefreshCw } from 'lucide-react';

const HoldingsTable = ({ holdings, onSelectStock, selectedTicker, onBuy, onSell, lastUpdated }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'market_value', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedHoldings = useMemo(() => {
        let sortableItems = [...holdings];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [holdings, sortConfig]);

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
        }
        return sortConfig.direction === 'asc'
            ? <i className="bi bi-arrow-up ms-1 text-primary"></i>
            : <i className="bi bi-arrow-down ms-1 text-primary"></i>;
    };

    if (holdings.length === 0) {
        return (
            <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                    <h5 className="text-muted">No holdings yet</h5>
                    <p className="text-muted">Add your first trade to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Your Holdings</h5>
                {lastUpdated && (
                    <small className="text-muted d-flex align-items-center">
                        <RefreshCw size={12} className="me-1" />
                        {lastUpdated.toLocaleTimeString()}
                    </small>
                )}
            </div>
            <div className="card-body p-0">
                <Table hover responsive className="mb-0">
                    <thead className="table-light">
                        <tr>
                            {[
                                { label: 'Asset', key: 'ticker' },
                                { label: 'Quantity', key: 'quantity' },
                                { label: 'Avg Cost', key: 'average_cost' },
                                { label: 'Current Price', key: 'current_price' },
                                { label: 'Market Value', key: 'market_value' },
                                { label: 'Gain/Loss', key: 'gain_loss' },
                                { label: 'Actions', key: null },
                            ].map((col) => (
                                <th
                                    key={col.key || col.label}
                                    onClick={col.key ? () => handleSort(col.key) : undefined}
                                    style={col.key ? { cursor: 'pointer', userSelect: 'none' } : {}}
                                    className="text-nowrap"
                                >
                                    {col.label}
                                    {col.key && getSortIcon(col.key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedHoldings.map((stock) => (
                            <tr
                                key={stock.ticker}
                                className={selectedTicker === stock.ticker ? 'table-active' : ''}
                            >
                                <td onClick={() => onSelectStock(stock.ticker)} style={{ cursor: 'pointer' }}>
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                            style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}
                                        >
                                            {stock.ticker.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="fw-bold">{stock.ticker}</div>
                                            <small className="text-muted">Stock</small>
                                        </div>
                                    </div>
                                </td>
                                <td className="align-middle fw-semibold">{stock.quantity}</td>
                                <td className="align-middle">${stock.average_cost.toFixed(2)}</td>
                                <td className="align-middle">${stock.current_price.toFixed(2)}</td>
                                <td className="align-middle fw-bold text-primary">${stock.market_value.toFixed(2)}</td>
                                <td className="align-middle">
                                    <Badge
                                        bg={stock.gain_loss >= 0 ? 'success' : 'danger'}
                                        className="d-inline-flex align-items-center"
                                    >
                                        <i className={`bi bi-arrow-${stock.gain_loss >= 0 ? 'up' : 'down'}-short me-1`}></i>
                                        {stock.gain_loss >= 0 ? '+' : ''}${Math.abs(stock.gain_loss).toFixed(2)}
                                    </Badge>
                                </td>
                                <td className="align-middle">
                                    <ButtonGroup size="sm">
                                        <Button
                                            variant="outline-success"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onBuy(stock.ticker, stock.current_price);
                                            }}
                                        >
                                            <i className="bi bi-cart-plus me-1"></i>
                                            Buy
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSell(stock.ticker, stock.current_price);
                                            }}
                                        >
                                            <i className="bi bi-cart-dash me-1"></i>
                                            Sell
                                        </Button>
                                    </ButtonGroup>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default HoldingsTable;
