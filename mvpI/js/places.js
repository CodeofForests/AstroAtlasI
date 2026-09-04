/*
 * Embedded place lookup — a lightweight stand-in for GeoNames until that
 * integration exists (see Construction Site). Covers the regression-set
 * birthplaces plus a set of major world cities. Manual lat/lon + IANA zone
 * entry is always available in the UI as a fallback for anywhere not listed.
 */

const PLACES = [
  { name: "Zhuhai, China", lat: 22.2769, lon: 113.5678, zone: "Asia/Shanghai" },
  { name: "Ningbo, China", lat: 29.8683, lon: 121.5440, zone: "Asia/Shanghai" },
  { name: "Erding, Germany", lat: 48.3086, lon: 11.9034, zone: "Europe/Berlin" },
  { name: "Beijing, China", lat: 39.9042, lon: 116.4074, zone: "Asia/Shanghai" },
  { name: "Shanghai, China", lat: 31.2304, lon: 121.4737, zone: "Asia/Shanghai" },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, zone: "Asia/Hong_Kong" },
  { name: "Berlin, Germany", lat: 52.5200, lon: 13.4050, zone: "Europe/Berlin" },
  { name: "Munich, Germany", lat: 48.1351, lon: 11.5820, zone: "Europe/Berlin" },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, zone: "Europe/London" },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522, zone: "Europe/Paris" },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060, zone: "America/New_York" },
  { name: "Los Angeles, USA", lat: 34.0522, lon: -118.2437, zone: "America/Los_Angeles" },
  { name: "Chicago, USA", lat: 41.8781, lon: -87.6298, zone: "America/Chicago" },
  { name: "Toronto, Canada", lat: 43.6532, lon: -79.3832, zone: "America/Toronto" },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, zone: "Australia/Sydney" },
  { name: "Melbourne, Australia", lat: -37.8136, lon: 144.9631, zone: "Australia/Melbourne" },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, zone: "Asia/Tokyo" },
  { name: "Seoul, South Korea", lat: 37.5665, lon: 126.9780, zone: "Asia/Seoul" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, zone: "Asia/Singapore" },
  { name: "Mumbai, India", lat: 19.0760, lon: 72.8777, zone: "Asia/Kolkata" },
  { name: "Delhi, India", lat: 28.7041, lon: 77.1025, zone: "Asia/Kolkata" },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, zone: "Asia/Dubai" },
  { name: "São Paulo, Brazil", lat: -23.5505, lon: -46.6333, zone: "America/Sao_Paulo" },
  { name: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332, zone: "America/Mexico_City" },
  { name: "Cairo, Egypt", lat: 30.0444, lon: 31.2357, zone: "Africa/Cairo" },
  { name: "Johannesburg, South Africa", lat: -26.2041, lon: 28.0473, zone: "Africa/Johannesburg" },
  { name: "Moscow, Russia", lat: 55.7558, lon: 37.6173, zone: "Europe/Moscow" },
  { name: "Rome, Italy", lat: 41.9028, lon: 12.4964, zone: "Europe/Rome" },
  { name: "Madrid, Spain", lat: 40.4168, lon: -3.7038, zone: "Europe/Madrid" },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lon: 4.9041, zone: "Europe/Amsterdam" },
  { name: "Vienna, Austria", lat: 48.2082, lon: 16.3738, zone: "Europe/Vienna" },
  { name: "Zurich, Switzerland", lat: 47.3769, lon: 8.5417, zone: "Europe/Zurich" }
];

function findPlaces(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLACES.filter((p) => p.name.toLowerCase().indexOf(q) !== -1).slice(0, 8);
}
