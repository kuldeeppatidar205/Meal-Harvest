'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, AlertCircle, Navigation, CheckCircle2 } from 'lucide-react';

export default function LocationFallbackBar({ onLocationSelect, defaultLocation = null }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocationName, setCurrentLocationName] = useState('Detecting location...');
  const [gpsDenied, setGpsDenied] = useState(false);
  const [coords, setCoords] = useState(defaultLocation || { lat: 26.9124, lng: 75.7873 }); // Default Jaipur

  // Attempt auto-detecting user location on initial mount
  useEffect(() => {
    detectBrowserLocation();
  }, []);

  const detectBrowserLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setGpsDenied(true);
      setError('Browser Geolocation is not supported. Please enter your Zip Code or City manually.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsDenied(false);

        let placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        // Reverse geocode to city name using Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          placeName =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.suburb ||
            data?.display_name ||
            placeName;
        } catch {
          // fallback remains formatted coords
        }

        setCurrentLocationName(placeName);

        if (onLocationSelect) {
          onLocationSelect({ lat: latitude, lng: longitude, name: placeName });
        }
        setLoading(false);
      },
      (geoErr) => {
        console.warn('Geolocation denied or failed:', geoErr.message);
        setGpsDenied(true);
        setError('Browser GPS access denied or timed out. Please enter your Zip Code or City below.');
        setCurrentLocationName('Manual Location Required');
        setLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim()
        )}&limit=1`
      );
      const data = await res.json();

      if (!data || data.length === 0) {
        throw new Error('Location not found. Please check your Zip Code or City name.');
      }

      const match = data[0];
      const lat = parseFloat(match.lat);
      const lng = parseFloat(match.lon);
      const placeName = match.display_name;

      setCoords({ lat, lng });
      setCurrentLocationName(placeName);
      setError('');

      if (onLocationSelect) {
        onLocationSelect({ lat, lng, name: placeName });
      }
    } catch (err) {
      setError(err.message || 'Geocoding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-4">
          {/* Current active location status */}
          <div className="flex items-center gap-2 text-xs">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px] font-medium">Active Location</span>
              <span className="font-semibold text-slate-800 text-xs line-clamp-1">{currentLocationName}</span>
            </div>
          </div>

          {/* Auto Detect Button */}
          <button
            type="button"
            onClick={detectBrowserLocation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex-shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            {loading ? 'Locating...' : 'Auto-Detect GPS'}
          </button>
        </div>

        {/* Manual Nominatim Zip Code / City Search Form */}
        <form onSubmit={handleManualSearch} className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zip Code or City (e.g. 302001)"
              className="w-full pl-8 pr-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50 flex-shrink-0"
          >
            Geocode
          </button>
        </form>
      </div>

      {/* Geolocation failure / warning banner */}
      {(gpsDenied || error) && (
        <div className="mt-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs flex items-center gap-2 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{error || 'GPS access denied. Manual Zip Code search activated.'}</span>
        </div>
      )}
    </div>
  );
}
