import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    // Setup axios interceptor for automatic token refresh
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If error is 401 and we haven't already tried to refresh
                if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
                    originalRequest._retry = true;

                    try {
                        // Try to refresh the token
                        const response = await axios.post('/api/auth/refresh', {
                            refresh_token: refreshToken
                        });

                        const newAccessToken = response.data.access_token;

                        // Update stored token
                        localStorage.setItem('token', newAccessToken);
                        setToken(newAccessToken);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                        // Retry the original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        console.error("Token refresh failed", refreshError);
                        logout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [refreshToken]);

    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error("Error fetching user", error);
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setToken(null);
            setRefreshToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await axios.post('/api/auth/token', formData);
        const newToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
    };

    const signup = async (email, password) => {
        await axios.post('/api/auth/signup', { email, password });
    };

    const guestLogin = async () => {
        const response = await axios.post('/api/auth/guest');
        const newToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint (will delete guest data if guest user)
            await axios.post('/api/auth/logout');
        } catch (error) {
            console.error("Logout error", error);
            // Continue with logout even if backend call fails
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, guestLogin, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
