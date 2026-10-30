import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const UserProfileModal = () => {
  const { isProfileModalOpen, closeProfileModal, user, setUser } = useAuth();
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
  });

  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone_number: '',
    street_address: '',
    city: 'Downtown',
    state: 'NY',
    postal_code: '10001',
    delivery_instructions: '',
    is_default: false,
  });

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
        phone_number: user.phone_number || '',
      });
      loadAddresses();
    }
  }, [user, isProfileModalOpen]);

  const loadAddresses = async () => {
    try {
      const data = await authApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  if (!isProfileModalOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const updated = await authApi.updateProfile(profileData);
      setUser(updated);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.street_address.trim()) return;
    setLoading(true);
    try {
      await authApi.createAddress({
        ...newAddress,
        full_name: newAddress.full_name || profileData.full_name,
        phone_number: newAddress.phone_number || profileData.phone_number,
      });
      await loadAddresses();
      setShowAddAddress(false);
      setNewAddress({
        full_name: '',
        phone_number: '',
        street_address: '',
        city: 'Downtown',
        state: 'NY',
        postal_code: '10001',
        delivery_instructions: '',
        is_default: false,
      });
      setMessage('Address added successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await authApi.deleteAddress(id);
      loadAddresses();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#141414] border-2 border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl my-8 text-white max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.15)' }}
      >
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Account Settings</span>
          <h2 className="text-3xl font-chunky tracking-wide text-white mt-1">
            CUSTOMER PROFILE
          </h2>
          <p className="font-['Caveat'] text-gray-400 text-xl font-bold mt-1">
            Manage your personal contact details and saved addresses.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-950/60 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Info Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={profileData.phone_number}
                onChange={(e) => setProfileData((p) => ({ ...p, phone_number: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-surface hover:bg-white hover:text-black text-white border border-border font-bold uppercase tracking-widest text-xs rounded-lg transition-colors"
          >
            Update Profile Information
          </button>
        </form>

        {/* Saved Addresses Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" /> Saved Addresses
            </h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-3 py-1.5 bg-accent/10 border border-accent/30 hover:bg-accent hover:text-black text-accent text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Address
            </button>
          </div>

          {/* New Address Form */}
          {showAddAddress && (
            <form onSubmit={handleCreateAddress} className="p-4 bg-[#0A0A0A] rounded-xl border border-border space-y-3 mb-4">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">New Delivery Address</h4>
              <input
                type="text"
                placeholder="Street Address & Apt"
                required
                value={newAddress.street_address}
                onChange={(e) => setNewAddress((a) => ({ ...a, street_address: e.target.value }))}
                className="w-full bg-[#141414] border border-border rounded px-3 py-2 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                  className="w-full bg-[#141414] border border-border rounded px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                  className="w-full bg-[#141414] border border-border rounded px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Zip / Postal"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress((a) => ({ ...a, postal_code: e.target.value }))}
                  className="w-full bg-[#141414] border border-border rounded px-3 py-2 text-xs text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Delivery instructions (optional)"
                value={newAddress.delivery_instructions}
                onChange={(e) => setNewAddress((a) => ({ ...a, delivery_instructions: e.target.value }))}
                className="w-full bg-[#141414] border border-border rounded px-3 py-2 text-xs text-white"
              />
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress((a) => ({ ...a, is_default: e.target.checked }))}
                  className="accent-[#FFD700]"
                />
                Set as default delivery address
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-accent text-black font-bold uppercase tracking-wider text-xs rounded hover:bg-white"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 bg-surface text-gray-400 font-bold uppercase tracking-wider text-xs rounded hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Addresses List */}
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-xs text-gray-500 font-medium">No saved addresses yet.</p>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3.5 bg-[#0A0A0A] border border-border rounded-xl flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{addr.street_address}</span>
                      {addr.is_default && (
                        <span className="px-1.5 py-0.5 bg-accent/20 text-accent font-bold text-[9px] rounded uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mt-0.5">
                      {addr.city}, {addr.state} {addr.postal_code}
                    </p>
                    {addr.delivery_instructions && (
                      <p className="text-gray-500 text-[11px] mt-1 italic">
                        Note: {addr.delivery_instructions}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
