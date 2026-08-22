'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import LocationPickerMap from '@/components/Map/LocationPickerMap';
import {
  Heart,
  MapPin,
  Phone,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function RequestFoodPage() {
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    recipientName: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    organizationType: 'INDIVIDUAL',
    servingsNeeded: 25,
    dietaryPreference: 'VEGETARIAN',
    urgencyLevel: 'HIGH',
    address: '',
    notes: '',
  });

  // Default to Jaipur center coordinates
  const [location, setLocation] = useState({ lat: 26.9124, lng: 75.7873 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  const fetchRequests = async () => {
    setFetchingRequests(true);
    try {
      const res = await fetch('/api/requests/nearby?lat=26.9124&lng=75.7873&radius=100');
      const data = await res.json();
      if (res.ok) {
        setMyRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setFetchingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
          // ignore
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
      const res = await fetch('/api/requests', {
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
        throw new Error(data.error || 'Failed to submit food request.');
      }

      setSuccess('Food need request submitted successfully! NGOs & Drivers can now assign nearby surplus food.');
      setFormData((prev) => ({
        ...prev,
        recipientName: '',
        contactPerson: '',
        contactPhone: '',
        notes: '',
      }));
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role === 'PROVIDER') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-md border text-center max-w-md space-y-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl w-fit mx-auto">
              <Heart className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Food Provider Portal</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are signed in as a Food Provider. Providers list surplus food inventory for donation rather than requesting food support. Head over to the Provider Portal to post your meals.
            </p>
            <div className="pt-2">
              <a
                href="/provider"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Go to Food Provider Portal <ArrowRight className="w-4 h-4" />
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Food Need Portal <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 fill-pink-500" />
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Submit food requests for needy individuals, shelters, orphanages, or slum communities
            </p>
          </div>

          <div className="flex items-center gap-2 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-xl text-xs text-pink-800 font-bold">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Community Support Access</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Request Form */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200 space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Request Food Support</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient or Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="e.g. Jaipur Rain Basera Shelter"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Type *</label>
                  <select
                    value={formData.organizationType}
                    onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  >
                    <option value="INDIVIDUAL">Individual Person in Need</option>
                    <option value="SHELTER">Homeless Shelter / Rain Basera</option>
                    <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                    <option value="ORPHANAGE">Orphanage / Senior Care</option>
                    <option value="SLUM_COMMUNITY">Slum Community Feed</option>
                    <option value="OTHER">Other Needy Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 98290 12345"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Needed (servings) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.servingsNeeded}
                    onChange={(e) => setFormData({ ...formData, servingsNeeded: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Preference</label>
                  <select
                    value={formData.dietaryPreference}
                    onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  >
                    <option value="VEGETARIAN">Vegetarian Meals</option>
                    <option value="ANY">Any Food Type</option>
                    <option value="VEGAN">Vegan Meals</option>
                    <option value="DRY_RATIONS">Dry Rations / Uncooked Grain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Immediate Need Today)</option>
                    <option value="HIGH">🟠 HIGH (Needed within a few hours)</option>
                    <option value="MEDIUM">🟡 MEDIUM (Needed by evening)</option>
                    <option value="LOW">🟢 LOW (General ongoing support)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requirements / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Near Jaipur Junction Gate #2. Prefer warm cooked meals for dinner."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              {/* Map Location Picker */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Dropoff Location (Click map pin or auto-detect)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectGPS}
                    className="flex items-center gap-1 text-[11px] text-pink-600 font-bold hover:underline"
                  >
                    <Navigation className="w-3 h-3" /> Auto-Detect Location
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street Address, Landmark, or Station Area"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />

                <LocationPickerMap
                  position={location}
                  onPositionChange={(newPos) => setLocation(newPos)}
                />
                <p className="text-[10px] text-slate-400">
                  Selected Dropoff Coordinates: Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                {loading ? 'Submitting Request...' : 'Submit Food Need Request'}
              </button>
            </form>
          </div>

          {/* Active Need Requests Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-500" /> Open Need Requests
              </h3>
              <span className="text-xs font-semibold bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full">
                {myRequests.length} active
              </span>
            </div>

            {fetchingRequests ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading open food requests...</div>
            ) : myRequests.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                No active food requests found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {myRequests.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 border rounded-xl bg-slate-50/50 hover:bg-white transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 line-clamp-1">{item.recipientName}</strong>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          item.status === 'OPEN'
                            ? 'bg-pink-100 text-pink-800'
                            : item.status === 'MATCHED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {item.organizationType} • Contact: {item.contactPerson} ({item.contactPhone})
                    </p>

                    <div className="text-[11px] text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Need: <strong>{item.servingsNeeded} servings</strong></span>
                      <span className="font-semibold text-pink-600">Urgency: {item.urgencyLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
