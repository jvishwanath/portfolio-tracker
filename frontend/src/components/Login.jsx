import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Form, Button, Alert, Tab, Tabs } from 'react-bootstrap';

const Login = () => {
    const { login, signup, guestLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('login');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (activeTab === 'login') {
                await login(email, password);
            } else {
                await signup(email, password);
                // Auto login after signup or show success message
                await login(email, password);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }} className="shadow">
                <Card.Body>
                    <div className="text-center mb-4">
                        <img
                            src="/logo.png"
                            alt="NVest AI Logo"
                            style={{ height: '120px' }}
                        />
                    </div>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3"
                    >
                        <Tab eventKey="login" title="Login">
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <Button className="w-100" type="submit">
                                    Login
                                </Button>
                            </Form>
                        </Tab>
                        <Tab eventKey="signup" title="Sign Up">
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <Button className="w-100" type="submit">
                                    Sign Up
                                </Button>
                            </Form>
                        </Tab>
                    </Tabs>

                    <div className="text-center mt-3">
                        <hr />
                        <Button variant="outline-secondary" onClick={guestLogin} className="w-100">
                            Continue as Guest
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;
