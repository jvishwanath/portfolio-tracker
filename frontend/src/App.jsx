import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import ChatWidget from './components/ChatWidget';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import WatchlistPage from './pages/WatchlistPage';
import ResearchPage from './pages/ResearchPage';
import UserProfile from './pages/UserProfile';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';

function MainApp() {
  const { user, logout } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Idle Timeout Ref
  const lastActivity = useRef(Date.now());

  // Paper Trading State (shared across pages)
  const [paperTradingEnabled, setPaperTradingEnabled] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [profitLossPct, setProfitLossPct] = useState(0);
  const [totalAccountValue, setTotalAccountValue] = useState(0);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Track User Activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Auto-logout check
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity.current > 1200000) { // 20 minutes
        console.log("User idle for 20+ minutes. Logging out.");
        logout();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkIdle);
  }, [logout]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTransactionComplete = () => {
    // Trigger dashboard refresh without reloading page
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="d-flex">
        {/* Sidebar */}
        <Sidebar
          theme={theme}
          collapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          toggleTheme={toggleTheme}
          logout={logout}
          user={user}
          setShowChat={setShowChat}
          onRefresh={handleTransactionComplete}
        />

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '250px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.3s ease'
        }}>

          {/* Top Navbar (Hamburger only) */}
          <Navbar
            bg={theme === 'dark' ? 'dark' : 'light'}
            variant={theme === 'dark' ? 'dark' : 'light'}
            expand="lg"
            className="mb-4 px-4 shadow-sm border-bottom"
            sticky="top"
            style={{
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
              borderColor: theme === 'dark' ? '#333' : '#e0e0e0',
              height: '60px' // Fixed height for consistency
            }}
          >
            <Container fluid>
              <Button
                variant="link"
                className="p-0 text-decoration-none"
                onClick={toggleSidebar}
                style={{ color: theme === 'dark' ? '#fff' : '#333' }}
              >
                <i className={`bi bi-${sidebarCollapsed ? 'list' : 'list'}`} style={{ fontSize: '1.5rem' }}></i>
              </Button>
            </Container>
          </Navbar>

          {/* Page Content */}
          <div className="px-4 pb-4">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    paperTradingEnabled={paperTradingEnabled}
                    setPaperTradingEnabled={setPaperTradingEnabled}
                    cashBalance={cashBalance}
                    setCashBalance={setCashBalance}
                    profitLoss={profitLoss}
                    setProfitLoss={setProfitLoss}
                    profitLossPct={profitLossPct}
                    setProfitLossPct={setProfitLossPct}
                    totalAccountValue={totalAccountValue}
                    setTotalAccountValue={setTotalAccountValue}
                    refreshTrigger={refreshTrigger}
                  />
                }
              />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/research" element={<ResearchPage theme={theme} />} />
              <Route path="/profile" element={<UserProfile user={user} theme={theme} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>

        {/* Chat Widget */}
        <ChatWidget
          show={showChat}
          onHide={() => setShowChat(false)}
          onTransactionComplete={handleTransactionComplete}
          theme={theme}
        />
      </div>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  return user ? <MainApp /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
