import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup, Modal } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import TickerSearch from '../components/TickerSearch';
import StockChart from '../components/StockChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResearchPage = ({ theme }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
    const [stockInfo, setStockInfo] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newsLoading, setNewsLoading] = useState(false);
    const [error, setError] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [showAiChat, setShowAiChat] = useState(false);

    const fetchStockInfo = async (symbol) => {
        if (!symbol) return;

        setLoading(true);
        setNewsLoading(true);
        setError('');
        // Optional: clear previous data if you want fresh blank state,
        // or keep showing old data until new arrives. User usually expects clear for new search.
        setStockInfo(null);
        setNews([]);

        try {
            // 1. Fetch Info (Fast)
            const infoRes = await axios.get(`/api/stock/${symbol}/info`);
            setStockInfo(infoRes.data);
            setSearchParams({ ticker: symbol });
            localStorage.setItem('last_researched_ticker', symbol);
            setLoading(false); // Show Main Content immediately

            // 2. Fetch News (Background)
            try {
                const newsRes = await axios.get(`/api/stock/${symbol}/news`);
                setNews(newsRes.data.articles || []);
            } catch (newsErr) {
                console.error("News fetch failed", newsErr);
                // We do not set Error state here, just show empty news
            } finally {
                setNewsLoading(false);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch stock information');
            setStockInfo(null);
            setLoading(false);
            setNewsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (ticker) {
            fetchStockInfo(ticker.toUpperCase());
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !stockInfo) return;

        const userMsg = { text: chatInput, sender: 'user' };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const response = await axios.post('/api/chat', {
                query: `Regarding ${stockInfo.symbol} (${stockInfo.name}): ${chatInput}`
            });
            const botMsg = { text: response.data.response, sender: 'bot' };
            setChatMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg = { text: "Sorry, I couldn't process that.", sender: 'bot' };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        const urlTicker = searchParams.get('ticker');
        const cachedTicker = localStorage.getItem('last_researched_ticker');
        const tickerToLoad = urlTicker || cachedTicker;

        if (tickerToLoad) {
            setTicker(tickerToLoad);
            fetchStockInfo(tickerToLoad);
        }
    }, []);

    const formatNumber = (num) => {
        if (!num) return 'N/A';
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toLocaleString()}`;
    };

    const formatPercent = (num) => {
        if (!num) return 'N/A';
        return `${(num * 100).toFixed(2)}%`;
    };

    return (
        <Container className="py-4">
            <Row>
                {/* Left Sidebar - Search */}
                <Col lg={3} className="mb-4">
                    <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-search me-2"></i>
                                Stock Research
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSearch}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Search Stock</Form.Label>
                                    <TickerSearch
                                        value={ticker}
                                        onChange={setTicker}
                                        placeholder="e.g. AAPL or Apple"
                                    />
                                </Form.Group>
                                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Research'}
                                </Button>
                            </Form>

                            {stockInfo && (
                                <div className="mt-4">
                                    <h6 className="text-muted mb-2">Quick Info</h6>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Sector:</span>
                                        <Badge bg="secondary">{stockInfo.sector || 'N/A'}</Badge>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Industry:</span>
                                        <small className="text-end" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stockInfo.industry || 'N/A'}</small>
                                    </div>

                                    <hr />
                                    <h6 className="text-muted mb-2">Key Statistics</h6>
                                    <ListGroup variant="flush" className="small bg-transparent">
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>Market Cap</span>
                                            <strong>{formatNumber(stockInfo.market_cap)}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>P/E Ratio</span>
                                            <strong>{stockInfo.pe_ratio?.toFixed(2) || 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>Div Yield</span>
                                            <strong>{stockInfo.dividend_yield ? `${stockInfo.dividend_yield.toFixed(2)}%` : 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>Beta</span>
                                            <strong>{stockInfo.beta?.toFixed(2) || 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>52W High</span>
                                            <strong>${stockInfo.fifty_two_week_high?.toFixed(2) || 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>52W Low</span>
                                            <strong>${stockInfo.fifty_two_week_low?.toFixed(2) || 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>Volume</span>
                                            <strong>{formatNumber(stockInfo.volume)}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>EPS</span>
                                            <strong>${stockInfo.eps?.toFixed(2) || 'N/A'}</strong>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-0 bg-transparent">
                                            <span>Profit Margin</span>
                                            <strong>{formatPercent(stockInfo.profit_margin)}</strong>
                                        </ListGroup.Item>
                                    </ListGroup>
                                    <div className="mt-3">
                                        <Button
                                            variant={showAiChat ? "primary" : "outline-primary"}
                                            className="w-100"
                                            onClick={() => setShowAiChat(!showAiChat)}
                                        >
                                            <i className="bi bi-chat-dots me-2"></i>
                                            {showAiChat ? 'Close Assistant' : 'Ask AI Assistant'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col lg={9}>
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {loading && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading stock information...</p>
                        </div>
                    )}

                    {!loading && !stockInfo && !error && (
                        <Card className="shadow-sm text-center py-5">
                            <Card.Body>
                                <i className="bi bi-graph-up text-muted" style={{ fontSize: '4rem' }}></i>
                                <h4 className="mt-3">Search for a stock to begin research</h4>
                                <p className="text-muted">Enter a ticker symbol or company name in the search box</p>
                            </Card.Body>
                        </Card>
                    )}

                    {stockInfo && (
                        <>
                            {/* Stock Header */}
                            <Card className="shadow-sm mb-4">
                                <Card.Body className="py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            <h3 className="mb-0 fw-bold">{stockInfo.symbol}</h3>
                                            <span className="text-muted fs-5">|</span>
                                            <h5 className="mb-0 text-muted text-truncate" style={{ maxWidth: '300px' }}>{stockInfo.name}</h5>
                                            {stockInfo.website && (
                                                <a href={stockInfo.website} target="_blank" rel="noopener noreferrer" className="text-muted ms-2" title="Visit Website">
                                                    <i className="bi bi-box-arrow-up-right small"></i>
                                                </a>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <h3 className="mb-0 fw-bold">${stockInfo.current_price?.toFixed(2) || 'N/A'}</h3>
                                            {stockInfo.previous_close && (
                                                <div className={stockInfo.current_price > stockInfo.previous_close ? 'text-success' : 'text-danger'}>
                                                    <span className="fw-bold fs-5">
                                                        {stockInfo.current_price > stockInfo.previous_close ? '+' : ''}
                                                        {((stockInfo.current_price - stockInfo.previous_close) / stockInfo.previous_close * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Chart */}
                            <Card className="shadow-sm mb-4">
                                <Card.Body>
                                    <StockChart ticker={stockInfo.symbol} />
                                </Card.Body>
                            </Card>

                            {/* Description & News */}
                            <Row>
                                <Col lg={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header>
                                            <h5 className="mb-0">About {stockInfo.name}</h5>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <p>{stockInfo.description || 'No description available.'}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col lg={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header>
                                            <h5 className="mb-0">
                                                <i className="bi bi-newspaper me-2"></i>
                                                Latest News
                                            </h5>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {newsLoading ? (
                                                <div className="text-center py-4">
                                                    <Spinner animation="border" size="sm" variant="primary" />
                                                    <p className="text-muted small mt-2">Connecting to Google Search...</p>
                                                </div>
                                            ) : news.length === 0 ? (
                                                <p className="text-muted">No news available</p>
                                            ) : (
                                                <ListGroup variant="flush">
                                                    {news.map((article, idx) => (
                                                        <ListGroup.Item key={idx} className="px-0">
                                                            <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                                <div className="d-flex">
                                                                    {article.thumbnail && (
                                                                        <img
                                                                            src={article.thumbnail}
                                                                            alt=""
                                                                            style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <strong className="d-block mb-1">{article.title || 'No Title Available'}</strong>
                                                                        <small className="text-muted">
                                                                            {article.publisher}
                                                                            {article.published_at && (
                                                                                <> • {
                                                                                    typeof article.published_at === 'number'
                                                                                        ? new Date(article.published_at * 1000).toLocaleDateString()
                                                                                        : (new Date(article.published_at).toString() !== 'Invalid Date' ? new Date(article.published_at).toLocaleDateString() : '')
                                                                                }</>
                                                                            )}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </a>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* AI Chat Modal */}
                            <Modal show={showAiChat} onHide={() => setShowAiChat(false)} size="lg" centered scrollable>
                                <Modal.Header closeButton className="bg-primary text-white">
                                    <Modal.Title className="fs-5">
                                        <i className="bi bi-chat-dots me-2"></i>
                                        Ask AI about {stockInfo.symbol}
                                    </Modal.Title>
                                </Modal.Header>
                                <Modal.Body style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                                    <div className="flex-grow-1 overflow-auto mb-3 p-2" style={{ backgroundColor: 'var(--bg-body)' }}>
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-muted mt-5">
                                                <i className="bi bi-robot fs-1 mb-3 d-block"></i>
                                                <p>Ask me anything about {stockInfo.symbol}!<br />
                                                    <small>e.g., "What are the growth prospects?" or "Should I invest?"</small></p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                                    <div className={`px-3 py-2 rounded ${msg.sender === 'user'
                                                        ? 'bg-primary text-white'
                                                        : (theme === 'dark' ? 'bg-secondary text-white' : 'bg-light text-dark border')
                                                        }`}
                                                        style={{ maxWidth: '80%' }}
                                                    >
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {chatLoading && (
                                            <div className="text-center mt-3">
                                                <Spinner animation="border" size="sm" variant="primary" />
                                            </div>
                                        )}
                                    </div>

                                    <Form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="Ask a question..."
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                disabled={chatLoading}
                                            />
                                            <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
                                                <i className="bi bi-send-fill"></i>
                                            </Button>
                                        </div>
                                    </Form>
                                </Modal.Body>
                            </Modal>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ResearchPage;
