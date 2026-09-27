export function marketCoordinates(market) {
  const longitude = Number(market?.coordinates?.longitude ?? market?.location?.coordinates?.[0]);
  const latitude = Number(market?.coordinates?.latitude ?? market?.location?.coordinates?.[1]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error("Allow location access to calculate pickup routes.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  });
}

export async function geocodeAddress(address) {
  if (!String(address || "").trim()) throw new Error("Add an address to your profile or allow location access.");
  const normalizedAddress = String(address).trim().toLowerCase();
  const cacheKey = `marketlink_geocode_${normalizedAddress}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached && Date.now() - cached.savedAt < 30 * 24 * 60 * 60 * 1000) return { ...cached.coordinates, fromAddress: true };
  } catch { /* Continue with live geocoding. */ }
  const geocoder = (import.meta.env.VITE_NOMINATIM_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "");
  const endpoint = `${geocoder}/search?format=jsonv2&limit=1&countrycodes=pk&q=${encodeURIComponent(address)}`;
  const response = await fetch(endpoint, { headers: { "Accept-Language": "en" } });
  if (!response.ok) throw new Error("Could not find your saved address on the map.");
  const match = (await response.json())?.[0];
  if (!match) throw new Error("Could not find your saved address on the map.");
  const coordinates = { latitude: Number(match.lat), longitude: Number(match.lon) };
  try { localStorage.setItem(cacheKey, JSON.stringify({ coordinates, savedAt: Date.now() })); } catch { /* Routing still works without cache storage. */ }
  return { ...coordinates, fromAddress: true };
}

export async function getRouteOrigin(address) {
  try {
    return await getCurrentPosition();
  } catch {
    return geocodeAddress(address);
  }
}

function directDistance(origin, destination) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(destination.latitude - origin.latitude);
  const dLon = radians(destination.longitude - origin.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function routeToMarket(origin, market) {
  const destination = marketCoordinates(market);
  if (!destination) throw new Error("This market does not have verified map coordinates yet.");
  const endpoint = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false&steps=false`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Routing service unavailable");
    const payload = await response.json();
    const route = payload.routes?.[0];
    if (!route) throw new Error("No driving route found");
    return { distanceKm: route.distance / 1000, durationMinutes: Math.max(1, Math.round(route.duration / 60)), origin, destination, estimated: false };
  } catch {
    const distanceKm = directDistance(origin, destination) * 1.25;
    return { distanceKm, durationMinutes: Math.max(1, Math.round(distanceKm / 25 * 60)), origin, destination, estimated: true };
  }
}

export function googleDirectionsUrl(market, origin) {
  const destination = marketCoordinates(market);
  if (!destination) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${market?.name || "Market"} ${market?.address || ""}`)}`;
  const originPart = origin ? `&origin=${origin.latitude},${origin.longitude}` : "";
  return `https://www.google.com/maps/dir/?api=1${originPart}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
}

export function openStreetMapDirectionsUrl(market, origin) {
  const destination = marketCoordinates(market);
  if (!destination) return "https://www.openstreetmap.org";
  if (!origin) return `https://www.openstreetmap.org/?mlat=${destination.latitude}&mlon=${destination.longitude}#map=16/${destination.latitude}/${destination.longitude}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${destination.latitude}%2C${destination.longitude}`;
}
