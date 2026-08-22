'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VerificationBanner from '@/components/VerificationBanner';
import LocationFallbackBar from '@/components/LocationFallbackBar';
import DashboardMap from '@/components/Map/DashboardMap';
import {
  MapPin,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();

  const [location, setLocation] = useState({ lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' });
  const [donations, setDonations] = useState([]);
  const [needRequests, setNeedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request browser location permission on first visit
  useEffect(() => {
    requestBrowserLocation();
  }, []);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      fetchAll(26.9124, 75.7873);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.address) {
            placeName =
              data.address.city || data.address.town || data.address.suburb || data.display_name;
          }
        } catch { /* ignore */ }
        setLocation({ lat: latitude, lng: longitude, name: placeName });
        fetchAll(latitude, longitude);
      },
      () => {
        setError('Location permission denied. Showing Jaipur locality map.');
        fetchAll(26.9124, 75.7873);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchAll = async (lat, lng) => {
    setLoading(true);
    try {
      const [donRes, reqRes] = await Promise.all([
        fetch(`/api/donations/nearby?lat=${lat}&lng=${lng}&radius=50`),
        fetch(`/api/requests/nearby?lat=${lat}&lng=${lng}&radius=50`),
      ]);
      const donData = await donRes.json();
      const reqData = await reqRes.json();
      setDonations(donData.donations || []);
      setNeedRequests(reqData.requests || []);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (newLoc) => {
    setLocation(newLoc);
    fetchAll(newLoc.lat, newLoc.lng);
  };

  const handleClaim = async (donationId) => {
    if (!session?.user) { setError('Please sign in as an NGO or Volunteer Driver to claim food donations.'); return; }
    if (!['NGO', 'VOLUNTEER'].includes(session.user.role)) { setError('Only verified NGOs or Volunteer Drivers can claim food surplus listings.'); return; }
    if (!session.user.isVerified) { setError('Your account must be verified before claiming.'); return; }
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/donations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId }),
      });
      const data = await res.json();
      if (res.status === 409) throw new Error(data.error || 'Already claimed by another user!');
      if (!res.ok) throw new Error(data.error || 'Failed to claim donation.');
      setSuccess('Food donation claimed successfully!');
      fetchAll(location.lat, location.lng);
    } catch (err) { setError(err.message); }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/donations/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      setSuccess(`Status updated to ${newStatus}!`);
      fetchAll(location.lat, location.lng);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <VerificationBanner />

      {/* ── HERO SECTION ── */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/50">
        <div className="max-w-5xl mx-auto text-center space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Real-Time Geospatial Food Rescue Platform
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight sm:leading-tight">
            Bridging Surplus Food to{' '}
            <span className="text-emerald-400">Community Need</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Connecting food providers with verified NGOs and volunteer drivers in real time using geospatial indexing, atomic claim protection, and algorithmic route optimization.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            {/* PROVIDER: post food, see their listings */}
            {session?.user?.role === 'PROVIDER' && (
              <Link
                href="/provider"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Post Surplus Inventory
              </Link>
            )}

            {/* NGO / VOLUNTEER: go to their dashboard */}
            {(session?.user?.role === 'NGO' || session?.user?.role === 'VOLUNTEER') && (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> NGO &amp; Volunteer Dashboard
              </Link>
            )}

            {/* Request Food: hidden from PROVIDER */}
            {session?.user?.role !== 'PROVIDER' && (
              <Link
                href="/request-food"
                className="w-full sm:w-auto px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" /> I Need Food Support
              </Link>
            )}

            {/* Not logged in: encourage registration */}
            {!session?.user && (
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                Register as NGO / Provider
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── LIVE MAP SECTION ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-4">
        {/* Map header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
              Live Geospatial Map
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              🍱 Food supply pins &amp; 🙏 Community need pins — tap any marker for details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 sm:px-3 py-1.5 rounded-xl">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="line-clamp-1">{location.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl">
              🍱 {donations.length} · 🙏 {needRequests.length}
            </div>
          </div>
        </div>

        {/* Fallback bar */}
        <LocationFallbackBar
          defaultLocation={{ lat: location.lat, lng: location.lng }}
          onLocationSelect={handleLocationSelect}
        />

        {/* Error / success toasts */}
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

        {/* Interactive Leaflet Map */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-md border border-slate-200">
          <DashboardMap
            center={[location.lat, location.lng]}
            zoom={12}
            donations={donations}
            needRequests={needRequests}
            onClaim={handleClaim}
            onStatusUpdate={handleStatusUpdate}
            currentUserId={session?.user?.id}
            userRole={session?.user?.role}
          />
        </div>

        {/* Legend */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-center sm:justify-around gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-700">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">🍱 Food:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> &lt;2h</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> 2-6h</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> 6-12h</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> &gt;12h</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">🙏 Needs:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-600 inline-block"></span> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span> High/Med</span>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-10">
        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-black">Ready to Make a Difference?</h2>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Whether you have surplus food, need food, or want to drive — join Meal-Harvest and act now.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
            {session?.user?.role === 'PROVIDER' ? (
              <Link
                href="/provider"
                className="w-full sm:w-auto px-5 py-3 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" /> Post Surplus Inventory <ArrowRight className="w-4 h-4" />
              </Link>
            ) : session?.user?.role === 'NGO' || session?.user?.role === 'VOLUNTEER' ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-5 py-3 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-emerald-600" /> NGO / Volunteer Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/request-food"
                  className="w-full sm:w-auto px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-4 h-4 fill-white" /> I Need Food <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-5 py-3 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
                >
                  Register as Provider / NGO <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Meal-Harvest &copy; {new Date().getFullYear()} — Building Resilient Community Surplus Infrastructure
      </footer>
    </div>
  );
}
