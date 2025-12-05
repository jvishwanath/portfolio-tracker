import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, DollarSign, Calendar, Hash, Activity, CheckCircle, AlertCircle, Search } from 'lucide-react';

const TransactionWizard = ({ onTransactionAdded }) => {
    const [ticker, setTicker] = useState('');
    const [type, setType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Search Suggestions
    React.useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (ticker && ticker.length > 1 && showSuggestions) {
                try {
                    const res = await axios.get(`/api/stock/search?q=${ticker}`);
                    if (Array.isArray(res.data)) setSuggestions(res.data);
                    else setSuggestions([]);
                } catch (e) { setSuggestions([]); }
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [ticker, showSuggestions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
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
            setSuggestions([]);
            setMessage({ type: 'success', text: 'Transaction executed successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error adding transaction", error);
            const errorMessage = error.response?.data?.detail || 'Failed to execute transaction';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40 h-full flex flex-col">
            <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg text-white mr-4">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Trade</h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New Transaction</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                {/* Action Toggle */}
                <div className="bg-gray-100/80 p-1.5 rounded-xl flex shadow-inner">
                    <button
                        type="button"
                        onClick={() => setType('buy')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${type === 'buy'
                            ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('sell')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${type === 'sell'
                            ? 'bg-white text-red-600 shadow-sm transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Sell
                    </button>
                </div>

                {/* Ticker Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Asset</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => { setTicker(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && showSuggestions && suggestions.length > 0) {
                                    e.preventDefault();
                                    setTicker(suggestions[0].symbol);
                                    setShowSuggestions(false);
                                }
                            }}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white/50 font-bold text-gray-800 placeholder-gray-300"
                            placeholder="Ticker (e.g. AAPL)"
                            required
                            autoComplete="off"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-1 max-h-60 overflow-auto shadow-xl">
                                {suggestions.map((s, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => {
                                            setTicker(s.symbol);
                                            setShowSuggestions(false);
                                        }}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                        <span className="font-bold text-gray-800">{s.symbol}</span>
                                        <span className="text-xs text-gray-500 truncate max-w-[150px]">{s.shortname || s.longname}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Quantity</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white/50 font-medium text-gray-800"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Price</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white/50 font-medium text-gray-800"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white/50 font-medium text-gray-800"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-xl transform transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center ${type === 'buy'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'
                            : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/30'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            <>
                                <PlusCircle className="w-5 h-5 mr-2" />
                                {type === 'buy' ? 'Execute Buy Order' : 'Execute Sell Order'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TransactionWizard;
