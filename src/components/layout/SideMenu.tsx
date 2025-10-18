import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home2, 
  Heart, 
  Call, 
  User, 
  Category2,
  Hospital,
  Health,
  ShoppingCart,
  Drop,
  Danger,
  InfoCircle,
  Setting2,
  Logout,
  Login
} from 'iconsax-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const mainMenuItems = [
    { icon: Home2, label: t('nav.home'), path: '/' },
    { icon: Heart, label: t('nav.favorites'), path: '/favorites' },
    { icon: Call, label: t('nav.emergency'), path: '/emergency' },
    { icon: User, label: t('nav.profile'), path: '/profile' },
    // PHR quick links
    { icon: Health, label: 'PHR Login', path: '/phr/login' },
    { icon: Hospital, label: 'My Records', path: '/phr/patient' },
    { icon: Heart, label: 'Doctor Dashboard', path: '/phr/doctor' },
    { icon: Hospital, label: 'Find Provider', path: '/phr/find-provider' },
    { icon: Call, label: 'Assistant Chat', path: '/phr/chat' },
  ];

  const categoryItems = [
    { icon: Hospital, label: t('categories.hospital'), path: '/categories?type=hospital' },
    { icon: Health, label: t('categories.clinic'), path: '/categories?type=clinic' },
    { icon: ShoppingCart, label: t('categories.pharmacy'), path: '/categories?type=pharmacy' },
    { icon: Drop, label: t('categories.bloodBank'), path: '/categories?type=blood_bank' },
    { icon: Danger, label: t('categories.emergency'), path: '/categories?type=emergency' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span>{t('app.name')}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
              {t('menu.navigation')}
            </h3>
            <div className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon size={24} variant="Outline" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
              <Category2 size={20} />
              {t('categories.all')}
            </h3>
            <div className="space-y-1">
              {categoryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon size={24} variant="Outline" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Settings & Info */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleNavigation('/settings')}
            >
              <Setting2 size={24} variant="Outline" />
              <span>{t('menu.settings')}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleNavigation('/about')}
            >
              <InfoCircle size={24} variant="Outline" />
              <span>{t('menu.about')}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleNavigation('/phr/export')}
            >
              <Hospital size={24} variant="Outline" />
              <span>Export / QR</span>
            </Button>
          </div>

          <Separator />

          {/* Auth Actions */}
          <div>
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <Logout size={24} variant="Outline" />
                <span>{t('auth.signOut')}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigation('/auth')}
              >
                <Login size={24} variant="Outline" />
                <span>{t('auth.signIn')}</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideMenu;
