'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import VerificationBanner from '@/components/VerificationBanner';
import LocationPickerMap from '@/components/Map/LocationPickerMap';
import {
  PlusCircle,
  MapPin,
  Clock,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Sparkles,
} from 'lucide-react';

export default function ProviderPortalPage() {
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    foodType: 'PERISHABLE',
    quantity: 10,
    address: '',
    expiryTime: '',
    pickupWindowStart: '',
    pickupWindowEnd: '',
  });

  const [location, setLocation] = useState({ lat: 26.9124, lng: 75.7873 }); // Default Jaipur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myDonations, setMyDonations] = useState([]);
  const [fetchingDonations, setFetchingDonations] = useState(true);

  // Set default dates (expiry = 6h from now, pickup = 1h to 5h from now)
  useEffect(() => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const start = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    const formatForInput = (d) => {
      const iso = d.toISOString();
      return iso.substring(0, 16);
    };

    setFormData((prev) => ({
      ...prev,
      expiryTime: formatForInput(expiry),
      pickupWindowStart: formatForInput(start),
      pickupWindowEnd: formatForInput(end),
    }));
  }, []);

  // Fetch provider's existing listings
  const fetchMyDonations = async () => {
    setFetchingDonations(true);
    try {
      const res = await fetch('/api/donations?providerOnly=true');
      const data = await res.json();
      if (res.ok) {
        setMyDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Failed to fetch provider listings:', err);
    } finally {
      setFetchingDonations(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyDonations();
    }
  }, [session]);

  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Browser Geolocation is not supported by your device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.display_name) {
            setFormData((prev) => ({ ...prev, address: data.display_name }));
          }
        } catch {
          // ignore error
        }
      },
      (err) => {
        setError('GPS detection failed: ' + err.message);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post donation listing.');
      }

      setSuccess('Surplus food inventory posted successfully!');
      setFormData((prev) => ({ ...prev, title: '', description: '', quantity: 10 }));
      fetchMyDonations();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading Portal...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-md border text-center max-w-md space-y-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl w-fit mx-auto">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-500">You must be logged in as a Food Provider to access this portal.</p>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/login"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Register as Food Provider
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'PROVIDER') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-md border text-center max-w-md space-y-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl w-fit mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Food Provider Access Only</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This portal is exclusively for Food Providers to post surplus inventory. As a registered {session.user.role}, you can view, claim, and route food donations on the NGO &amp; Driver Dashboard.
            </p>
            <div className="pt-2">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Go to NGO &amp; Driver Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <VerificationBanner />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Food Provider Portal <Sparkles className="w-5 h-5 text-emerald-600" />
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              List surplus food inventory for verified NGOs &amp; Volunteer pickup
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-semibold">
            <span>Provider: {session.user.name}</span>
          </div>
        </div>

        {/* Verification Lock Check */}
        {!session.user.isVerified ? (
          <div className="p-4 sm:p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Account Verification Required</h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                To prevent fraud and maintain health &amp; safety standards, food surplus postings are restricted to verified providers. Please use the top banner to submit your organization verification credentials.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200 space-y-5 sm:space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Post Surplus Food Inventory</h2>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inventory Title / Meal Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 30 Portions Fresh Pasta & Salad Boxes"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Food Category *</label>
                    <select
                      value={formData.foodType}
                      onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="PERISHABLE">PERISHABLE (Fresh Produce / Dairy)</option>
                      <option value="COOKED_MEAL">COOKED MEAL (Ready to Eat)</option>
                      <option value="NON_PERISHABLE">NON PERISHABLE (Canned / Dry Packaged)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (in kg or servings) *</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Handling Instructions</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Needs refrigerated container for transport"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Expiration & Pickup Window */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiration Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.expiryTime}
                      onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pickup Window Start *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.pickupWindowStart}
                      onChange={(e) => setFormData({ ...formData, pickupWindowStart: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pickup Window End *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.pickupWindowEnd}
                      onChange={(e) => setFormData({ ...formData, pickupWindowEnd: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Pickup Location & Interactive Map */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pickup Location (Click map pin or auto-detect)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectGPS}
                      className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      <Navigation className="w-3 h-3" /> Auto-Detect Location
                    </button>
                  </div>

                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street Address or Venue Landmark"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  {/* Leaflet Location Picker Map */}
                  <LocationPickerMap
                    position={location}
                    onPositionChange={(newPos) => setLocation(newPos)}
                  />
                  <p className="text-[10px] text-slate-400">
                    Selected Coordinates: Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition disabled:opacity-50 mt-4"
                >
                  {loading ? 'Publishing Listing...' : 'Publish Surplus Food Listing'}
                </button>
              </form>
            </div>

            {/* Provider's Active Listings */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" /> My Posted Listings
                </h3>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {myDonations.length} total
                </span>
              </div>

              {fetchingDonations ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading your active listings...</div>
              ) : myDonations.length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  You haven't posted any surplus food inventory yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {myDonations.map((item) => (
                    <div
                      key={item._id}
                      className="p-3.5 border rounded-xl bg-slate-50/50 hover:bg-white transition space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 line-clamp-1">{item.title}</strong>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'CLAIMED'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'IN_TRANSIT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>{item.quantity} kg ({item.foodType})</span>
                        <span className="font-semibold text-amber-700">Urgency: {item.urgencyLevel}</span>
                      </div>

                      {item.claimedBy && (
                        <div className="p-2 bg-blue-50 text-blue-900 rounded-lg text-[11px] border border-blue-100">
                          Claimed by: <strong>{item.claimedBy.name}</strong> ({item.claimedBy.role})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
