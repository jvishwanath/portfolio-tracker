import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const TransactionForm = ({ onTransactionAdded, onCancel }) => {
    const [ticker, setTicker] = useState('');
    const [type, setType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            setError('Failed to add transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">New Trade</h3>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => setType('buy')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${type === 'buy'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('sell')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${type === 'sell'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Sell
                    </button>
                </div>

                {/* Ticker */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stock Symbol
                    </label>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="e.g. AAPL"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                    />
                </div>

                {/* Quantity & Price */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Price
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${type === 'buy'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-red-500 hover:bg-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? 'Processing...' : `${type === 'buy' ? 'Buy' : 'Sell'} ${ticker || 'Stock'}`}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
