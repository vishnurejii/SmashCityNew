import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('smashcity_auth_token'));
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState(() => localStorage.getItem('smashcity_user_role') || 'customer');
  const [authRoleChoice, setAuthRoleChoice] = useState('customer');

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' or 'register'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  // Active tracking order number
  const [trackingOrderNumber, setTrackingOrderNumber] = useState(null);

  // Check current user if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        if (userData?.is_staff || userData?.username === 'admin') {
          setUserRole('admin');
          localStorage.setItem('smashcity_user_role', 'admin');
        } else if (userData?.username === 'rider') {
          setUserRole('delivery');
          localStorage.setItem('smashcity_user_role', 'delivery');
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        localStorage.removeItem('smashcity_auth_token');
        localStorage.removeItem('smashcity_user_role');
        setToken(null);
        setUser(null);
        setUserRole('customer');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (credentials, explicitRole = null) => {
    const res = await authApi.login(credentials);
    localStorage.setItem('smashcity_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);

    let assignedRole = explicitRole;
    if (!assignedRole) {
      if (res.user?.is_staff || res.user?.username === 'admin') assignedRole = 'admin';
      else if (res.user?.username === 'rider') assignedRole = 'delivery';
      else assignedRole = 'customer';
    }
    setUserRole(assignedRole);
    localStorage.setItem('smashcity_user_role', assignedRole);

    setIsAuthModalOpen(false);
    return res;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    localStorage.setItem('smashcity_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setUserRole('customer');
    localStorage.setItem('smashcity_user_role', 'customer');
    setIsAuthModalOpen(false);
    return res;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('smashcity_auth_token');
      localStorage.removeItem('smashcity_user_role');
      setToken(null);
      setUser(null);
      setUserRole('customer');
      setIsProfileModalOpen(false);
      setIsOrdersModalOpen(false);
    }
  };

  const openAuthModal = (tab = 'login', role = 'customer') => {
    setAuthModalTab(tab);
    setAuthRoleChoice(role);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const openOrdersModal = () => setIsOrdersModalOpen(true);
  const closeOrdersModal = () => setIsOrdersModalOpen(false);

  const openTracking = (orderNumber) => setTrackingOrderNumber(orderNumber);
  const closeTracking = () => setTrackingOrderNumber(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        setUserRole,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        setUser,
        isAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        authRoleChoice,
        setAuthRoleChoice,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        isOrdersModalOpen,
        openOrdersModal,
        closeOrdersModal,
        trackingOrderNumber,
        openTracking,
        closeTracking,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
