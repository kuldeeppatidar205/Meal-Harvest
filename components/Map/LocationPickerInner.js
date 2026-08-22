'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pickerIcon = L.divIcon({
  html: `
    <div style="
      background-color: #16a34a;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    ">
      📍
    </div>
  `,
  className: 'location-picker-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerInner({ position, onPositionChange }) {
  const center = [position.lat, position.lng];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={true}
      className="w-full h-[250px] sm:h-[300px] rounded-xl overflow-hidden shadow-inner z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={(lat, lng) => onPositionChange({ lat, lng })} />
      <Marker position={[position.lat, position.lng]} icon={pickerIcon} />
    </MapContainer>
  );
}
