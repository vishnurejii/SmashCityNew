import React, { useState } from 'react';
import { Clock, Menu as MenuIcon, X, ShoppingBag, User as UserIcon, LogOut, Package, MapPin, ShieldCheck, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = ({ onNavigate }) => {
  const { user, userRole, isAuthenticated, logout, openAuthModal, openProfileModal, openOrdersModal } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdminUser = Boolean(userRole === 'admin' || user?.is_staff || user?.username === 'admin');
  const isDeliveryUser = Boolean(userRole === 'delivery' || user?.username === 'rider');

  return (
    <header className="absolute top-0 w-full z-50">
      <div className="w-full px-8 md:px-16 h-24 flex items-center justify-between">
        
        {/* Left: Timing */}
        <div className="hidden sm:flex items-start gap-3 mt-4">
          <Clock className="w-5 h-5 text-white mt-0.5" />
          <div className="flex flex-col">
            <span className="text-white text-sm font-semibold tracking-wide">Today 10.00 am - 7.00 pm</span>
            <span className="text-white/50 text-[10px] tracking-widest uppercase mt-0.5">Working Hours</span>
          </div>
        </div>
        
        {/* Right Nav */}
        <div className="flex items-center gap-6 md:gap-8 mt-4">
          <nav className="hidden md:flex items-center gap-8 font-['Caveat'] text-3xl text-white">
            <a href="#menu" className="hover:text-accent transition-colors">Our Menu</a>
            <a href="#contact" className="hover:text-accent transition-colors">Contact Us</a>
            <button 
              onClick={openCart} 
              className="hover:text-accent transition-colors cursor-pointer text-left font-['Caveat'] text-3xl"
            >
              Order Now
            </button>
          </nav>

          {/* Cart Icon Button with Live Counter Badge */}
          <button
            id="navbar-cart-btn"
            onClick={openCart}
            className="relative p-2 text-white hover:text-accent transition-colors cursor-pointer"
            aria-label="View shopping bag"
          >
            <ShoppingBag className="w-7 h-7" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-black font-display font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Dropdown */}
          <div className="relative hidden sm:block">
            {isAuthenticated ? (
              <div>
                <button
                  id="navbar-user-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface/80 border border-border hover:border-accent rounded-full text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center font-bold text-xs">
                    {(user.first_name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <span>{user.first_name || user.username}</span>
                  {isAdminUser && (
                    <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-500/30 text-[9px] rounded font-bold">
                      Admin
                    </span>
                  )}
                  {isDeliveryUser && (
                    <span className="px-1.5 py-0.2 bg-amber-950 text-accent border border-accent/30 text-[9px] rounded font-bold">
                      Rider
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div 
                    onClick={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-52 bg-[#141414] border-2 border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <button
                      id="navbar-myorders-btn"
                      onClick={openOrdersModal}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-accent hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-accent" /> My Orders
                    </button>
                    <button
                      id="navbar-profile-btn"
                      onClick={openProfileModal}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-accent hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-accent" /> Profile & Addresses
                    </button>

                    {/* Only show Staff / Rider Portal link if the logged in user actually has that role */}
                    {onNavigate && isAdminUser && (
                      <>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => onNavigate('admin')}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:text-white hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-red-400" /> Admin Console
                        </button>
                      </>
                    )}

                    {onNavigate && isDeliveryUser && (
                      <>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => onNavigate('delivery')}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent hover:text-white hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer"
                        >
                          <Bike className="w-4 h-4 text-accent" /> Delivery Rider
                        </button>
                      </>
                    )}

                    <div className="border-t border-border my-1" />
                    <button
                      id="navbar-logout-btn"
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-signin-btn"
                onClick={() => openAuthModal('login')}
                className="px-4 py-1.5 bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-black font-bold uppercase tracking-widest text-xs rounded transition-all duration-300 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
          
          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-accent transition-colors md:hidden p-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <MenuIcon className="w-8 h-8" />}
          </button>
        </div>
        
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A]/95 border-b border-border backdrop-blur-md px-8 py-6 space-y-4">
          <nav className="flex flex-col gap-4 font-['Caveat'] text-3xl text-white">
            <a 
              href="#menu" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-accent transition-colors"
            >
              Our Menu
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-accent transition-colors"
            >
              Contact Us
            </a>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              className="text-left hover:text-accent transition-colors font-['Caveat'] text-3xl"
            >
              Order Now ({itemCount})
            </button>
          </nav>

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); openOrdersModal(); }}
                  className="w-full py-2.5 bg-surface text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 border border-border"
                >
                  <Package className="w-4 h-4 text-accent" /> My Orders
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); openProfileModal(); }}
                  className="w-full py-2.5 bg-surface text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 border border-border"
                >
                  <UserIcon className="w-4 h-4 text-accent" /> Profile & Addresses
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="w-full py-2.5 bg-red-950/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
                className="w-full py-3 bg-accent text-black font-bold uppercase tracking-widest text-xs rounded"
              >
                Sign In / Join Crew
              </button>
            )}

            {onNavigate && isAdminUser && (
              <div className="pt-2 border-t border-[#222]">
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin'); }}
                  className="w-full py-2.5 bg-red-950/40 text-red-300 border border-red-500/40 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" /> Return to Admin Console
                </button>
              </div>
            )}
            {onNavigate && isDeliveryUser && (
              <div className="pt-2 border-t border-[#222]">
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('delivery'); }}
                  className="w-full py-2.5 bg-accent/15 text-accent border border-accent/40 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2"
                >
                  <Bike className="w-4 h-4 text-accent" /> Return to Delivery Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
