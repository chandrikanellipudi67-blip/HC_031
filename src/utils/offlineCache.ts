// Offline caching utility for medical facilities
interface CacheData<T> {
  data: T;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = 'medical_facilities_';

export const offlineCache = {
  // Save facilities data to localStorage
  saveFacilities: (
    facilities: any[],
    latitude: number,
    longitude: number,
    type?: string | null
  ) => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${type || 'all'}`;
      const cacheData: CacheData<any[]> = {
        data: facilities,
        timestamp: Date.now(),
        location: { latitude, longitude },
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  // Get cached facilities if still valid
  getFacilities: (
    latitude: number,
    longitude: number,
    type?: string | null
  ): any[] | null => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${type || 'all'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData: CacheData<any[]> = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Check if cache is still valid
      if (age > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check if user has moved significantly (more than 10km)
      const distance = calculateDistance(
        latitude,
        longitude,
        cacheData.location.latitude,
        cacheData.location.longitude
      );

      if (distance > 10000) {
        // User moved more than 10km, cache invalid
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  // Clear all cache
  clearAll: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Get cache info
  getCacheInfo: () => {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    
    return cacheKeys.map((key) => {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      try {
        const cacheData: CacheData<any[]> = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;
        const isValid = age < CACHE_DURATION;
        
        return {
          key: key.replace(CACHE_KEY_PREFIX, ''),
          count: cacheData.data.length,
          age: Math.floor(age / 1000 / 60), // age in minutes
          isValid,
          location: cacheData.location,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  },
};

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
