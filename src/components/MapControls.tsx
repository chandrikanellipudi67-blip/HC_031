import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Location, Refresh, Layer, Setting2 } from 'iconsax-react';
import { offlineCache } from '@/utils/offlineCache';
import { toast } from 'sonner';

interface MapControlsProps {
  onCenterUser: () => void;
  onRefreshLocation: () => void;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
}

const MapControls = ({ 
  onCenterUser, 
  onRefreshLocation,
  currentZoom,
  onZoomChange 
}: MapControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<any[]>([]);

  const handleShowCache = () => {
    const info = offlineCache.getCacheInfo();
    setCacheInfo(info);
    setShowSettings(!showSettings);
  };

  const handleClearCache = () => {
    offlineCache.clearAll();
    setCacheInfo([]);
    toast.success('Offline cache cleared');
    setShowSettings(false);
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <Button
        size="icon"
        className="bg-background text-foreground shadow-lg hover:bg-accent"
        onClick={onCenterUser}
        aria-label="Center on my location"
      >
  <Location size={24} variant="Outline" />
      </Button>

      <Button
        size="icon"
        className="bg-background text-foreground shadow-lg hover:bg-accent"
        onClick={onRefreshLocation}
        aria-label="Refresh location"
      >
        <Refresh size={24} />
      </Button>

      <Button
        size="icon"
        className="bg-background text-foreground shadow-lg hover:bg-accent"
        onClick={handleShowCache}
        aria-label="Cache settings"
      >
        <Setting2 size={24} />
      </Button>

      {showSettings && (
        <Card className="absolute top-0 right-16 w-64">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Offline Cache</h3>
            {cacheInfo.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cached data</p>
            ) : (
              <div className="space-y-2">
                {cacheInfo.map((info, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium">{info.key}</div>
                    <div className="text-muted-foreground">
                      {info.count} facilities • {info.age}m ago
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleClearCache}
                  className="w-full mt-2"
                >
                  Clear Cache
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapControls;
