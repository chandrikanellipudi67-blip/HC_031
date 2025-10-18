import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Navigation, Heart, MapPin, Clock } from 'lucide-react';
import { Hospital, Location } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { offlineCache } from '@/utils/offlineCache';
import { fetchRealFacilities } from '@/services/overpassApi';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { toast } from 'sonner';

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distance?: number;
  verified: boolean;
  hours?: any;
}

const ResourceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Get facility data from cache or state
    const cachedFacilities = offlineCache.getFacilities(0, 0, null) || [];
    let foundFacility = cachedFacilities.find(f => f.id === id);

    if (foundFacility) {
      setFacility(foundFacility);
      return;
    }

    // If not in cache, try to parse id and lookup via Overpass (id contains type-lat-lon)
    (async () => {
      try {
        if (!id) return;
        const parts = id.split('-');
        if (parts.length >= 3) {
          const lat = parseFloat(parts[1]);
          const lon = parseFloat(parts[2]);
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            const results = await fetchRealFacilities(lat, lon, 1); // 1 km radius
            // find nearest by exact coords
            const match = results.find(r => Math.abs(r.latitude - lat) < 0.0005 && Math.abs(r.longitude - lon) < 0.0005);
            if (match) {
              setFacility({
                id: id,
                name: match.name,
                type: match.type,
                address: match.address,
                phone: match.phone,
                lat: match.latitude,
                lng: match.longitude,
                distance: 0,
                verified: match.verified,
                hours: match.hours,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to lookup facility via Overpass:', err);
      }
    })();

    // Check if it's in favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.id === id));
  }, [id]);

  const handleCall = () => {
    if (facility?.phone) {
      window.location.href = `tel:${facility.phone}`;
    } else {
      toast.error('Phone number not available');
    }
  };

  const handleDirections = () => {
    if (facility) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`,
        '_blank'
      );
    }
  };

  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      const updated = favorites.filter((fav: any) => fav.id !== id);
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      favorites.push(facility);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return 'Unknown';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getTypeColor = () => {
    switch (facility?.type) {
      case 'hospital': return 'bg-primary';
      case 'clinic': return 'bg-success';
      case 'pharmacy': return 'bg-info';
      case 'emergency': return 'bg-emergency';
      default: return 'bg-secondary';
    }
  };

  if (!facility) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Location size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Facility not found</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Facility Details</h1>
          </div>
        </div>

        {/* Hero Image with Gradient */}
        <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
          <Hospital size={64} className="text-primary" variant="Outline" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">{facility.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm">{formatDistance(facility.distance)} away</p>
                </div>
              </div>
              {facility.verified && (
                <Badge className="bg-success text-success-foreground">
                  {t('facility.verified')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor()}>
                {facility.type.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
              onClick={handleCall}
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs font-medium">{t('facility.call')}</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 gap-2 hover:bg-success/10 hover:text-success hover:border-success transition-all"
              onClick={handleDirections}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-xs font-medium">{t('facility.getDirections')}</span>
            </Button>
            <Button 
              variant="outline" 
              className={`flex flex-col h-auto py-4 gap-2 transition-all ${
                isFavorite 
                  ? 'bg-destructive/10 text-destructive border-destructive' 
                  : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive'
              }`}
              onClick={handleToggleFavorite}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              <span className="text-xs font-medium">
                {isFavorite ? 'Saved' : t('facility.save')}
              </span>
            </Button>
          </div>

          {/* Contact Info */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="text-foreground font-medium">{facility.address}</p>
              </div>
              {facility.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <a 
                    href={`tel:${facility.phone}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {facility.phone}
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                <p className="text-foreground font-mono text-sm">
                  {facility.lat.toFixed(6)}, {facility.lng.toFixed(6)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          {facility.hours && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('facility.hours')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{facility.hours}</p>
              </CardContent>
            </Card>
          )}

          {/* Map Preview */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleDirections}
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Navigation className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Tap to open in Maps</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default ResourceDetail;
