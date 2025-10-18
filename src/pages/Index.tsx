import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Location, Map1, ArrowRotateLeft, Hospital, Buildings, Courthouse } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import MapComponent from '@/components/Map';
import SearchBar from '@/components/SearchBar';
import QuickFilters from '@/components/QuickFilters';
import FiltersModal from '@/components/FiltersModal';
import FacilityCard from '@/components/FacilityCard';
import { FacilityCardSkeleton } from '@/components/SkeletonLoader';
import StatCard from '@/components/dashboard/StatCard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFacilities } from '@/hooks/useFacilities';

const Index = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(searchParams.get('type'));
  const [showMap, setShowMap] = useState(false);
  
  const { latitude, longitude, loading: locationLoading, error: locationError, refresh: refreshLocation } = useGeolocation();
  const [radiusMeters, setRadiusMeters] = useState<number>(50000); // default 50km (derived from filters)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersState, setFiltersState] = useState({ doctorType: null as string | null, issues: [] as string[], minRating: null as number | null, insurance: null as string | null, openNow: false, scope: 'nearby' as 'nearby' | 'country' | 'world', userType: null as 'rural' | 'urban' | null, hospitalLevel: null as 'primary' | 'secondary' | 'tertiary' | null, medicationAvailable: null as boolean | null });

  const { facilities, loading: facilitiesLoading } = useFacilities({
    latitude,
    longitude,
    radius: radiusMeters,
    type: selectedType,
    userType: filtersState.userType,
    hospitalLevel: filtersState.hospitalLevel,
    medicationAvailable: filtersState.medicationAvailable,
    doctorType: filtersState.doctorType,
    minRating: filtersState.minRating,
    insurance: filtersState.insurance,
    issues: filtersState.issues,
    openNow: filtersState.openNow,
  });

  // Update selected type when URL params change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    setSelectedType(typeParam);
  }, [searchParams]);

  const handleTypeChange = (type: string | null) => {
    setSelectedType(type);
    if (type) {
      setSearchParams({ type });
    } else {
      setSearchParams({});
    }
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Calculate statistics
  const hospitalCount = filteredFacilities.filter(f => f.type === 'hospital').length;
  const clinicCount = filteredFacilities.filter(f => f.type === 'clinic').length;
  const pharmacyCount = filteredFacilities.filter(f => f.type === 'pharmacy').length;

  return (
    <ResponsiveLayout>
      {isDesktop ? (
        // Desktop Dashboard Layout
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Facilities"
              value={filteredFacilities.length}
              icon={<Buildings size={24} className="text-primary" variant="Outline" />}
              description="Within your area"
              trend="neutral"
            />
            <StatCard
              title="Hospitals"
              value={hospitalCount}
              icon={<Hospital size={24} className="text-primary" variant="Outline" />}
              description="Emergency services available"
              trend="up"
            />
            <StatCard
              title="Clinics & Pharmacies"
              value={clinicCount + pharmacyCount}
              icon={<Courthouse size={24} className="text-primary" variant="Outline" />}
              description="General healthcare"
              trend="neutral"
            />
          </div>

          {/* Search and Filters Section */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t('search.placeholder')}
                  />
                </div>
                <div>
                  <button onClick={() => setFiltersOpen(true)} className="p-2 border rounded-md text-sm bg-white hover:bg-gray-50">Filters</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Location size={16} className="animate-pulse" />
                    <span>{t('location.detecting')}...</span>
                  </div>
                ) : locationError ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <Location size={16} />
                    <span>{locationError}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Location size={16} variant="Outline" className="text-primary" />
                    <span className="font-medium">
                      {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshLocation}
                  disabled={locationLoading}
                  className="gap-2"
                >
                  <ArrowRotateLeft size={16} />
                  Refresh Location
                </Button>
              </div>

              <QuickFilters
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
                showOpenNow={true}
              />

              <FiltersModal
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                value={filtersState}
                onChange={(v) => setFiltersState({ ...filtersState, ...v, issues: v.issues ?? filtersState.issues ?? [] })}
                onApply={() => {
                  // derive radius from scope when filters are applied
                  if (filtersState.scope === 'nearby') setRadiusMeters(50000);
                  if (filtersState.scope === 'country') setRadiusMeters(2000000);
                  if (filtersState.scope === 'world') setRadiusMeters(20000000);
                }}
                onReset={() => setFiltersState({ doctorType: null, issues: [], minRating: null, insurance: null, openNow: false, scope: 'nearby', userType: null, hospitalLevel: null, medicationAvailable: null })}
              />
            </CardContent>
          </Card>

          {/* Main Content - Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-28rem)]">
            {/* Map View */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0 h-full">
                {latitude && longitude ? (
                  <MapComponent
                    latitude={latitude}
                    longitude={longitude}
                    facilities={filteredFacilities}
                    onRefreshLocation={refreshLocation}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Location size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Waiting for location...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* List View */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {facilitiesLoading ? (
                      <span className="text-muted-foreground">{t('search.searching')}...</span>
                    ) : (
                      <>
                        <span className="text-primary">{filteredFacilities.length}</span> Facilities Found
                      </>
                    )}
                  </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {facilitiesLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <FacilityCardSkeleton key={i} />
                      ))}
                    </>
                  ) : filteredFacilities.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <Location size={32} className="text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">No facilities found</h3>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or search radius.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedType(null);
                            setSearchQuery('');
                            setSearchParams({});
                            refreshLocation();
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  ) : (
                    filteredFacilities.map((facility) => (
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Mobile Layout with Enhanced UI
        <div className="flex flex-col h-full">
          <div className="p-4 space-y-4 bg-gradient-to-b from-card/50 to-background border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t('search.placeholder')}
                />
              </div>
              <div>
                <button onClick={() => setFiltersOpen(true)} className="p-2 border rounded-md text-sm bg-white hover:bg-gray-50">Filters</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {locationLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Location size={16} className="animate-pulse" />
                  <span>{t('location.detecting')}...</span>
                </div>
              ) : locationError ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <Location size={16} />
                  <span className="text-xs">{locationError}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="font-medium text-foreground">
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshLocation}
                disabled={locationLoading}
                className="gap-2 text-primary hover:bg-primary/10"
              >
                <ArrowRotateLeft size={16} className={locationLoading ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>

            <QuickFilters
              selectedType={selectedType}
              onTypeChange={handleTypeChange}
              showOpenNow={true}
            />

            <div className="flex items-center justify-between bg-card/50 rounded-none p-3 border border-border/50">
              <div className="flex items-center gap-2">
                {facilitiesLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">{t('search.searching')}...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Buildings size={20} className="text-primary" variant="Outline" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{filteredFacilities.length}</p>
                      <p className="text-xs text-muted-foreground">facilities found</p>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className={`gap-2 transition-all ${
                  showMap 
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                    : 'hover:bg-primary/10 hover:text-primary hover:border-primary'
                }`}
              >
                <Map1 size={16} variant={showMap ? 'Bold' : 'Outline'} />
                {showMap ? 'List' : 'Map'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {showMap ? (
              <div className="h-full">
                {latitude && longitude ? (
                  <MapComponent
                    latitude={latitude}
                    longitude={longitude}
                    facilities={filteredFacilities}
                    onRefreshLocation={refreshLocation}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-background via-accent/5 to-background">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Location size={40} className="text-primary animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Waiting for location...</p>
                        <p className="text-sm text-muted-foreground mt-1">Enable location services</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background to-accent/5">
                {facilitiesLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FacilityCardSkeleton key={i} />
                    ))}
                  </>
                ) : filteredFacilities.length === 0 ? (
                  <Card className="border-dashed border-2 border-border/50">
                    <CardContent className="p-12 text-center">
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                          <Location size={40} className="text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2 text-foreground">No facilities found</h3>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or search radius. Make sure location services are enabled.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary"
                          onClick={() => {
                            setSelectedType(null);
                            setSearchQuery('');
                            setSearchParams({});
                            refreshLocation();
                          }}
                        >
                          <ArrowRotateLeft size={16} className="mr-2" />
                          Reset Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredFacilities.map((facility) => (
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
              </div>
            )}
          </div>
        </div>
      )}
    </ResponsiveLayout>
  );
};

export default Index;
