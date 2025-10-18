import React, { useState } from 'react';
import { fetchRealFacilitiesByType } from '@/services/overpassApi';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const specialties = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'blood_bank', label: 'Blood Bank' },
  { value: 'emergency', label: 'Emergency' },
  // common medical specialties can be treated as filters via healthcare:speciality tag
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
];

const FindProvider: React.FC = () => {
  const { latitude: geoLat, longitude: geoLon } = useGeolocation();
  const [lat, setLat] = useState<string>(geoLat ? String(geoLat) : '');
  const [lon, setLon] = useState<string>(geoLon ? String(geoLon) : '');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [type, setType] = useState<string>('hospital');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    const nlat = parseFloat(lat);
    const nlon = parseFloat(lon);
    if (Number.isNaN(nlat) || Number.isNaN(nlon)) {
      alert('Please provide a valid latitude and longitude (or allow device location).');
      return;
    }

    setLoading(true);
    try {
      // For specialties like cardiology/pediatrics we fetch by general facility type and then filter
      const baseType = ['cardiology','pediatrics','neurology','orthopedics'].includes(type) ? 'clinic' : type;
      const fetched = await fetchRealFacilitiesByType(nlat, nlon, baseType as any, radiusKm);

      // If searching by medical specialty, filter by services/speciality text
      const filtered = ['cardiology','pediatrics','neurology','orthopedics'].includes(type)
        ? fetched.filter(f => (f.services || '').toLowerCase().includes(type))
        : fetched;

      setResults(filtered);
    } catch (err) {
      console.error(err);
      alert('Error fetching facilities. See console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Find a Provider</h1>

        <Card className="p-4 mb-4">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
              <Input placeholder="Longitude" value={lon} onChange={(e) => setLon(e.target.value)} />
              <Input placeholder="Radius (km)" value={String(radiusKm)} onChange={(e) => setRadiusKm(Number(e.target.value || 0))} />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2">
                {specialties.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <Button size="lg" className="bg-blue-600 text-white" onClick={doSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
              <Button variant="outline" onClick={() => { setLat(geoLat ? String(geoLat) : ''); setLon(geoLon ? String(geoLon) : ''); }}>Use my location</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {results.length === 0 ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-muted-foreground">No results yet. Perform a search to see nearby providers.</p>
              </CardContent>
            </Card>
          ) : results.map((r, i) => (
            <Card key={i} className="p-4">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-sm text-muted-foreground">{r.address}</p>
                    <p className="text-sm text-muted-foreground">{r.phone}</p>
                    <p className="text-sm text-muted-foreground">Services: {r.services}</p>
                  </div>
                  <div className="text-right">
                    <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`} className="text-primary underline">Open in Maps</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindProvider;
