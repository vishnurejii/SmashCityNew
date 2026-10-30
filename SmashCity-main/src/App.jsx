import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BurgerShowcase from './components/BurgerShowcase';
import Menu from './components/Menu';
import Hook from './components/Hook';
import Locations from './components/Locations';
import Footer from './components/Footer';

// Admin & Delivery Boy Portals
import AdminPortal from './components/AdminPortal';
import DeliveryPortal from './components/DeliveryPortal';

// State Providers and Modals
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import UserProfileModal from './components/UserProfileModal';

function getInitialRoute() {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/delivery') || path.startsWith('/rider')) return 'delivery';
  }
  return 'store';
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    const path = route === 'admin' ? '/admin' : route === 'delivery' ? '/delivery' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col selection:bg-accent selection:text-black w-full overflow-x-hidden relative bg-background text-text-primary">
          {currentRoute === 'admin' ? (
            <AdminPortal onNavigate={navigateTo} />
          ) : currentRoute === 'delivery' ? (
            <DeliveryPortal onNavigate={navigateTo} />
          ) : (
            <>
              <Navbar onNavigate={navigateTo} />
              <main className="flex-grow">
                <Hero />
                <BurgerShowcase />
                <Hook />
                <Menu />
                <Locations />
              </main>
              <Footer onNavigate={navigateTo} />
            </>
          )}

          {/* Interactive Full-Stack Overlays */}
          <CartDrawer />
          <CheckoutModal />
          <AuthModal onNavigate={navigateTo} />
          <OrderTrackingModal />
          <OrderHistoryModal />
          <UserProfileModal />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
