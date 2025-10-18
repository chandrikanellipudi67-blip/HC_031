import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

const Favorites = () => {
  const { t } = useTranslation();

  return (
    <ResponsiveLayout>
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('nav.favorites')}
          </h1>
          <p className="text-muted-foreground">
            Your saved medical facilities
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Save medical facilities to access them quickly in the future
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Favorites;
