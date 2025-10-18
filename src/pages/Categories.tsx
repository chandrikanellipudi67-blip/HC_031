import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hospital, Health, ShoppingCart, Drop, Danger } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { supabase } from '@/integrations/supabase/client';
import { CategoryCardSkeleton } from '@/components/SkeletonLoader';
import { toast } from 'sonner';

const Categories = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('type')
        .eq('verified', true);

      if (error) throw error;

      const countMap: Record<string, number> = {
        hospital: 0,
        clinic: 0,
        pharmacy: 0,
        blood_bank: 0,
        emergency: 0,
      };

      data?.forEach((item) => {
        if (item.type in countMap) {
          countMap[item.type]++;
        }
      });

      setCounts(countMap);
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast.error('Failed to load category counts');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'hospital', type: 'hospital', icon: Hospital, color: 'bg-blue-500' },
    { key: 'clinic', type: 'clinic', icon: Health, color: 'bg-green-500' },
    { key: 'pharmacy', type: 'pharmacy', icon: ShoppingCart, color: 'bg-purple-500' },
    { key: 'bloodBank', type: 'blood_bank', icon: Drop, color: 'bg-red-500' },
    { key: 'emergency', type: 'emergency', icon: Danger, color: 'bg-orange-500' },
  ];

  const handleCategoryClick = (type: string) => {
    navigate(`/?type=${type}`);
  };

  return (
    <ResponsiveLayout>
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('categories.all')}
          </h1>
          <p className="text-muted-foreground">
            Browse medical facilities by type
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </>
          ) : (
            categories.map((category) => {
              const Icon = category.icon;
              const count = counts[category.type] || 0;
              
              return (
                <Card 
                  key={category.key} 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleCategoryClick(category.type)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mb-4`}>
                      <Icon size={24} variant="Outline" className="text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {t(`categories.${category.key}`)}
                    </h3>
                    <Badge variant="secondary">{count} locations</Badge>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Categories;
