import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
import axios from 'axios';

const TickerSearch = ({ value, onChange, placeholder = "Search stock symbol...", required = false }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Sync state with prop if it changes externally (e.g. clearing form)
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Handle Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query && query.length > 1 && showSuggestions) {
                try {
                    const response = await axios.get(`/api/stock/search?q=${query}`);
                    if (Array.isArray(response.data)) {
                        setSuggestions(response.data);
                    } else {
                        setSuggestions([]);
                    }
                } catch (e) {
                    console.error("Search error", e);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, showSuggestions]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (symbol) => {
        const newValue = symbol;
        setQuery(newValue);
        onChange(newValue);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleChange = (e) => {
        const newVal = e.target.value;
        setQuery(newVal);
        onChange(newVal);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (showSuggestions && suggestions.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestions[0].symbol);
            }
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <Form.Control
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (query.length > 1) setShowSuggestions(true);
                }}
                placeholder={placeholder}
                autoComplete="off"
                required={required}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ListGroup
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 2000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem'
                    }}
                >
                    {suggestions.map((s, idx) => (
                        <ListGroup.Item
                            action
                            key={idx}
                            onClick={() => handleSelect(s.symbol)}
                            className="d-flex justify-content-between align-items-center py-2"
                            style={{ borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid var(--border-color)' }}
                        >
                            <span className="fw-bold">{s.symbol}</span>
                            <small className="text-muted text-truncate ms-2" style={{ maxWidth: '180px', fontSize: '0.8rem' }}>
                                {s.shortname || s.longname || ''}
                            </small>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

export default TickerSearch;
