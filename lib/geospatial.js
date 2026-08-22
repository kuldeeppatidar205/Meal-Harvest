/**
 * Calculates Haversine distance in kilometers between two coordinates [lat1, lng1] and [lat2, lng2].
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Returns color hex code for map pin rendering based on urgency level
 */
export function getUrgencyColor(urgencyLevel) {
  switch (urgencyLevel) {
    case 'CRITICAL':
      return '#ef4444'; // Red
    case 'HIGH':
      return '#f97316'; // Orange
    case 'MEDIUM':
      return '#eab308'; // Yellow
    case 'LOW':
    default:
      return '#22c55e'; // Green
  }
}
