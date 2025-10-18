import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Location } from 'iconsax-react';
import { toast } from 'sonner';
import MapControls from './MapControls';

// Note: Using OpenStreetMap tiles with Mapbox GL JS
// Mapbox requires an access token, but we can use it with OSM tiles
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface MapProps {
  latitude: number;
  longitude: number;
  facilities?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: string;
    distance?: number;
  }>;
  onMarkerClick?: (facilityId: string) => void;
  onRefreshLocation?: () => void;
}

const Map = ({ latitude, longitude, facilities = [], onMarkerClick, onRefreshLocation }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [longitude, latitude],
        zoom: 13, // Slightly closer zoom for better facility visibility
        pitch: 0,
        bearing: 0,
      });

      // Resize map when container size changes (helpful on mobile when nav appears)
      const ro = new ResizeObserver(() => {
        try {
          map.current?.resize();
        } catch (e) {
          // ignore
        }
      });
      if (mapContainer.current) ro.observe(mapContainer.current);

      // Add user location marker
      userMarkerRef.current = new mapboxgl.Marker({ color: '#007AFF', scale: 1.2 })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
        .addTo(map.current);

      // Track zoom level
      map.current.on('zoom', () => {
        if (map.current) {
          setCurrentZoom(map.current.getZoom());
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to load map');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude]);

  // Update facility markers with improved popups
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers with enhanced popups
    facilities.forEach((facility) => {
      const markerColor = getMarkerColor(facility.type);
      
      // Create custom popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${facility.name}</h3>
          <div style="margin-bottom: 4px; color: #666; font-size: 12px;">
            <strong>Type:</strong> ${facility.type.replace('_', ' ')}
          </div>
          ${facility.distance ? `
            <div style="margin-bottom: 4px; color: #666; font-size: 12px;">
              <strong>Distance:</strong> ${formatDistance(facility.distance)}
            </div>
          ` : ''}
          <button 
            onclick="window.location.href='/resource/${facility.id}'"
            style="
              margin-top: 8px;
              padding: 6px 12px;
              background: #007AFF;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              width: 100%;
            "
          >
            View Details
          </button>
        </div>
      `;
      
      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([facility.lng, facility.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false })
            .setHTML(popupContent)
        );

      if (onMarkerClick) {
        marker.getElement().addEventListener('click', () => {
          onMarkerClick(facility.id);
        });
      }

      marker.addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [facilities, mapLoaded, onMarkerClick]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Center map on user location
  const centerOnUser = () => {
    if (map.current) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        essential: true,
      });
    }
  };

  // Ensure map resizes when coords update
  useEffect(() => {
    try {
      map.current?.resize();
      if (map.current && latitude && longitude) {
        map.current.setCenter([longitude, latitude]);
      }
    } catch (e) {}
  }, [latitude, longitude]);

  const handleZoomChange = (zoom: number) => {
    if (map.current) {
      map.current.setZoom(zoom);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[420px]">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <MapControls
        onCenterUser={centerOnUser}
        onRefreshLocation={onRefreshLocation || (() => {})}
        currentZoom={currentZoom}
        onZoomChange={handleZoomChange}
      />
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <div className="text-xs text-muted-foreground">
          {facilities.length} facilities nearby
        </div>
      </div>
    </div>
  );
};

const getMarkerColor = (type: string): string => {
  const colors: Record<string, string> = {
    hospital: '#0066CC',
    clinic: '#00CC66',
    pharmacy: '#9933CC',
    blood_bank: '#CC0000',
    emergency: '#FF6600',
  };
  return colors[type] || '#007AFF';
};

export default Map;
