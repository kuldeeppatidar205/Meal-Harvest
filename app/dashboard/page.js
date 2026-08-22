'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import VerificationBanner from '@/components/VerificationBanner';
import LocationFallbackBar from '@/components/LocationFallbackBar';
import DashboardMap from '@/components/Map/DashboardMap';
import {
  MapPin,
  ListFilter,
  Truck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Heart,
  Phone,
  Navigation,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [location, setLocation] = useState({ lat: 26.9124, lng: 75.7873, name: 'Jaipur' });
  const [donations, setDonations] = useState([]);
  const [needRequests, setNeedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [foodTypeFilter, setFoodTypeFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [radiusKm, setRadiusKm] = useState(50);

  // Route Optimization
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [optimizing, setOptimizing] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('supply'); // 'supply' | 'needs'

  const fetchAll = async (lat, lng, radius) => {
    setLoading(true);
    setError('');
    try {
      const [donRes, reqRes] = await Promise.all([
        fetch(`/api/donations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
        fetch(`/api/requests/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
      ]);
      const donData = await donRes.json();
      const reqData = await reqRes.json();
      setDonations(donData.donations || []);
      setNeedRequests(reqData.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(location.lat, location.lng, radiusKm);
  }, [location, radiusKm]);

  const runRouteOptimizer = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          vehicleCapacity: session?.user?.vehicleCapacity || 50,
        }),
      });
      const data = await res.json();
      if (res.ok) setOptimizedRoutes(data.recommendations || []);
    } catch (err) {
      console.error('Optimizer Error:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleClaim = async (donationId) => {
    if (!session?.user) { setError('Please sign in as an NGO or Volunteer Driver to claim food donations.'); return; }
    if (!['NGO', 'VOLUNTEER'].includes(session.user.role)) { setError('Only verified NGOs or Volunteer Drivers can claim food donations.'); return; }
    if (!session.user.isVerified) { setError('Your account must be verified before claiming.'); return; }
    setSuccess(''); setError('');
    try {
      const res = await fetch('/api/donations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId }),
      });
      const data = await res.json();
      if (res.status === 409) throw new Error(data.error || 'Already claimed by another user!');
      if (!res.ok) throw new Error(data.error || 'Failed to claim donation.');
      setSuccess('Food donation claimed! It is now assigned to you.');
      fetchAll(location.lat, location.lng, radiusKm);
    } catch (err) { setError(err.message); }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    setSuccess(''); setError('');
    try {
      const res = await fetch('/api/donations/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      setSuccess(`Status updated to ${newStatus}!`);
      fetchAll(location.lat, location.lng, radiusKm);
    } catch (err) { setError(err.message); }
  };

  const filteredDonations = donations.filter((item) => {
    if (foodTypeFilter !== 'ALL' && item.foodType !== foodTypeFilter) return false;
    if (urgencyFilter !== 'ALL' && item.urgencyLevel !== urgencyFilter) return false;
    return true;
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading Dashboard...</div>
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
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-500">
              The NGO &amp; Driver Dashboard requires an authenticated NGO or Volunteer account to claim food and optimize routes.
            </p>
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
                Register as NGO / Volunteer
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.user.role === 'PROVIDER') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-md border text-center max-w-md space-y-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl w-fit mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Food Provider Account Detected</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This dashboard is tailored for verified NGOs and Volunteer Drivers claiming and transporting surplus food. As a Food Provider, you can post and manage your surplus food inventory in the Provider Portal.
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
      <VerificationBanner />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              NGO &amp; Driver Dashboard <Sparkles className="w-5 h-5 text-emerald-600" />
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              🍱 Food supply pins · 🙏 Community need pins · Real-time geospatial matching
            </p>
          </div>

          <button
            onClick={runRouteOptimizer}
            disabled={optimizing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            {optimizing ? 'Optimizing Routes...' : 'Run Route Engine'}
          </button>
        </div>

        {/* Location bar */}
        <LocationFallbackBar
          onLocationSelect={(loc) => {
            setLocation(loc);
            fetchAll(loc.lat, loc.lng, radiusKm);
          }}
        />

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center justify-between border border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="font-bold text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center justify-between border border-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="font-bold text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1 col-span-full md:col-auto text-[11px] sm:text-xs">
              <ListFilter className="w-4 h-4 text-emerald-600" /> Filters:
            </span>
            <select
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs border rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Food Types</option>
              <option value="PERISHABLE">Perishable</option>
              <option value="COOKED_MEAL">Cooked Meals</option>
              <option value="NON_PERISHABLE">Non-Perishable</option>
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs border rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Urgency Levels</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
              <option value="HIGH">🟠 HIGH</option>
              <option value="MEDIUM">🟡 MEDIUM</option>
              <option value="LOW">🟢 LOW</option>
            </select>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full md:w-auto px-3 py-2 text-xs border rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
              <option value={100}>Within 100 km</option>
            </select>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2.5 sm:gap-3 text-[11px] font-semibold text-slate-600 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> CRITICAL</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> HIGH</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> MEDIUM</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> LOW</span>
          </div>
        </div>

        {/* Interactive Map — shows both supply and need pins */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-md border border-slate-200">
          <DashboardMap
            center={[location.lat, location.lng]}
            zoom={12}
            donations={filteredDonations}
            needRequests={needRequests}
            onClaim={handleClaim}
            onStatusUpdate={handleStatusUpdate}
            currentUserId={session?.user?.id}
            userRole={session?.user?.role}
          />
        </div>

        {/* Route Optimization Output */}
        {optimizedRoutes.length > 0 && (
          <div className="bg-purple-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-amber-300" />
                <h3 className="text-lg font-bold">Driver Route Recommendations</h3>
              </div>
              <span className="text-xs font-bold bg-purple-800 px-3 py-1 rounded-full text-purple-200">
                Each card shows: Pickup ➔ Nearest Needy Recipient
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimizedRoutes.slice(0, 6).map((item, idx) => (
                <div key={item._id} className="bg-purple-950/80 p-4 rounded-xl border border-purple-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md">
                      Priority #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Score: {item.priorityIndex}
                    </span>
                  </div>

                  {/* Pickup Food Info */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">🍱 Pickup: Surplus Food</p>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{item.title}</h4>
                    <div className="text-xs text-purple-200 space-y-0.5">
                      <div>📍 Driver to Pickup: <strong>{item.distanceFromDriverKm} km</strong></div>
                      <div>⏳ Expires in: <strong>{item.timeRemainingHours}h</strong></div>
                      <div>📦 Qty: <strong>{item.quantity} kg</strong> · Match: <strong>{(item.capacityMatchRatio * 100).toFixed(0)}%</strong></div>
                    </div>
                  </div>

                  {/* Nearest Needy Recipient */}
                  {item.nearestRecipient ? (
                    <div className="bg-pink-900/60 rounded-lg p-3 space-y-1 border border-pink-700/40">
                      <p className="text-[10px] uppercase tracking-wider text-pink-400 font-bold">🙏 Nearest Dropoff: Community Need</p>
                      <p className="font-bold text-sm text-white line-clamp-1">{item.nearestRecipient.recipientName}</p>
                      <div className="text-xs text-pink-200 space-y-0.5">
                        <div>🏠 {item.nearestRecipient.organizationType?.replace(/_/g, ' ')}</div>
                        <div>🍽️ Needs: <strong>{item.nearestRecipient.servingsNeeded} servings</strong></div>
                        <div>📞 <strong>{item.nearestRecipient.contactPerson}</strong> · {item.nearestRecipient.contactPhone}</div>
                        <div>📍 <strong>{item.nearestRecipient.distanceFromPickupKm} km</strong> from pickup</div>
                        <div className="text-[10px] text-pink-300 line-clamp-1">🗺 {item.nearestRecipient.address}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-800/30 rounded-lg p-2 text-center text-[11px] text-purple-300 border border-purple-700/20">
                      No open need requests nearby — check back soon
                    </div>
                  )}

                  {/* Total Route */}
                  <div className="flex items-center justify-between text-[11px] text-purple-300 border-t border-purple-700/30 pt-2">
                    <span>🚚 Total Route: <strong className="text-white">{item.totalRouteKm} km</strong></span>
                  </div>

                  {item.status === 'AVAILABLE' && (
                    <button
                      onClick={() => handleClaim(item._id)}
                      className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      ✅ Claim &amp; Start Route
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Supply vs Needs List */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('supply')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                activeTab === 'supply'
                  ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              🍱 Food Supply ({filteredDonations.length})
            </button>
            <button
              onClick={() => setActiveTab('needs')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                activeTab === 'needs'
                  ? 'bg-pink-50 text-pink-800 border-b-2 border-pink-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              🙏 Community Needs ({needRequests.length})
            </button>
          </div>

          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading nearby data...</div>
            ) : activeTab === 'supply' ? (
              /* FOOD SUPPLY LIST */
              filteredDonations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                  No food listings found within this radius matching your filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDonations.map((item) => {
                    const isClaimedByMe =
                      item.claimedBy?._id === session?.user?.id ||
                      item.claimedBy === session?.user?.id;

                    return (
                      <div
                        key={item._id}
                        className="p-4 border rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full text-white ${
                                item.urgencyLevel === 'CRITICAL'
                                  ? 'bg-red-600'
                                  : item.urgencyLevel === 'HIGH'
                                  ? 'bg-orange-500'
                                  : item.urgencyLevel === 'MEDIUM'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                            >
                              {item.urgencyLevel}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
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

                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                          <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-1 text-xs text-slate-700">
                            <div>Qty: <strong>{item.quantity} kg</strong></div>
                            <div>Type: <strong>{item.foodType}</strong></div>
                            <div>Dist: <strong>{item.distanceKm ? `${item.distanceKm} km` : 'N/A'}</strong></div>
                            <div>Provider: <strong>{item.providerId?.name || 'Verified'}</strong></div>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {new Date(item.expiryTime).toLocaleString()}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          {item.status === 'AVAILABLE' && (
                            <button
                              onClick={() => handleClaim(item._id)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                            >
                              Claim Food Inventory
                            </button>
                          )}
                          {isClaimedByMe && item.status === 'CLAIMED' && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, 'IN_TRANSIT')}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
                            >
                              🚚 Mark IN_TRANSIT
                            </button>
                          )}
                          {isClaimedByMe && item.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, 'DELIVERED')}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                            >
                              ✅ Mark DELIVERED
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* COMMUNITY NEEDS LIST */
              needRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                  No open food need requests found nearby. Share the{' '}
                  <a href="/request-food" className="text-pink-600 underline font-semibold">
                    Request Food
                  </a>{' '}
                  page link with people in need.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {needRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 border border-pink-100 rounded-2xl bg-pink-50/30 hover:bg-white hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full text-white ${
                            req.urgencyLevel === 'CRITICAL'
                              ? 'bg-pink-600'
                              : req.urgencyLevel === 'HIGH'
                              ? 'bg-purple-600'
                              : req.urgencyLevel === 'MEDIUM'
                              ? 'bg-violet-500'
                              : 'bg-indigo-500'
                          }`}
                        >
                          {req.urgencyLevel}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            req.status === 'OPEN'
                              ? 'bg-pink-100 text-pink-800'
                              : req.status === 'MATCHED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">🙏 {req.recipientName}</h4>
                        <p className="text-xs text-slate-500">{req.organizationType?.replace(/_/g, ' ')}</p>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <strong>{req.contactPerson}</strong> · {req.contactPhone}
                        </div>
                        <div>🍽️ Needs: <strong>{req.servingsNeeded} servings</strong> · Diet: <strong>{req.dietaryPreference}</strong></div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <MapPin className="w-3 h-3" />
                          {req.location?.address}
                        </div>
                        {req.distanceKm && (
                          <div className="text-[11px] text-purple-700 font-semibold">
                            <Navigation className="w-3 h-3 inline mr-1" />
                            {req.distanceKm} km from your location
                          </div>
                        )}
                        {req.notes && (
                          <p className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-1">
                            💬 {req.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
