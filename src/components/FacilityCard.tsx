import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hospital, Health, ShoppingCart, Drop, Danger, Location, Call, Clock, Star } from 'iconsax-react';

interface FacilityCardProps {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'blood_bank' | 'emergency';
  address: string;
  phone: string;
  distance?: number;
  verified: boolean;
  hours?: any;
}

const FacilityCard = ({ id, name, type, address, phone, distance, verified }: FacilityCardProps) => {
  const navigate = useNavigate();

  const getTypeIcon = () => {
    const iconProps = { size: 24, variant: 'Outline' as const };
    switch (type) {
      case 'hospital': return <Hospital {...iconProps} className="text-primary" />;
      case 'clinic': return <Health {...iconProps} className="text-success" />;
      case 'pharmacy': return <ShoppingCart {...iconProps} className="text-info" />;
      case 'blood_bank': return <Drop {...iconProps} className="text-destructive" />;
      case 'emergency': return <Danger {...iconProps} className="text-emergency" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'hospital': return 'bg-primary/10 text-primary border-primary/20';
      case 'clinic': return 'bg-success/10 text-success border-success/20';
      case 'pharmacy': return 'bg-info/10 text-info border-info/20';
      case 'blood_bank': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'emergency': return 'bg-emergency/10 text-emergency border-emergency/20';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 bg-card/50 backdrop-blur-sm border border-border/50"
      onClick={() => navigate(`/resource/${id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-none bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate text-base">{name}</h3>
              {verified && (
                <Badge className="flex-shrink-0 text-xs bg-success/10 text-success border-success/20">
                  <Star size={12} variant="Outline" className="mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Location size={16} className="flex-shrink-0 text-primary" />
                <span className="truncate">{address}</span>
              </div>
              
              {distance && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="flex-shrink-0 text-accent" />
                  <span className="font-medium">{formatDistance(distance)} away</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge className={`${getTypeColor()} border font-medium`}>
                {type.replace('_', ' ')}
              </Badge>
              
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                  onClick={handleCall}
                >
                  <Call size={16} variant="Outline" />
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilityCard;