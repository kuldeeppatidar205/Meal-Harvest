'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUrgencyColor } from '@/lib/geospatial';

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Food supply pin (colored circle based on urgency)
const createUrgencyIcon = (urgencyLevel, status) => {
  const color = getUrgencyColor(urgencyLevel);
  const statusBorder =
    status === 'CLAIMED'
      ? '#3b82f6'
      : status === 'IN_TRANSIT'
      ? '#a855f7'
      : '#ffffff';

  const html = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid ${statusBorder};
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    ">
      🍱
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-urgency-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

// Need request pin (purple heart, pulsing for CRITICAL)
const createNeedIcon = (urgencyLevel) => {
  const isCritical = urgencyLevel === 'CRITICAL';
  const bgColor = isCritical ? '#db2777' : '#7c3aed';
  const ring = isCritical
    ? `box-shadow: 0 0 0 4px rgba(219,39,119,0.3), 0 4px 12px rgba(0,0,0,0.3);`
    : `box-shadow: 0 4px 12px rgba(0,0,0,0.3);`;

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid #fff;
      ${ring}
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    ">
      🙏
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-need-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
};

export default function DashboardMapInner({
  center = [26.9124, 75.7873],
  zoom = 12,
  donations = [],
  needRequests = [],
  onClaim,
  onStatusUpdate,
  onMatchRequest,
  currentUserId,
  userRole,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-[380px] sm:h-[460px] md:h-[520px] rounded-2xl overflow-hidden shadow-lg z-0"
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ── FOOD SUPPLY PINS (🍱) ── */}
      {donations.map((item) => {
        const [lng, lat] = item.location?.coordinates || [0, 0];
        if (!lat || !lng) return null;

        const isClaimedByMe =
          item.claimedBy?._id === currentUserId || item.claimedBy === currentUserId;

        return (
          <Marker
            key={`don-${item._id}`}
            position={[lat, lng]}
            icon={createUrgencyIcon(item.urgencyLevel, item.status)}
          >
            <Popup className="rounded-xl">
              <div className="p-2 max-w-xs space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 border-b pb-1">
                  <span className="font-bold text-slate-900 text-sm leading-tight">{item.title}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full text-white flex-shrink-0 ${
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
                </div>

                <p className="text-slate-600 line-clamp-2">{item.description}</p>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                  <div>Type: <strong>{item.foodType}</strong></div>
                  <div>Qty: <strong>{item.quantity} kg</strong></div>
                  <div>Dist: <strong>{item.distanceKm ? `${item.distanceKm} km` : 'N/A'}</strong></div>
                  <div>Status: <strong className="text-emerald-700">{item.status}</strong></div>
                </div>

                <div className="text-[10px] text-slate-500">
                  📍 {item.location?.address}
                </div>
                <div className="text-[10px] text-slate-400">
                  ⏰ Expires: {new Date(item.expiryTime).toLocaleString()}
                </div>

                {item.status === 'AVAILABLE' && ['NGO', 'VOLUNTEER'].includes(userRole) && onClaim && (
                  <button
                    onClick={() => onClaim(item._id)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow transition mt-1"
                  >
                    ✅ Claim This Food
                  </button>
                )}

                {isClaimedByMe && item.status === 'CLAIMED' && onStatusUpdate && (
                  <button
                    onClick={() => onStatusUpdate(item._id, 'IN_TRANSIT')}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow transition mt-1"
                  >
                    🚚 Mark as In Transit
                  </button>
                )}

                {isClaimedByMe && item.status === 'IN_TRANSIT' && onStatusUpdate && (
                  <button
                    onClick={() => onStatusUpdate(item._id, 'DELIVERED')}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition mt-1"
                  >
                    ✅ Mark as Delivered
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── NEED REQUEST PINS (🙏) ── */}
      {needRequests.map((req) => {
        const [lng, lat] = req.location?.coordinates || [0, 0];
        if (!lat || !lng) return null;

        return (
          <Marker
            key={`req-${req._id}`}
            position={[lat, lng]}
            icon={createNeedIcon(req.urgencyLevel)}
          >
            <Popup className="rounded-xl">
              <div className="p-2 max-w-xs space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 border-b pb-1">
                  <span className="font-bold text-purple-900 text-sm leading-tight">
                    🙏 {req.recipientName}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full text-white flex-shrink-0 ${
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
                </div>

                <div className="text-[11px] text-slate-700 space-y-0.5">
                  <div>🏠 Type: <strong>{req.organizationType?.replace(/_/g, ' ')}</strong></div>
                  <div>🍽️ Need: <strong>{req.servingsNeeded} servings</strong></div>
                  <div>🥗 Diet: <strong>{req.dietaryPreference}</strong></div>
                  <div>📞 Contact: <strong>{req.contactPerson}</strong> ({req.contactPhone})</div>
                </div>

                <div className="text-[10px] text-slate-500">
                  📍 {req.location?.address}
                </div>

                {req.notes && (
                  <div className="text-[10px] text-slate-400 italic border-t pt-1">
                    💬 {req.notes}
                  </div>
                )}

                <div className={`text-center text-[10px] font-bold py-1 rounded-lg ${
                  req.status === 'OPEN'
                    ? 'bg-pink-100 text-pink-800'
                    : req.status === 'MATCHED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Status: {req.status}
                </div>

                {req.status === 'OPEN' && ['NGO', 'VOLUNTEER'].includes(userRole) && onMatchRequest && (
                  <button
                    onClick={() => onMatchRequest(req._id)}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow transition"
                  >
                    🔗 Assign Food to This Request
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
