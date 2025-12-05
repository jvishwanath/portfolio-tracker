import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ theme, collapsed, toggleTheme, logout, user, setShowChat }) => {
    const location = useLocation();
    const activeKey = location.pathname;

    const linkStyle = {
        color: theme === 'dark' ? '#e0e0e0' : '#333',
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        textDecoration: 'none',
        transition: 'background-color 0.2s, color 0.2s',
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        width: '100%',
        textAlign: 'left'
    };

    const activeLinkStyle = {
        ...linkStyle,
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        color: theme === 'dark' ? '#fff' : '#000',
        fontWeight: '600',
    };

    const hoverStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    };

    return (
        <div
            className="d-flex flex-column shadow-sm"
            style={{
                width: collapsed ? '80px' : '250px',
                height: '100vh',
                position: 'fixed',
                top: '0',
                left: '0',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                borderRight: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
                zIndex: 1000,
                paddingTop: '20px',
                transition: 'width 0.3s ease',
                overflowX: 'hidden'
            }}
        >
            <div className={`px-3 mb-4 d-flex align-items-center ${collapsed ? 'justify-content-center' : ''}`} style={{ height: '40px' }}>
                <img
                    src="/logo.png"
                    alt="NVest AI Logo"
                    style={{ height: '32px', marginRight: collapsed ? '0' : '10px' }}
                />
                {!collapsed && (
                    <span style={{ fontWeight: '600', fontSize: '1.2rem', color: theme === 'dark' ? '#fff' : '#000', whiteSpace: 'nowrap' }}>
                        NVest AI
                    </span>
                )}
            </div>

            <Nav className="flex-column w-100 px-2 flex-grow-1">
                <Link
                    to="/"
                    style={activeKey === '/' ? activeLinkStyle : linkStyle}
                    className="sidebar-link"
                    title={collapsed ? "Dashboard" : ""}
                >
                    <i className={`bi bi-house-door ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>Dashboard</span>}
                </Link>
                <Link
                    to="/watchlist"
                    style={activeKey === '/watchlist' ? activeLinkStyle : linkStyle}
                    className="sidebar-link"
                    title={collapsed ? "Watchlist" : ""}
                >
                    <i className={`bi bi-eye ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>Watchlist</span>}
                </Link>
                <Link
                    to="/research"
                    style={activeKey === '/research' ? activeLinkStyle : linkStyle}
                    className="sidebar-link"
                    title={collapsed ? "Research" : ""}
                >
                    <i className={`bi bi-search ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>Research</span>}
                </Link>
                <button
                    onClick={() => setShowChat(prev => !prev)}
                    style={linkStyle}
                    className="sidebar-link"
                    title={collapsed ? "AI Assistant" : ""}
                >
                    <i className={`bi bi-chat-dots ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>Assistant</span>}
                </button>
            </Nav>

            {/* Bottom Section */}
            <div className="mt-auto px-2 pb-3">
                <hr style={{ borderColor: theme === 'dark' ? '#444' : '#eee' }} />

                {/* User Profile (Static for now) */}
                <div
                    style={{ ...linkStyle, cursor: 'default', opacity: 0.8 }}
                    title={collapsed ? (user?.email && user.email.startsWith('guest_') ? 'Guest User' : user?.email) : ""}
                >
                    <i className={`bi bi-person-circle ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && (
                        <span className="text-truncate" style={{ maxWidth: '150px' }}>
                            {user?.email && user.email.startsWith('guest_') ? 'Guest User' : user?.email}
                        </span>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    style={linkStyle}
                    className="sidebar-link"
                    title={collapsed ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode` : ""}
                >
                    <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'} ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    style={{ ...linkStyle, color: '#dc3545' }}
                    className="sidebar-link text-danger"
                    title={collapsed ? "Logout" : ""}
                >
                    <i className={`bi bi-box-arrow-right ${collapsed ? '' : 'me-3'}`} style={{ fontSize: '1.2rem' }}></i>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
