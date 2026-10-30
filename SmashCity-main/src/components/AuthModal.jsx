import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Bike,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ onNavigate }) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    authRoleChoice,
    setAuthRoleChoice,
    login,
    register
  } = useAuth();

  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'delivery' | 'admin'

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    rider_name: 'Alex Swift',
    rider_phone: '+1 555-8391',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync role choice when opening modal
  useEffect(() => {
    if (authRoleChoice) {
      setSelectedRole(authRoleChoice);
    }
  }, [authRoleChoice, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const fillDemoAdmin = () => {
    setFormData((prev) => ({
      ...prev,
      username: 'admin',
      password: 'admin123',
    }));
    setError('');
  };

  const fillDemoRider = () => {
    setFormData((prev) => ({
      ...prev,
      username: 'rider',
      password: 'rider123',
      rider_name: 'Alex Swift',
      rider_phone: '+1 555-8391',
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (selectedRole === 'admin') {
        // Admin / Operations Login
        const res = await login(
          {
            username: formData.username || 'admin',
            password: formData.password,
          },
          'admin'
        );
        setSuccessMsg('Admin access verified. Launching console...');
        setTimeout(() => {
          closeAuthModal();
          if (onNavigate) onNavigate('admin');
        }, 600);
      } else if (selectedRole === 'delivery') {
        // Delivery Partner Login
        // Persist rider name and phone for dispatch receipts
        if (formData.rider_name) {
          localStorage.setItem('smashcity_rider_name', formData.rider_name.trim());
        }
        if (formData.rider_phone) {
          localStorage.setItem('smashcity_rider_phone', formData.rider_phone.trim());
        }

        const res = await login(
          {
            username: formData.username || 'rider',
            password: formData.password,
          },
          'delivery'
        );
        setSuccessMsg('Rider authenticated. Opening delivery portal...');
        setTimeout(() => {
          closeAuthModal();
          if (onNavigate) onNavigate('delivery');
        }, 600);
      } else {
        // Customer Login / Register
        if (authModalTab === 'login') {
          await login(
            {
              username: formData.username || formData.email,
              password: formData.password,
            },
            'customer'
          );
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            closeAuthModal();
          }, 500);
        } else {
          if (!formData.username) throw new Error('Username is required');
          if (!formData.email) throw new Error('Email is required');
          if (!formData.password || formData.password.length < 6)
            throw new Error('Password must be at least 6 characters');

          await register(formData);
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            closeAuthModal();
          }, 500);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#121212] border border-[#2b2b2b] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        style={{
          boxShadow:
            selectedRole === 'admin'
              ? '0 0 60px rgba(239, 68, 68, 0.2)'
              : selectedRole === 'delivery'
              ? '0 0 60px rgba(245, 158, 11, 0.2)'
              : '0 0 60px rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 3-Way Role Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2.5">
            Select Account Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#090909] rounded-xl border border-[#252525]">
            {/* Customer Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('customer');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              <span>Customer</span>
            </button>

            {/* Delivery Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('delivery');
                setError('');
                setSuccessMsg('');
                if (!formData.username) {
                  setFormData((p) => ({ ...p, username: 'rider', password: 'rider123' }));
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'delivery'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bike className="w-4 h-4 mb-0.5" />
              <span>Delivery</span>
            </button>

            {/* Admin Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setError('');
                setSuccessMsg('');
                if (!formData.username) {
                  setFormData((p) => ({ ...p, username: 'admin', password: 'admin123' }));
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-0.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Dynamic Header based on Role */}
        <div className="text-center mb-6">
          {selectedRole === 'customer' && (
            <>
              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.25em]">
                SmashCity Member Portal
              </span>
              <h2 className="text-3xl sm:text-4xl font-chunky tracking-wide text-white mt-1">
                {authModalTab === 'login' ? 'WELCOME BACK' : 'JOIN THE CREW'}
              </h2>
              <p className="font-['Caveat'] text-gray-400 text-xl font-bold mt-1">
                {authModalTab === 'login'
                  ? 'Log in to track orders and skip the line'
                  : 'Sign up to earn points and save your delivery details'}
              </p>
            </>
          )}

          {selectedRole === 'delivery' && (
            <>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                <Bike className="w-3.5 h-3.5" /> Courier & Rider Access
              </div>
              <h2 className="text-3xl sm:text-4xl font-chunky tracking-wide text-white mt-1">
                DELIVERY PARTNER
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Sign in to manage live delivery pickups, view customer maps, and verify delivery OTPs.
              </p>
            </>
          )}

          {selectedRole === 'admin' && (
            <>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/15 border border-red-500/40 rounded-full text-red-300 text-[10px] font-black uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Operations & Kitchen
              </div>
              <h2 className="text-3xl sm:text-4xl font-chunky tracking-wide text-white mt-1">
                ADMIN CONSOLE
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Sign in with manager credentials to dispatch orders, assign riders, and update kitchen status.
              </p>
            </>
          )}
        </div>

        {/* Customer Subtab Switcher (Log In vs Sign Up) */}
        {selectedRole === 'customer' && (
          <div className="flex border-b border-[#262626] mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setError('');
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                authModalTab === 'login'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setError('');
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                authModalTab === 'register'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Quick Demo Autofill Helpers for Admin & Delivery */}
        {selectedRole === 'admin' && (
          <div className="mb-4 p-2.5 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="text-gray-300">
              <span className="font-bold text-red-300 block">Demo Admin:</span>
              <span className="text-[11px] text-gray-400 font-mono">admin / admin123</span>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/40 rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              Auto-Fill
            </button>
          </div>
        )}

        {selectedRole === 'delivery' && (
          <div className="mb-4 p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="text-gray-300">
              <span className="font-bold text-amber-300 block">Demo Rider:</span>
              <span className="text-[11px] text-gray-400 font-mono">rider / rider123</span>
            </div>
            <button
              type="button"
              onClick={fillDemoRider}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-500/40 rounded text-[11px] font-bold cursor-pointer transition-colors"
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-950/60 border border-green-500/50 rounded-lg flex items-start gap-2 text-green-200 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Registration Fields */}
          {selectedRole === 'customer' && authModalTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+1 555-0199"
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@example.com"
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Delivery Rider Name & Phone (shown when Delivery role is active) */}
          {selectedRole === 'delivery' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Rider Name
                </label>
                <input
                  type="text"
                  name="rider_name"
                  value={formData.rider_name}
                  onChange={handleChange}
                  placeholder="Alex Swift"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3 py-2 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Rider Phone
                </label>
                <input
                  type="tel"
                  name="rider_phone"
                  value={formData.rider_phone}
                  onChange={handleChange}
                  placeholder="+1 555-8391"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3 py-2 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Username / Identifier */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              {selectedRole === 'admin'
                ? 'Admin Username'
                : selectedRole === 'delivery'
                ? 'Rider Username or Email'
                : authModalTab === 'login'
                ? 'Username or Email'
                : 'Username'}
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder={
                  selectedRole === 'admin'
                    ? 'admin'
                    : selectedRole === 'delivery'
                    ? 'rider or alex@smashcity.com'
                    : authModalTab === 'login'
                    ? 'burgerlover or you@email.com'
                    : 'smashboss'
                }
                className={`w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:border-red-500'
                    : selectedRole === 'delivery'
                    ? 'focus:border-amber-400'
                    : 'focus:border-accent'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:border-red-500'
                    : selectedRole === 'delivery'
                    ? 'focus:border-amber-400'
                    : 'focus:border-accent'
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-6 font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
              selectedRole === 'admin'
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                : selectedRole === 'delivery'
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                : 'bg-accent hover:bg-white text-black shadow-accent/20'
            }`}
          >
            {loading ? (
              'Authenticating...'
            ) : selectedRole === 'admin' ? (
              <>
                <ShieldCheck className="w-4 h-4" /> Enter Admin Console
              </>
            ) : selectedRole === 'delivery' ? (
              <>
                <Bike className="w-4 h-4" /> Launch Rider Portal
              </>
            ) : authModalTab === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Note for Customers */}
        {selectedRole === 'customer' && (
          <div className="mt-6 text-center text-xs text-gray-400">
            {authModalTab === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('register');
                    setError('');
                  }}
                  className="text-accent font-bold hover:underline cursor-pointer"
                >
                  Sign Up Now
                </button>
              </p>
            ) : (
              <p>
                Already part of the crew?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setError('');
                  }}
                  className="text-accent font-bold hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
