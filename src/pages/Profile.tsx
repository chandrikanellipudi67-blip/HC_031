import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Globe, LogOut } from 'lucide-react';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
  };

  return (
    <ResponsiveLayout>
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('nav.profile')}
          </h1>
        </div>

        {user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>{user.email}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {user.user_metadata?.name || 'User'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('profile.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label>{t('profile.language')}</Label>
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {user && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        )}

        {!user && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground mb-4">
                Sign in to save favorites and access personalized features
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                {t('auth.login')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default Profile;
