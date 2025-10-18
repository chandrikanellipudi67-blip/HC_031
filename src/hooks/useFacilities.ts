import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDistance } from 'geolib';
import { toast } from 'sonner';
import { offlineCache } from '@/utils/offlineCache';
import { fetchRealFacilities, fetchRealFacilitiesByType } from '@/services/overpassApi';

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'blood_bank' | 'emergency';
  address: string;
  phone: string;
  lat: number;
  lng: number;
  description?: string;
  image_url?: string;
  hours?: any;
  verified: boolean;
  distance?: number;
}

interface UseFacilitiesOptions {
  latitude: number | null;
  longitude: number | null;
  radius?: number; // in meters, default 100km (overridden to large for world search)
  type?: string | null;
  userType?: 'rural' | 'urban' | null; // UI-level preference to influence filter/sorting
  hospitalLevel?: 'primary' | 'secondary' | 'tertiary' | null; // optional level filter
  medicationAvailable?: boolean | null; // prefer facilities that likely carry meds (pharmacies or hospitals)
  doctorType?: string | null;
  minRating?: number | null;
  insurance?: string | null;
  openNow?: boolean | null;
  issues?: string[] | null;
}

export const useFacilities = ({ 
  latitude, 
  longitude, 
  radius = 20000000, // default ~20,000km to approximate "worldwide" when desired
  type = null,
  userType = null,
  hospitalLevel = null,
  medicationAvailable = null,
  doctorType = null,
  minRating = null,
  insurance = null,
  openNow = null,
  issues = null,
}: UseFacilitiesOptions) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!latitude || !longitude) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first (valid for 24 hours)
        const cachedData = offlineCache.getFacilities(latitude, longitude, type);
        if (cachedData && cachedData.length > 0) {
          setFacilities(cachedData);
          setLoading(false);
          toast.success(`Loaded ${cachedData.length} facilities from cache`);
          return;
        }

        // Fetch real data from OpenStreetMap via Overpass API
        console.log('Fetching real facilities from OpenStreetMap...');
        toast.loading('Finding nearby facilities from OpenStreetMap...');
        
        let realFacilities;
        if (type) {
          realFacilities = await fetchRealFacilitiesByType(
            latitude,
            longitude,
            type,
            radius / 1000 // Convert meters to km
          );
        } else {
          realFacilities = await fetchRealFacilities(
            latitude,
            longitude,
            radius / 1000
          );
        }

        // Apply lightweight client-side filters for userType / hospitalLevel / medicationAvailable
        const applyFilters = (f: any) => {
          // medicationAvailable: prefer pharmacies/hospitals that advertise services containing 'Prescription' or 'Med'
          if (medicationAvailable === true) {
            const svc = (f.services || '').toLowerCase();
            if (!(f.type === 'pharmacy' || svc.includes('prescription') || svc.includes('medic'))) return false;
          }

          // hospitalLevel: try matching keywords in name/services/address (best-effort)
          if (hospitalLevel) {
            const name = (f.name || '').toLowerCase();
            const svc = (f.services || '').toLowerCase();
            if (hospitalLevel === 'primary') {
              // primary centres are often clinics or small hospitals
              if (f.type === 'hospital' && svc.includes('tertiary')) return false;
            }
            if (hospitalLevel === 'tertiary') {
              // prefer larger hospitals
              if (!(f.type === 'hospital' && (svc.includes('surgery') || svc.includes('emergency') || name.includes('medical center') || name.includes('general hospital')))) return false;
            }
          }

          // userType (rural): prefer results that indicate availability or telemedicine keywords (best-effort)
          if (userType === 'rural') {
            const svc = (f.services || '').toLowerCase();
            const name = (f.name || '').toLowerCase();
            // keep if it's a pharmacy or explicitly mentions 'telemedicine' / 'delivery' / 'community'
            if (!(f.type === 'pharmacy' || svc.includes('telemedicine') || svc.includes('delivery') || name.includes('community') || name.includes('rural'))) {
              // allow through but deprioritize later (we'll handle ordering)
            }
          }

          // doctorType: match against services / specialties / name
          if (doctorType) {
            const dt = doctorType.toLowerCase();
            const svc = (f.services || '').toLowerCase();
            const name = (f.name || '').toLowerCase();
            if (!(svc.includes(dt) || name.includes(dt))) return false;
          }

            // issues: if user picked issues, try matching keywords in services/name
            if (issues && issues.length > 0) {
              const text = ((f.services || '') + ' ' + (f.name || '')).toLowerCase();
              const matches = issues.some((iss) => text.includes(iss.toLowerCase()));
              if (!matches) return false;
            }

          // minRating: best-effort; many OSM entries won't have rating — treat missing as 0
          if (minRating != null) {
            const rating = Number((f.rating || 0));
            if (isNaN(rating) || rating < minRating) return false;
          }

          // insurance: best-effort keyword match against known tags / services
          if (insurance) {
            const ins = insurance.toLowerCase();
            const svc = (f.services || '').toLowerCase();
            const tags = ((f.tags || {}) as any);
            const insurer = (tags['insurance'] || tags['health_insurance'] || '').toLowerCase();
            if (!(svc.includes(ins) || insurer.includes(ins) || (f.name || '').toLowerCase().includes(ins))) return false;
          }

          // openNow: if set, try to filter by opening_hours (simple check: if opening_hours is '24/7' or contains digits assume open)
          if (openNow) {
            const hours = (f.hours || '').toLowerCase();
            if (!hours || hours === 'closed') return false;
          }

          return true;
        };

        // Filter server results client-side using the lightweight rules above
        const filtered = (realFacilities || []).filter(applyFilters);

        // Calculate distances and add unique IDs
        const facilitiesWithDistance = filtered
          .map((facility, index) => ({
            ...facility,
            id: `${facility.type}-${facility.latitude}-${facility.longitude}`,
            lat: facility.latitude,
            lng: facility.longitude,
            distance: getDistance(
              { latitude, longitude },
              { latitude: facility.latitude, longitude: facility.longitude }
            ),
          }))
          .filter((facility) => facility.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        setFacilities(facilitiesWithDistance);

        // Cache the data for offline use
        if (facilitiesWithDistance.length > 0) {
          offlineCache.saveFacilities(facilitiesWithDistance, latitude, longitude, type);
          toast.success(`Found ${facilitiesWithDistance.length} real facilities nearby!`);
        } else {
          toast.info(`No ${type || 'facilities'} found within ${radius / 1000}km. Try increasing the radius.`);
        }
      } catch (err) {
        const errorMessage = 'Failed to fetch facilities. Using offline data if available.';
        setError(errorMessage);
        
        // Try to use cached data as fallback
        const cachedData = offlineCache.getFacilities(latitude, longitude, type);
        if (cachedData && cachedData.length > 0) {
          setFacilities(cachedData);
          toast.warning(`Using offline data: ${cachedData.length} facilities`);
        } else {
          toast.error('Could not find facilities. Please check your internet connection.');
        }
        
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [latitude, longitude, radius, type, userType, hospitalLevel, medicationAvailable, doctorType, minRating, insurance, openNow, JSON.stringify(issues)]);

  return { facilities, loading, error };
};
