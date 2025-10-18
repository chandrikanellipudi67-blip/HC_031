import { Button } from '@/components/ui/button';
import { Hospital, Health, ShoppingCart, Drop, Danger, Clock } from 'iconsax-react';

interface QuickFiltersProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  showOpenNow?: boolean;
}

const QuickFilters = ({ selectedType, onTypeChange, showOpenNow }: QuickFiltersProps) => {
  const filters = [
    { type: 'hospital', label: 'Hospitals', icon: Hospital, color: 'hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-200' },
    { type: 'clinic', label: 'Clinics', icon: Health, color: 'hover:bg-green-500/10 hover:text-green-600 hover:border-green-200' },
    { type: 'pharmacy', label: 'Pharmacies', icon: ShoppingCart, color: 'hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-200' },
    { type: 'blood_bank', label: 'Blood Banks', icon: Drop, color: 'hover:bg-red-500/10 hover:text-red-600 hover:border-red-200' },
    { type: 'emergency', label: 'Emergency', icon: Danger, color: 'hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-200' },
  ];

  const getActiveColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'clinic': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'pharmacy': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'blood_bank': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'emergency': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Quick Filters</h3>
        {selectedType && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange(null)}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedType === filter.type;
          
          return (
            <Button
              key={filter.type}
              variant="outline"
              size="sm"
              onClick={() => onTypeChange(isActive ? null : filter.type)}
              className={`flex-shrink-0 gap-2 ${isActive ? getActiveColor(filter.type) : filter.color}`}
            >
              <Icon size={16} variant={isActive ? 'Bold' : 'Outline'} />
              {filter.label}
            </Button>
          );
        })}
        
        {showOpenNow && (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-2 hover:bg-primary/10 hover:text-primary"
          >
            <Clock size={16} />
            Open Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuickFilters;