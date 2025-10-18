import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Danger, Location, Hospital } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import EmergencyContactsList from './EmergencyContacts';
import FacilityCard from '@/components/FacilityCard';
import { FacilityCardSkeleton } from '@/components/SkeletonLoader';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFacilities } from '@/hooks/useFacilities';

const Emergency = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('contacts');
  const { latitude, longitude, loading: locationLoading } = useGeolocation();
  const { facilities, loading: facilitiesLoading } = useFacilities({
    latitude,
    longitude,
    type: 'emergency',
    radius: 50000, // 50km for emergency services
  });

  const handleShareLocation = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      if (navigator.share) {
        navigator.share({
          title: 'My Current Location',
          text: 'I need help! My location:',
          url: url,
        });
      } else {
        navigator.clipboard.writeText(`${latitude}, ${longitude}`);
        alert('Location copied to clipboard!');
      }
    }
  };

  return (
    <ResponsiveLayout>
      <div className="flex flex-col h-full">
        {/* Emergency Header */}
        <div className="bg-red-500 text-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Danger size={28} variant="Outline" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Emergency</h1>
              <p className="text-white/90 text-sm">Quick access to emergency services</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={handleShareLocation}
              disabled={!latitude || !longitude}
            >
              <Location size={20} variant="Outline" />
              Share Location
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="contacts" className="flex-1">
                Emergency Contacts
              </TabsTrigger>
              <TabsTrigger value="facilities" className="flex-1">
                Nearby Emergency
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="contacts" className="m-0 p-4">
                <EmergencyContactsList />
              </TabsContent>

              <TabsContent value="facilities" className="m-0 p-4 space-y-4">
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Hospital size={24} className="text-orange-500 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                          24/7 Emergency Rooms Nearby
                        </p>
                        <p className="text-orange-600 dark:text-orange-400">
                          Showing facilities within 50km with emergency services
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {locationLoading || facilitiesLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <FacilityCardSkeleton key={i} />
                    ))}
                  </>
                ) : facilities.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Hospital size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold mb-2">No emergency facilities found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        No emergency services found within 50km. Try enabling location or call 108.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  facilities.map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      id={facility.id}
                      name={facility.name}
                      type={facility.type}
                      address={facility.address}
                      phone={facility.phone}
                      distance={facility.distance}
                      verified={facility.verified}
                      hours={facility.hours}
                    />
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Emergency;
