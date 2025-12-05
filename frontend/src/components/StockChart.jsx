import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

const StockChart = ({ ticker, onClose }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('1mo');
    const [priceChange, setPriceChange] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/stock/${ticker}/history?period=${period}`);
                const historyData = response.data;
                setData(historyData);

                if (historyData.length > 0) {
                    const firstPrice = historyData[0].close;
                    const lastPrice = historyData[historyData.length - 1].close;
                    const change = lastPrice - firstPrice;
                    const changePercent = (change / firstPrice) * 100;
                    setPriceChange({
                        value: change,
                        percent: changePercent
                    });
                }
            } catch (error) {
                console.error("Error fetching history", error);
            } finally {
                setLoading(false);
            }
        };
        if (ticker) {
            fetchData();
        }
    }, [ticker, period]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="position-relative">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="h5 fw-bold mb-1">{ticker} Performance</h3>
                    {priceChange && (
                        <div className={`fw-bold ${priceChange.value >= 0 ? 'text-success' : 'text-danger'}`}>
                            {priceChange.value >= 0 ? '+' : ''}{priceChange.value.toFixed(2)} ({priceChange.value >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                            <span className="text-muted ms-2 fw-normal">Past {
                                {
                                    '1d': 'Day',
                                    '5d': 'Week',
                                    '1mo': 'Month',
                                    '3mo': '3 Months',
                                    '6mo': '6 Months',
                                    '1y': 'Year',
                                    '2y': '2 Years',
                                    '5y': '5 Years',
                                    'ytd': 'Year to Date',
                                    'max': 'Max'
                                }[period] || period
                            }</span>
                        </div>
                    )}
                </div>
                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-select form-select-sm"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="1d">1 Day</option>
                        <option value="5d">1 Week</option>
                        <option value="1mo">1 Month</option>
                        <option value="3mo">3 Months</option>
                        <option value="1y">1 Year</option>
                    </select>
                    <button
                        className="btn btn-outline-secondary btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={priceChange?.value >= 0 ? "#198754" : "#dc3545"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={priceChange?.value >= 0 ? "#198754" : "#dc3545"} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(str) => {
                            if (period === '1d') return str.split(' ')[1]; // Show time for 1d
                            return str;
                        }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e1e1e' : '#ffffff',
                            border: `1px solid ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#333' : '#dee2e6'}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : '#212529'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke={priceChange?.value >= 0 ? "#198754" : "#dc3545"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockChart;
