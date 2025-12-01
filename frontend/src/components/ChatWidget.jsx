import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

const ChatWidget = ({ show, onHide }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { text: input, sender: "user" };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setLoading(true);

        try {
            const response = await axios.post('/api/chat', { query: currentInput });
            const botMsg = { text: response.data.response, sender: "bot" };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error", error);
            const errorMsg = { text: "Sorry, I couldn't process that.", sender: "bot" };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-chat-dots me-2"></i>
                    Portfolio Assistant
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                {/* Messages */}
                <div className="flex-grow-1 overflow-auto mb-3" style={{ minHeight: 0 }}>
                    {messages.length === 0 && (
                        <div className="text-center text-muted mt-5">
                            <i className="bi bi-chat-square-text fs-1 mb-3 d-block"></i>
                            <p>Ask me about stock prices or your portfolio value</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                            <div
                                className={`px-3 py-2 rounded ${msg.sender === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-light text-dark border'
                                    }`}
                                style={{ maxWidth: '75%' }}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="d-flex justify-content-start mb-3">
                            <div className="bg-light text-dark border px-3 py-2 rounded">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                    >
                        <i className="bi bi-send"></i>
                    </Button>
                </InputGroup>
            </Modal.Body>
        </Modal>
    );
};

export default ChatWidget;
