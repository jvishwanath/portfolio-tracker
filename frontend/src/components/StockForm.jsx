import React, { useState } from 'react';
import axios from 'axios';

const StockForm = ({ onTransactionAdded }) => {
    const [ticker, setTicker] = useState('');
    const [type, setType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8010/transactions', {
                ticker: ticker.toUpperCase(),
                type,
                quantity: parseFloat(quantity),
                price: parseFloat(price),
                date: new Date(date).toISOString()
            });
            // Also add to watchlist automatically if buying? Optional.
            // For now just refresh data
            onTransactionAdded();
            setTicker('');
            setQuantity('');
            setPrice('');
        } catch (error) {
            console.error("Error adding transaction", error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ticker</label>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input
                            type="number"
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                >
                    Add Transaction
                </button>
            </form>
        </div>
    );
};

export default StockForm;
