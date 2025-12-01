import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const HoldingsCards = ({ holdings, onSelectStock, selectedTicker }) => {
    if (holdings.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">No holdings yet</p>
                <p className="text-gray-400 text-sm mt-2">Add your first trade to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 px-1">Your Holdings</h3>
            {holdings.map((stock) => (
                <div
                    key={stock.ticker}
                    onClick={() => onSelectStock(stock.ticker)}
                    className={`bg-white rounded-2xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${selectedTicker === stock.ticker
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">{stock.ticker.substring(0, 2)}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">{stock.ticker}</h4>
                                        <p className="text-sm text-gray-500">{stock.quantity} shares</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Avg Cost</p>
                                        <p className="text-sm font-semibold text-gray-900">${stock.average_cost.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Current Price</p>
                                        <p className="text-sm font-semibold text-gray-900">${stock.current_price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                    ${stock.market_value.toFixed(2)}
                                </p>
                                <div className={`inline-flex items-center space-x-1 mt-2 px-3 py-1 rounded-full text-sm font-semibold ${stock.gain_loss >= 0
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                    {stock.gain_loss >= 0 ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4" />
                                    )}
                                    <span>
                                        {stock.gain_loss >= 0 ? '+' : ''}${Math.abs(stock.gain_loss).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HoldingsCards;
