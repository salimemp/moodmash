/**
 * Geolocation Service
 * Tracks location data for mood entries (privacy-first approach)
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  country?: string;
  timezone?: string;
}

export interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

/**
 * Check geolocation permission status
 */
export async function checkLocationPermission(): Promise<LocationPermission> {
  if (!('permissions' in navigator)) {
    return { granted: false, denied: false, prompt: true };
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt'
    };
  } catch (error) {
    return { granted: false, denied: false, prompt: true };
  }
}

/**
 * Request location permission and get current position
 */
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}

/**
 * Get location with city/country info using Cloudflare's geolocation
 */
export async function getLocationWithDetails(): Promise<LocationData> {
  try {
    const location = await getCurrentLocation();
    
    // Try to get additional details from Cloudflare headers (if available)
    // This is populated by Cloudflare Workers at the edge
    interface CfLocationHeaders {
      city?: string;
      country?: string;
      timezone?: string;
    }
    const cfHeaders: CfLocationHeaders = await fetch('/api/location/info')
      .then(r => r.json() as Promise<CfLocationHeaders>)
      .catch(() => ({}));
    
    return {
      ...location,
      city: cfHeaders?.city,
      country: cfHeaders?.country,
      timezone: cfHeaders?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  } catch (error) {
    // If geolocation fails, at least return timezone
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}

/**
 * Reverse geocode coordinates to human-readable location
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city?: string; country?: string; displayName?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          'User-Agent': 'MoodMash/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    interface NominatimResponse {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
      };
      display_name?: string;
    }
    const data = await response.json() as NominatimResponse;
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
      displayName: data.display_name
    };
  } catch (error) {
    console.error('[Geolocation] Reverse geocode error:', error);
    return {};
  }
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimals
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Privacy-preserving location fuzzing
 * Reduces precision to ~100m radius
 */
export function fuzzLocation(location: LocationData, precision: number = 0.001): LocationData {
  return {
    ...location,
    latitude: Math.round(location.latitude / precision) * precision,
    longitude: Math.round(location.longitude / precision) * precision,
    accuracy: Math.max(location.accuracy, 100) // Minimum 100m accuracy
  };
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
  const parts: string[] = [];
  
  if (location.city) {
    parts.push(location.city);
  }
  
  if (location.country) {
    parts.push(location.country);
  }
  
  if (parts.length === 0 && location.latitude !== 0) {
    return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  }
  
  return parts.join(', ') || 'Unknown location';
}

/**
 * Check if user is in a new location (significant movement)
 */
export function isSignificantLocationChange(
  oldLocation: LocationData,
  newLocation: LocationData,
  thresholdKm: number = 1
): boolean {
  const distance = calculateDistance(
    oldLocation.latitude,
    oldLocation.longitude,
    newLocation.latitude,
    newLocation.longitude
  );
  
  return distance >= thresholdKm;
}
