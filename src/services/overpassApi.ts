// Overpass API service to fetch real medical facilities from OpenStreetMap
// Use multiple endpoints as fallbacks because some Overpass mirrors have
// intermittent CORS/network issues. We'll try each in order until one succeeds.
const OVERPASS_API_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

async function postToOverpass(query: string) {
  let lastError: any = null;
  for (const url of OVERPASS_API_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (!response.ok) {
        lastError = new Error(`Overpass endpoint ${url} returned ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (err) {
      // network/CORS error — try next endpoint
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error('All Overpass endpoints failed');
}

interface OverpassFacility {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    phone?: string;
    'contact:phone'?: string;
    opening_hours?: string;
    emergency?: string;
    'healthcare:speciality'?: string;
    operator?: string;
    website?: string;
  };
}

interface ParsedFacility {
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'blood_bank' | 'emergency';
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  hours: string;
  services: string;
  verified: boolean;
  // Optional fields for richer filtering
  rating?: string | null;
  tags?: Record<string, any>;
}

export const fetchRealFacilities = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 100
): Promise<ParsedFacility[]> => {
  try {
  // Convert km to meters for Overpass API. If radiusKm is very large (global), clamp to a reasonable max
  const radiusMeters = Math.min(radiusKm * 1000, 20000000); // cap at 20,000 km in meters

    // Overpass QL query to fetch medical facilities
    const query = `
      [out:json][timeout:25];
      (
        // Hospitals
        node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        
        // Clinics
        node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
        
        // Doctors
        node["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
        
        // Pharmacies
        node["amenity"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
        
        // Blood banks
        node["healthcare"="blood_donation"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="blood_donation"](around:${radiusMeters},${latitude},${longitude});
        
        // Emergency
        node["emergency"="yes"](around:${radiusMeters},${latitude},${longitude});
        way["emergency"="yes"](around:${radiusMeters},${latitude},${longitude});
      );
      out center;
    `;

    const data = await postToOverpass(query);
    const facilities: ParsedFacility[] = [];

    // Parse Overpass response
    data.elements.forEach((element: OverpassFacility) => {
      const tags = element.tags || {};
      
      // Skip if no name
      if (!tags.name && !tags.operator) return;

      // Determine facility type
      let type: ParsedFacility['type'] = 'clinic';
      let services = '';

      if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') {
        type = 'hospital';
        services = 'Emergency Care, General Medicine, Surgery';
      } else if (tags.amenity === 'clinic' || tags.healthcare === 'clinic' || tags.amenity === 'doctors') {
        type = 'clinic';
        services = 'Primary Care, Consultations';
      } else if (tags.amenity === 'pharmacy') {
        type = 'pharmacy';
        services = 'Prescriptions, Medications, Health Products';
      } else if (tags.healthcare === 'blood_donation') {
        type = 'blood_bank';
        services = 'Blood Donation, Blood Testing';
      } else if (tags.emergency === 'yes') {
        type = 'emergency';
        services = 'Emergency Services, Ambulance';
      }

      // Add speciality to services if available
      if (tags['healthcare:speciality']) {
        services += `, ${tags['healthcare:speciality']}`;
      }

      // Build address
      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'],
        tags['addr:postcode'],
      ].filter(Boolean);
      
      const address = addressParts.length > 0 
        ? addressParts.join(', ')
        : 'Address not available';

      // Get phone
      const phone = tags.phone || tags['contact:phone'] || 'Phone not available';

      // Get coordinates (for ways, use center)
      const lat = element.lat || (element as any).center?.lat;
      const lon = element.lon || (element as any).center?.lon;

      if (!lat || !lon) return;

      // Get opening hours
      const hours = tags.opening_hours || '24/7';

      facilities.push({
        name: tags.name || tags.operator || 'Unknown Facility',
        type,
        address,
        phone,
        latitude: lat,
        longitude: lon,
        hours,
        services,
        verified: true, // Data from OSM is considered verified
        rating: tags['rating'] || tags['stars'] || null,
        tags,
      });
    });

    return facilities;
  } catch (error) {
    console.error('Error fetching from Overpass API:', error);
    throw error;
  }
};

// Fetch facilities by type
export const fetchRealFacilitiesByType = async (
  latitude: number,
  longitude: number,
  type: string,
  radiusKm: number = 100
): Promise<ParsedFacility[]> => {
  const allFacilities = await fetchRealFacilities(latitude, longitude, radiusKm);
  
  if (type === 'emergency') {
    return allFacilities.filter(f => f.type === 'emergency' || f.type === 'hospital');
  }
  
  return allFacilities.filter(f => f.type === type);
};

// Resolve a city/place name to lat/lon using Nominatim (OpenStreetMap)
export const geocodePlace = async (placeName: string): Promise<{ lat: number; lon: number; display_name?: string } | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`;
    // Do not set User-Agent header from browsers (blocked). Use a simple GET.
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.json();
    if (!arr || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), display_name: arr[0].display_name };
  } catch (err) {
    console.error('Geocode error:', err);
    return null;
  }
};

// Search by specialty keywords — maps simple specialty names to Overpass filters
export const fetchFacilitiesBySpecialty = async (
  placeOrLat: string | number,
  lonOrRadius: number | undefined,
  specialty: string,
  radiusKm: number = 50
): Promise<ParsedFacility[]> => {
  // If first arg is string, treat it as a place name
  let lat: number | null = null;
  let lon: number | null = null;

  if (typeof placeOrLat === 'string') {
    const geo = await geocodePlace(placeOrLat);
    if (!geo) return [];
    lat = geo.lat;
    lon = geo.lon;
  } else {
    lat = Number(placeOrLat);
    lon = Number(lonOrRadius || 0);
  }

  if (!lat || !lon) return [];

  // Map specialty to tags: be inclusive (doctors, clinics, hospitals, healthcare:speciality)
  const s = specialty.toLowerCase();
  const specialtyFilters: string[] = [];
  if (s.includes('gyn') || s.includes('obstet')) {
    // include many variations used in OSM tags
    specialtyFilters.push('"healthcare:speciality"~"gynaecology|obstetrics|gynecology|obstetric|gynecologist|gynaecologist|obstetrician"');
    specialtyFilters.push('"amenity"="clinic"');
    specialtyFilters.push('"amenity"="hospital"');
    specialtyFilters.push('"amenity"="doctors"');
  } else if (s.includes('cardio') || s.includes('cardio')) {
    specialtyFilters.push('"healthcare:speciality"~"cardiology|cardiologist"');
  } else if (s.includes('pedi') || s.includes('child')) {
    specialtyFilters.push('"healthcare:speciality"~"pediatrics|paediatrics|pediatric"');
  } else if (s.includes('pharm')) {
    specialtyFilters.push('"amenity"="pharmacy"');
  } else {
    // Generic search: doctors, clinics, hospitals
    specialtyFilters.push('"amenity"="doctors"');
    specialtyFilters.push('"amenity"="clinic"');
    specialtyFilters.push('"amenity"="hospital"');
    specialtyFilters.push('"healthcare"="clinic"');
  }

  // Build Overpass query using the filters
  const radiusMeters = radiusKm * 1000;
  const filterParts = specialtyFilters.map(f => `node[${f}](around:${radiusMeters},${lat},${lon}); way[${f}](around:${radiusMeters},${lat},${lon});`).join('\n');

  const query = `
    [out:json][timeout:25];
    (
      ${filterParts}
    );
    out center;
  `;

  try {
    const data = await postToOverpass(query);
    // Reuse parsing logic by converting to same shape as fetchRealFacilities
    const facilities: ParsedFacility[] = [];
    data.elements.forEach((element: any) => {
      const tags = element.tags || {};
      if (!tags.name && !tags.operator) return;
      let type: ParsedFacility['type'] = 'clinic';
      if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') type = 'hospital';
      if (tags.amenity === 'pharmacy') type = 'pharmacy';
      const addressParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(', ') : (tags['addr:city'] || 'Address not available');
      const phone = tags.phone || tags['contact:phone'] || 'Phone not available';
      const latEl = element.lat || element.center?.lat;
      const lonEl = element.lon || element.center?.lon;
      if (!latEl || !lonEl) return;
      const hours = tags.opening_hours || '24/7';
      const services = (tags['healthcare:speciality'] || '') + (tags.service ? `, ${tags.service}` : '');
  facilities.push({ name: tags.name || tags.operator || 'Unknown', type, address, phone, latitude: latEl, longitude: lonEl, hours, services, verified: true, rating: tags['rating'] || tags['stars'] || null, tags });
    });
    return facilities;
  } catch (err) {
    console.error('Specialty search error:', err);
    return [];
  }
};
